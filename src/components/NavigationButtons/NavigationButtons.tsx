interface NavigationButtonsProps {
  canGoBack: boolean;
  onBack: () => void;
  onRestart: () => void;
}

export function NavigationButtons({ canGoBack, onBack, onRestart }: NavigationButtonsProps) {
  return (
    <nav className="navigation-buttons" aria-label="Navegacao do atendimento">
      <button type="button" onClick={onBack} disabled={!canGoBack}>
        Voltar
      </button>
      <button type="button" onClick={onRestart}>
        Recomeçar atendimento
      </button>
    </nav>
  );
}
