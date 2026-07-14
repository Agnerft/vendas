import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadStoredBestPanelConfig } from './adminConfig.mjs';

const execFileAsync = promisify(execFile);

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

function requestAppsApi(method, url, headers = {}, body = '') {
  const args = [
    '-sS',
    '--max-time',
    '30',
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

  return execFileAsync('curl', args, { timeout: 35000, maxBuffer: 1024 * 1024 }).then(({ stdout }) => {
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
      throw new Error('Tempo esgotado ao chamar painel de apps.');
    }

    throw error;
  });
}

function buildMultipartBody(fields) {
  const boundary = `----nixplay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const body = Object.entries(fields)
    .map(([name, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`)
    .join('') + `--${boundary}--\r\n`;

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function loginAppsPanel(config) {
  const login = config.login || 'revendaluiz';
  const password = config.appsPassword || config.login || 'revendaluiz';
  const multipart = buildMultipartBody({ username: login, password });

  const response = await requestAppsApi('POST', 'https://apps-api.painel.best/login', {
      Accept: 'application/json',
      Origin: 'https://apps.painel.best',
      Referer: 'https://apps.painel.best/',
      'Content-Type': multipart.contentType,
    }, multipart.body);
  const body = response.body;

  if (!response.ok || !body.access_token) {
    throw new Error(`Falha ao autenticar no painel de apps. Codigo ${response.status}.`);
  }

  return body.access_token;
}

async function createMaxPlayerUser(lineId, config) {
  const accessToken = await loginAppsPanel(config);
  const headers = {
    Accept: 'application/json, text/plain, */*',
    Authorization: `Bearer ${accessToken}`,
    Origin: 'https://apps.painel.best',
    Referer: 'https://apps.painel.best/',
  };

  await requestAppsApi('DELETE', `https://apps-api.painel.best/max-player/users/${lineId}`, headers)
    .catch(() => undefined);

  const createBody = JSON.stringify({
    line_id: lineId,
    domain_id: config.maxPlayerDomainId || '1779208587735814489',
  });
  const response = await requestAppsApi('POST', 'https://apps-api.painel.best/max-player/users', {
      ...headers,
      'Content-Type': 'application/json',
    }, createBody);
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

  if (response.ok && body.selectedApp === 'MAXPLAYER' && rawBody?.id) {
    try {
      rawBody.max_player = await createMaxPlayerUser(rawBody.id, storedConfig);
    } catch (error) {
      return {
        status: 502,
        body: {
          message: error instanceof Error ? error.message : 'Teste criado, mas falhou ao criar Max Player.',
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

export function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Best-Api-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  response.end(JSON.stringify(body));
}
