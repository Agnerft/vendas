import type { SalesFlowData } from '../types/salesFlow';

const STORAGE_KEY = 'iptv-sales-flow';

export function loadSalesFlow(): SalesFlowData | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SalesFlowData) : null;
  } catch (error) {
    console.warn('Nao foi possivel carregar o atendimento salvo.', error);
    return null;
  }
}

export function saveSalesFlow(data: SalesFlowData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearSalesFlow(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
