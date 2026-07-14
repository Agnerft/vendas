import type { ReactNode } from 'react';
import { useSalesFlow } from '../hooks/useSalesFlow';
import { SalesFlowContext } from './SalesFlowContext';

export function SalesFlowProvider({ children }: { children: ReactNode }) {
  const value = useSalesFlow();
  return <SalesFlowContext.Provider value={value}>{children}</SalesFlowContext.Provider>;
}
