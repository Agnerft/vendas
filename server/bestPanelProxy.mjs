import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadStoredBestPanelConfig } from './adminConfig.mjs';

const execFileAsync = promisify(execFile);
const APPS_API_TIMEOUT_SECONDS = 60;
const APPS_API_RETRIES = 3;
const APPS_API_PROCESS_TIMEOUT = (APPS_API_TIMEOUT_SECONDS + 5) * 1000;

export async function parseJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

function sanitizeEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
    throw new Error('Endpoint invalido.');
  }

  return endpoint;
}

function buildPanelHeaders(apiToken) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Api-Key': apiToken,
  };
}

function normalizePackageId(packageId) {
  const numericPackageId = Number(packageId);
  return Number.isNaN(numericPackageId) ? packageId : numericPackageId;
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function withRetry(action, label, retries = APPS_API_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await wait(1000 * attempt);
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : `Falha ao executar ${label}.`;
  throw new Error(`${label} falhou apos ${retries} tentativas: ${message}`);
}

function requestAppsApi(method, url, headers = {}, body = '') {
  const args = [
    '-sS',
    '--max-time',
    String(APPS_API_TIMEOUT_SECONDS),
    '-X',
    method,
    url,
    '-w',
    '\n__HTTP_STATUS__%{http_code}',
  ];

  for (const [name, value] of Object.entries(headers)) {
    args.push('-H', `${name}: ${value}`);
  }

  if (body) {
    args.push('--data-binary', body);
  }

  return execFileAsync('curl', args, { timeout: APPS_API_PROCESS_TIMEOUT, maxBuffer: 1024 * 1024 }).then(({ stdout }) => {
    const marker = '\n__HTTP_STATUS__';
    const markerIndex = stdout.lastIndexOf(marker);
    const text = markerIndex >= 0 ? stdout.slice(0, markerIndex) : stdout;
    const status = markerIndex >= 0 ? Number(stdout.slice(markerIndex + marker.length).trim()) : 0;
    const parsedBody = text ? JSON.parse(text) : {};

    return {
      status,
      ok: status >= 200 && status < 400,
      body: parsedBody,
    };
  }).catch((error) => {
    if (error.killed || error.signal === 'SIGTERM') {
      throw new Error(`Tempo esgotado ao chamar painel de apps (${APPS_API_TIMEOUT_SECONDS}s).`);
    }

    throw error;
  });
}

function parseCurlJson(stdout) {
  const marker = '\n__HTTP_STATUS__';
  const markerIndex = stdout.lastIndexOf(marker);
  const text = markerIndex >= 0 ? stdout.slice(0, markerIndex) : stdout;
  const status = markerIndex >= 0 ? Number(stdout.slice(markerIndex + marker.length).trim()) : 0;

  return {
    status,
    ok: status >= 200 && status < 400,
    body: text ? JSON.parse(text) : {},
  };
}

async function loginAppsPanel(config) {
  const login = config.login || 'revendaluiz';
  const password = config.appsPassword || config.login || 'revendaluiz';
  const response = await execFileAsync('curl', [
    '-sS',
    '--max-time',
    String(APPS_API_TIMEOUT_SECONDS),
    '-X',
    'POST',
    'https://apps-api.painel.best/login',
    '-H',
    'accept: application/json',
    '-H',
    'origin: https://apps.painel.best',
    '-H',
    'referer: https://apps.painel.best/',
    '-F',
    `username=${login}`,
    '-F',
    `password=${password}`,
    '-w',
    '\n__HTTP_STATUS__%{http_code}',
  ], { timeout: APPS_API_PROCESS_TIMEOUT, maxBuffer: 1024 * 1024 })
    .then(({ stdout }) => parseCurlJson(stdout))
    .catch((error) => {
      if (error.killed || error.signal === 'SIGTERM') {
        throw new Error(`Tempo esgotado ao autenticar no painel de apps (${APPS_API_TIMEOUT_SECONDS}s).`);
      }

      throw error;
    });
  const body = response.body;

  if (!response.ok || !body.access_token) {
    throw new Error(`Falha ao autenticar no painel de apps. Codigo ${response.status}.`);
  }

  return body.access_token;
}

async function createMaxPlayerUser(lineId, config, accessToken) {
  const headers = {
    Accept: 'application/json, text/plain, */*',
    Authorization: `Bearer ${accessToken}`,
    Origin: 'https://apps.painel.best',
    Referer: 'https://apps.painel.best/',
  };

  await withRetry(
    () => requestAppsApi('DELETE', `https://apps-api.painel.best/max-player/users/${lineId}`, headers),
    'Remocao de usuario antigo no Max Player',
    2,
  )
    .catch(() => undefined);

  const createBody = JSON.stringify({
    line_id: lineId,
    domain_id: config.maxPlayerDomainId || '1779208587735814489',
  });
  const response = await withRetry(
    () => requestAppsApi('POST', 'https://apps-api.painel.best/max-player/users', {
        ...headers,
        'Content-Type': 'application/json',
      }, createBody),
    'Criacao de usuario no Max Player',
  );
  const body = response.body;

  if (!response.ok) {
    const detail = typeof body === 'object' && body?.detail ? body.detail : JSON.stringify(body);
    throw new Error(`Teste criado, mas falhou ao criar Max Player: ${detail}`);
  }

  return body;
}

export async function createBestPanelTrial(request) {
  const body = await parseJsonBody(request);
  const storedConfig = await loadStoredBestPanelConfig();
  const endpoint = sanitizeEndpoint(body.endpoint || storedConfig.endpoint);
  const apiToken = request.headers['x-best-api-token'] || storedConfig.apiToken;
  const shouldCreateMaxPlayer = body.selectedApp === 'MAXPLAYER';
  const payload = {
    ...body.payload,
    notes: body.payload?.notes || storedConfig.notes || null,
    email: body.payload?.email ?? null,
    phone: body.payload?.phone || '',
    type: body.payload?.type ?? null,
    plan_value: body.payload?.plan_value ?? null,
    package_id: normalizePackageId(body.payload?.package_id || storedConfig.packageId),
  };

  if (!apiToken || !payload.package_id) {
    return {
      status: 400,
      body: {
        message: 'Configure API token e package no admin.',
      },
    };
  }

  let response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: buildPanelHeaders(apiToken),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      status: 502,
      body: {
        message: error instanceof Error ? error.message : 'Falha de rede ao chamar o painel.',
      },
    };
  }

  const contentType = response.headers.get('content-type') ?? '';
  const rawBody = contentType.includes('application/json') ? await response.json() : await response.text();

  if (response.ok && shouldCreateMaxPlayer && rawBody?.id) {
    try {
      const maxPlayerAccessToken = await withRetry(
        () => loginAppsPanel(storedConfig),
        'Login no painel de apps',
      );
      rawBody.max_player = await createMaxPlayerUser(rawBody.id, storedConfig, maxPlayerAccessToken);
    } catch (error) {
      return {
        status: 502,
        body: {
          message: error instanceof Error
            ? `Teste criado, mas o Max Player nao respondeu corretamente. ${error.message}`
            : 'Teste criado, mas falhou ao criar Max Player.',
          trial: rawBody,
        },
      };
    }
  }

  return {
    status: response.status,
    body: rawBody,
  };
}

export async function getBestPanelBouquets() {
  const storedConfig = await loadStoredBestPanelConfig();

  if (!storedConfig.apiToken) {
    return {
      status: 400,
      body: {
        message: 'Configure API token no admin para buscar bouquets.',
      },
    };
  }

  try {
    const response = await fetch('https://api.painel.best/bouquets/', {
      method: 'GET',
      headers: buildPanelHeaders(storedConfig.apiToken),
    });
    const contentType = response.headers.get('content-type') ?? '';
    const rawBody = contentType.includes('application/json') ? await response.json() : await response.text();

    return {
      status: response.status,
      body: rawBody,
    };
  } catch (error) {
    return {
      status: 502,
      body: {
        message: error instanceof Error ? error.message : 'Falha de rede ao buscar bouquets.',
      },
    };
  }
}

export function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Best-Api-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  response.end(JSON.stringify(body));
}
