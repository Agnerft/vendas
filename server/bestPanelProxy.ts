import type { IncomingMessage, ServerResponse } from 'node:http';

interface ProxyRequestBody {
  endpoint?: unknown;
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

export async function createBestPanelTrial(request: IncomingMessage) {
  const body = await parseJsonBody(request);
  const endpoint = sanitizeEndpoint(body.endpoint);
  const apiToken = request.headers['x-best-api-token'];
  const payload = {
    ...body.payload,
    username: body.payload?.username ?? '',
    password: body.payload?.password ?? '',
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
  const rawBody = contentType.includes('application/json') ? await response.json() : await response.text();

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
