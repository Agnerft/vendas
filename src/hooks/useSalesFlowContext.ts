import { useContext } from 'react';
import { SalesFlowContext } from '../context/SalesFlowContext';

export function useSalesFlowContext() {
  const context = useContext(SalesFlowContext);

  if (!context) {
    throw new Error('useSalesFlowContext deve ser usado dentro de SalesFlowProvider');
  }

  return context;
}
