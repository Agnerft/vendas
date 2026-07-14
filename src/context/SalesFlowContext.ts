import { createContext } from 'react';
import type { useSalesFlow } from '../hooks/useSalesFlow';

export type SalesFlowContextValue = ReturnType<typeof useSalesFlow>;

export const SalesFlowContext = createContext<SalesFlowContextValue | null>(null);
