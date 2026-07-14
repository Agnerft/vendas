import { appConfig } from '../config/appConfig';

export interface BestPanelConfig {
  endpoint: string;
  login: string;
  apiToken: string;
  packageId: string;
  notes: string;
}

const BEST_PANEL_CONFIG_KEY = 'iptv-best-panel-config';

export function getDefaultBestPanelConfig(): BestPanelConfig {
  return {
    endpoint: appConfig.bestPanel.endpoint,
    login: appConfig.bestPanel.login,
    apiToken: appConfig.bestPanel.apiToken,
    packageId: appConfig.bestPanel.packageId,
    notes: appConfig.bestPanel.notes,
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
