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
import type { FlowOption, TrialCreationResult } from '../types/salesFlow';
import { formatBrazilianPhone } from '../utils/phone';

function getSupportUrl(phone: string) {
  if (!appConfig.supportWhatsapp) {
    return '';
  }

  const message = `${appConfig.supportMessage} Meu telefone: ${formatBrazilianPhone(phone)}.`;
  return `https://wa.me/${appConfig.supportWhatsapp}?text=${encodeURIComponent(message)}`;
}

function getResultRows(trial: TrialCreationResult) {
  return [
    ['Aplicativo', trial.appName],
    [trial.accessLabel, trial.accessCode],
    ['Usuario', trial.username],
    ['Senha', trial.password],
    ['Tempo de teste', trial.testDuration],
    ['Valido ate', trial.expiresAt],
    ['Senha conteudo adulto', trial.adultPassword],
  ].filter((row): row is [string, string] => Boolean(row[0] && row[1]));
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
          <p className="follow-up-question">Voce conseguiu instalar o UHD PLAYER PRO?</p>
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
      const resultRows = getResultRows(data.trial);

      return (
        <div className={`completion-box completion-${data.trial.status}`}>
          <div className="completion-heading">
            <strong>{isTrialSuccess ? 'Teste criado com sucesso.' : 'Nao conseguimos criar seu teste agora.'}</strong>
            <span>
            {isTrialSuccess
              ? 'Dados prontos para enviar ao cliente.'
              : 'Voce pode tentar novamente ou chamar nosso suporte para finalizar o atendimento.'}
            </span>
          </div>
          {isTrialSuccess ? (
            <div className="credential-list">
              {resultRows.map(([label, value]) => (
                <div className="credential-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
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
        <div className="logo-mark" aria-label={appConfig.companyName}>
          <img src={appConfig.logoIcon} alt={appConfig.companyName} />
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
