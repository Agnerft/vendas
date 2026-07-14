import { AppInstructions } from '../components/AppInstructions/AppInstructions';
import { AppPreview } from '../components/AppPreview/AppPreview';
import { FlowCard } from '../components/FlowCard/FlowCard';
import { NavigationButtons } from '../components/NavigationButtons/NavigationButtons';
import { OptionButton } from '../components/OptionButton/OptionButton';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import { ProgressBar } from '../components/ProgressBar/ProgressBar';
import { appConfig } from '../config/appConfig';
import { stepAssetMap, stepPreviewModeMap } from '../config/appAssets';
import { useSalesFlowContext } from '../hooks/useSalesFlowContext';
import type { FlowOption } from '../types/salesFlow';
import { formatBrazilianPhone } from '../utils/phone';

function getSupportUrl(phone: string) {
  if (!appConfig.supportWhatsapp) {
    return '';
  }

  const message = `${appConfig.supportMessage} Meu telefone: ${formatBrazilianPhone(phone)}.`;
  return `https://wa.me/${appConfig.supportWhatsapp}?text=${encodeURIComponent(message)}`;
}

export function SalesAssistantPage() {
  const {
    canGoBack,
    chooseOption,
    currentStep,
    data,
    goBack,
    isBusy,
    prepareTrial,
    progress,
    restart,
    submitPhone,
  } = useSalesFlowContext();

  const supportUrl = getSupportUrl(data.phone);
  const previewApp = stepAssetMap[currentStep.id];
  const previewMode = stepPreviewModeMap[currentStep.id] ?? 'wide';

  function handleOption(option: FlowOption) {
    if (option.external === 'support') {
      chooseOption(option);

      if (supportUrl) {
        window.open(supportUrl, '_blank', 'noopener,noreferrer');
      }

      return;
    }

    chooseOption(option);
  }

  function renderContent() {
    if (currentStep.type === 'phone') {
      return <PhoneInput initialValue={data.phone} onSubmit={(phone) => submitPhone(phone, 'manual')} />;
    }

    if (currentStep.type === 'phone-confirm') {
      return (
        <>
          <div className="phone-preview">{formatBrazilianPhone(data.phone)}</div>
          <div className="option-list">
            {currentStep.options?.map((option) => (
              <OptionButton key={option.id} option={option} onSelect={handleOption} />
            ))}
          </div>
        </>
      );
    }

    if (currentStep.type === 'instructions') {
      return (
        <>
          <AppInstructions />
          <p className="follow-up-question">Voce conseguiu instalar o UHD ULTRA PLAYER?</p>
          <div className="option-list">
            {currentStep.options?.map((option) => (
              <OptionButton key={option.id} option={option} onSelect={handleOption} />
            ))}
          </div>
        </>
      );
    }

    if (currentStep.type === 'ready') {
      return (
        <>
          {currentStep.appToPrepare ? (
            <AppPreview app={currentStep.appToPrepare} compact mode={previewMode} />
          ) : null}
          <button
            type="button"
            className="primary-action"
            onClick={() => void prepareTrial(currentStep.appToPrepare)}
            disabled={isBusy}
          >
            {isBusy ? 'Preparando...' : 'CRIAR TESTE'}
          </button>
        </>
      );
    }

    if (currentStep.id === 'trial-placeholder') {
      const isTrialSuccess = data.trial.status === 'success';

      return (
        <div className={`completion-box completion-${data.trial.status}`}>
          <strong>{isTrialSuccess ? 'Teste criado com sucesso.' : 'Nao conseguimos criar seu teste agora.'}</strong>
          <span>
            {isTrialSuccess
              ? data.trial.message ?? 'Seu acesso foi preparado. Guarde os dados abaixo.'
              : 'Voce pode tentar novamente ou chamar nosso suporte para finalizar o atendimento.'}
          </span>
          {data.trial.username ? (
            <div className="credential-grid">
              <span>Usuario</span>
              <strong>{data.trial.username}</strong>
            </div>
          ) : null}
          {data.trial.password ? (
            <div className="credential-grid">
              <span>Senha</span>
              <strong>{data.trial.password}</strong>
            </div>
          ) : null}
          {data.trial.status === 'error' ? (
            <>
              <div className="completion-actions">
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => void prepareTrial(data.selectedApp ?? undefined)}
                  disabled={isBusy}
                >
                  {isBusy ? 'Tentando novamente...' : 'Tentar novamente'}
                </button>
                {supportUrl ? (
                  <a className="support-action" href={supportUrl} target="_blank" rel="noreferrer">
                    Falar com suporte
                  </a>
                ) : null}
              </div>
              {data.trial.message ? (
                <details className="technical-details">
                  <summary>Detalhes tecnicos</summary>
                  <p>{data.trial.message}</p>
                </details>
              ) : null}
            </>
          ) : null}
        </div>
      );
    }

    return (
      <div className={currentStep.type === 'device-options' ? 'device-grid' : 'option-list'}>
        {currentStep.options?.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            onSelect={handleOption}
            variant={currentStep.type === 'device-options' ? 'device' : 'default'}
          />
        ))}
        {currentStep.options?.some((option) => option.external === 'support') && !supportUrl ? (
          <p className="form-note">
            Configure o WhatsApp de suporte para abrir o atendimento automaticamente.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <main className="assistant-shell">
      <header className="app-header">
        <div className="logo-mark" aria-hidden="true">
          <img src={appConfig.logoIcon} alt="" />
        </div>
        <div>
          <strong>{appConfig.companyName}</strong>
          <span>Atendimento guiado</span>
        </div>
      </header>

      <ProgressBar value={progress} />

      <FlowCard
        key={currentStep.id}
        eyebrow={currentStep.eyebrow}
        title={currentStep.title}
        description={currentStep.description}
      >
        {previewApp && currentStep.type !== 'instructions' && currentStep.type !== 'ready' ? (
          <AppPreview app={previewApp} compact={currentStep.type === 'options'} mode={previewMode} />
        ) : null}
        {renderContent()}
      </FlowCard>

      <NavigationButtons canGoBack={canGoBack} onBack={goBack} onRestart={restart} />
    </main>
  );
}
