import type {
  BestPanelTrialRequest,
  BestPanelTrialResponse,
  FlowPayload,
  SalesFlowData,
} from '../types/salesFlow';
import { loadBestPanelConfig, loadPublicBestPanelConfig } from '../utils/bestPanelConfig';
import type { PublicBestPanelConfig } from '../utils/bestPanelConfig';

const wait = (milliseconds = 180) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

export async function saveFlowProgress(data: SalesFlowData): Promise<SalesFlowData> {
  console.info('Salvando progresso do atendimento', data);
  await wait();
  return data;
}

export async function finishFlow(data: SalesFlowData): Promise<FlowPayload> {
  const payload: FlowPayload = {
    phone: data.phone,
    device: data.device,
    selectedApp: data.selectedApp,
    answers: data.answers,
    status: 'READY_TO_CREATE_TRIAL',
  };

  console.info('Atendimento pronto para criar teste', payload);
  await wait();
  return payload;
}

function getStringFromResponse(raw: unknown, keys: string[]): string | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  for (const key of keys) {
    const value = (raw as Record<string, unknown>)[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  for (const value of Object.values(raw as Record<string, unknown>)) {
    const nested = getStringFromResponse(value, keys);

    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function getReadableError(raw: unknown, fallback: string) {
  const directMessage = getStringFromResponse(raw, ['message', 'error', 'detail']);

  if (directMessage) {
    return directMessage;
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }

  if (raw) {
    try {
      return JSON.stringify(raw);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function assertBestPanelConfig(config: PublicBestPanelConfig) {
  const { endpoint, hasApiToken, packageId } = config;

  if (!endpoint || !hasApiToken || !packageId) {
    throw new Error('Configure endpoint, API key e package do painel antes de criar o teste.');
  }
}

function buildBestPanelPayload(data: SalesFlowData, config: PublicBestPanelConfig): BestPanelTrialRequest {
  return {
    type: null,
    email: null,
    notes: config.notes || null,
    phone: data.phone,
    plan_value: null,
    package_id: config.packageId,
  };
}

function buildBestPanelHeaders(): HeadersInit {
  const { apiToken } = loadBestPanelConfig();

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Best-Api-Token': apiToken,
  };
}

async function getServerBestPanelConfig() {
  try {
    return await loadPublicBestPanelConfig();
  } catch {
    const localConfig = loadBestPanelConfig();

    return {
      endpoint: localConfig.endpoint,
      login: localConfig.login,
      packageId: localConfig.packageId,
      notes: localConfig.notes,
      hasApiToken: Boolean(localConfig.apiToken),
    };
  }
}

async function readTrialResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  if (text.trim().startsWith('<!doctype html') || text.trim().startsWith('<html')) {
    throw new Error(
      'A rota /api/create-trial nao esta respondendo como API. Rode com npm run dev ou faca build e use npm run start.',
    );
  }

  if (!response.ok) {
    return text;
  }

  throw new Error('O proxy de criacao de teste retornou uma resposta invalida.');
}

export async function createTrial(data: SalesFlowData): Promise<BestPanelTrialResponse> {
  const config = await getServerBestPanelConfig();
  assertBestPanelConfig(config);

  const payload = buildBestPanelPayload(data, config);
  console.info('Criando teste no The Best', {
    ...payload,
    phone: payload.phone,
    username: payload.username,
  });

  let response: Response;

  try {
    response = await fetch('/api/create-trial', {
      method: 'POST',
      headers: buildBestPanelHeaders(),
      body: JSON.stringify({
        endpoint: config.endpoint,
        selectedApp: data.selectedApp,
        payload,
      }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Nao foi possivel chamar o proxy de criacao de teste: ${error.message}`
        : 'Nao foi possivel chamar o proxy de criacao de teste.',
    );
  }

  const raw = await readTrialResponse(response);

  if (!response.ok) {
    const message = getReadableError(raw, `Nao foi possivel criar o teste. Codigo ${response.status}.`);

    throw new Error(message);
  }

  return {
    ok: true,
    message: getStringFromResponse(raw, ['message', 'detail', 'status']) ?? 'Teste criado com sucesso.',
    username: getStringFromResponse(raw, ['username', 'user', 'login']),
    password: getStringFromResponse(raw, ['password', 'pass', 'senha']),
    raw,
  };
}
