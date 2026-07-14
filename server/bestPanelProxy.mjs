import { loadStoredBestPanelConfig } from './adminConfig.mjs';

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

function buildPanelHeaders(apiToken, login) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    username: login,
    api_key: apiToken,
  };
}

export async function createBestPanelTrial(request) {
  const body = await parseJsonBody(request);
  const storedConfig = await loadStoredBestPanelConfig();
  const endpoint = sanitizeEndpoint(body.endpoint || storedConfig.endpoint);
  const apiToken = request.headers['x-best-api-token'] || storedConfig.apiToken;
  const login = request.headers['x-best-login'] || storedConfig.login;
  const payload = {
    ...body.payload,
    notes: body.payload?.notes || storedConfig.notes,
    package_id: body.payload?.package_id || storedConfig.packageId,
  };

  if (!apiToken || !login || !payload.package_id) {
    return {
      status: 400,
      body: {
        message: 'Configure API, login e package no admin.',
      },
    };
  }

  let response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: buildPanelHeaders(apiToken, login),
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

  return {
    status: response.status,
    body: rawBody,
  };
}

export function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Best-Api-Token, X-Best-Login',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  response.end(JSON.stringify(body));
}
