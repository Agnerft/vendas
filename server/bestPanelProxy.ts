import type { IncomingMessage, ServerResponse } from 'node:http';

interface ProxyRequestBody {
  endpoint?: unknown;
  selectedApp?: unknown;
  payload?: Record<string, unknown>;
}

export async function parseJsonBody(request: IncomingMessage): Promise<ProxyRequestBody> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

function sanitizeEndpoint(endpoint: unknown) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
    throw new Error('Endpoint invalido.');
  }

  return endpoint;
}

function buildPanelHeaders(apiToken: string) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Api-Key': apiToken,
  };
}

function normalizePackageId(packageId: unknown) {
  const numericPackageId = Number(packageId);
  return Number.isNaN(numericPackageId) ? packageId : numericPackageId;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function loginAppsPanel() {
  const form = new FormData();
  form.append('username', 'revendaluiz');
  form.append('password', 'revendaluiz');

  const response = await fetchWithTimeout('https://apps-api.painel.best/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Origin: 'https://apps.painel.best',
      Referer: 'https://apps.painel.best/',
    },
    body: form,
  });
  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok || !body.access_token) {
    throw new Error(`Falha ao autenticar no painel de apps. Codigo ${response.status}.`);
  }

  return String(body.access_token);
}

async function createMaxPlayerUser(lineId: unknown) {
  const accessToken = await loginAppsPanel();
  const headers = {
    Accept: 'application/json, text/plain, */*',
    Authorization: `Bearer ${accessToken}`,
    Origin: 'https://apps.painel.best',
    Referer: 'https://apps.painel.best/',
  };

  await fetchWithTimeout(`https://apps-api.painel.best/max-player/users/${lineId}`, {
    method: 'DELETE',
    headers,
  }, 8000).catch(() => undefined);

  const response = await fetchWithTimeout('https://apps-api.painel.best/max-player/users', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      line_id: lineId,
      domain_id: '1779208587735814489',
    }),
  });
  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const detail = body.detail ? String(body.detail) : JSON.stringify(body);
    throw new Error(`Teste criado, mas falhou ao criar Max Player: ${detail}`);
  }

  return body;
}

export async function createBestPanelTrial(request: IncomingMessage) {
  const body = await parseJsonBody(request);
  const endpoint = sanitizeEndpoint(body.endpoint);
  const apiToken = request.headers['x-best-api-token'];
  const payload = {
    ...body.payload,
    notes: body.payload?.notes ?? null,
    email: body.payload?.email ?? null,
    phone: body.payload?.phone || '',
    type: body.payload?.type ?? null,
    plan_value: body.payload?.plan_value ?? null,
    package_id: normalizePackageId(body.payload?.package_id),
  };

  if (typeof apiToken !== 'string' || !payload.package_id) {
    return {
      status: 400,
      body: {
        message: 'Configure API token e package no admin.',
      },
    };
  }

  let response: Response;

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
  const rawBody = contentType.includes('application/json')
    ? ((await response.json()) as Record<string, unknown>)
    : await response.text();

  if (response.ok && body.selectedApp === 'MAXPLAYER' && typeof rawBody === 'object' && rawBody.id) {
    try {
      rawBody.max_player = await createMaxPlayerUser(rawBody.id);
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

export function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Best-Api-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  response.end(JSON.stringify(body));
}
