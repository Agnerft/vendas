import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const configPath = process.env.BEST_PANEL_CONFIG_PATH ?? join(process.cwd(), 'data', 'best-panel-config.json');
const adminPassword = process.env.ADMIN_PASSWORD ?? '123';

const defaultConfig = {
  endpoint: 'https://painel.best/api/test/',
  login: '',
  apiToken: '',
  packageId: '',
  notes: 'BotConversa CR7',
};

function normalizeConfig(config = {}) {
  return {
    endpoint: typeof config.endpoint === 'string' ? config.endpoint.trim() : defaultConfig.endpoint,
    login: typeof config.login === 'string' ? config.login.trim() : defaultConfig.login,
    apiToken: typeof config.apiToken === 'string' ? config.apiToken.trim() : defaultConfig.apiToken,
    packageId: typeof config.packageId === 'string' ? config.packageId.trim() : defaultConfig.packageId,
    notes: typeof config.notes === 'string' ? config.notes.trim() : defaultConfig.notes,
  };
}

function assertAdminPassword(password) {
  if (password !== adminPassword) {
    const error = new Error('Senha incorreta.');
    error.status = 401;
    throw error;
  }
}

export async function loadStoredBestPanelConfig() {
  try {
    const content = await readFile(configPath, 'utf8');
    return normalizeConfig(JSON.parse(content));
  } catch {
    return { ...defaultConfig };
  }
}

export async function saveStoredBestPanelConfig(config) {
  const nextConfig = normalizeConfig(config);
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, { mode: 0o600 });
  return nextConfig;
}

export function getPublicBestPanelConfig(config) {
  return {
    endpoint: config.endpoint,
    login: config.login,
    packageId: config.packageId,
    notes: config.notes,
    hasApiToken: Boolean(config.apiToken),
  };
}

export async function loadAdminBestPanelConfig(requestBody) {
  assertAdminPassword(requestBody.password);
  return loadStoredBestPanelConfig();
}

export async function saveAdminBestPanelConfig(requestBody) {
  assertAdminPassword(requestBody.password);
  return saveStoredBestPanelConfig(requestBody.config);
}

