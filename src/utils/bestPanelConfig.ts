import { appConfig } from '../config/appConfig';

export interface BestPanelConfig {
  endpoint: string;
  login: string;
  apiToken: string;
  packageId: string;
  notes: string;
  supportWhatsapp: string;
  supportMessage: string;
  voiceReaderEnabled: boolean;
}

export interface PublicBestPanelConfig extends Omit<BestPanelConfig, 'apiToken'> {
  hasApiToken: boolean;
}

const BEST_PANEL_CONFIG_KEY = 'iptv-best-panel-config';

export function getDefaultBestPanelConfig(): BestPanelConfig {
  return {
    endpoint: appConfig.bestPanel.endpoint,
    login: appConfig.bestPanel.login,
    apiToken: appConfig.bestPanel.apiToken,
    packageId: appConfig.bestPanel.packageId,
    notes: appConfig.bestPanel.notes,
    supportWhatsapp: appConfig.supportWhatsapp,
    supportMessage: appConfig.supportMessage,
    voiceReaderEnabled: false,
  };
}

export function loadBestPanelConfig(): BestPanelConfig {
  try {
    const stored = window.localStorage.getItem(BEST_PANEL_CONFIG_KEY);

    if (!stored) {
      return getDefaultBestPanelConfig();
    }

    return {
      ...getDefaultBestPanelConfig(),
      ...(JSON.parse(stored) as Partial<BestPanelConfig>),
    };
  } catch (error) {
    console.warn('Nao foi possivel carregar a configuracao do painel.', error);
    return getDefaultBestPanelConfig();
  }
}

export function saveBestPanelConfig(config: BestPanelConfig): void {
  window.localStorage.setItem(BEST_PANEL_CONFIG_KEY, JSON.stringify(config));
}

export async function loadPublicBestPanelConfig(): Promise<PublicBestPanelConfig> {
  const response = await fetch('/api/best-panel-config');

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a configuracao salva no servidor.');
  }

  return response.json() as Promise<PublicBestPanelConfig>;
}

export async function loadAdminBestPanelConfig(password: string): Promise<BestPanelConfig> {
  const response = await fetch('/api/admin/best-panel-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message ?? 'Nao foi possivel abrir a configuracao do admin.');
  }

  return body as BestPanelConfig;
}

export async function saveAdminBestPanelConfig(password: string, config: BestPanelConfig): Promise<BestPanelConfig> {
  const response = await fetch('/api/admin/best-panel-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, config }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message ?? 'Nao foi possivel salvar a configuracao no servidor.');
  }

  saveBestPanelConfig(body as BestPanelConfig);
  return body as BestPanelConfig;
}
