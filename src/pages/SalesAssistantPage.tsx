import { useEffect, useMemo, useState } from 'react';
import { AppInstructions } from '../components/AppInstructions/AppInstructions';
import { AppPreview } from '../components/AppPreview/AppPreview';
import { FlowCard } from '../components/FlowCard/FlowCard';
import { NavigationButtons } from '../components/NavigationButtons/NavigationButtons';
import { OptionButton } from '../components/OptionButton/OptionButton';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import { ProgressBar } from '../components/ProgressBar/ProgressBar';
import { appConfig } from '../config/appConfig';
import { appAssets, stepAssetMap, stepPreviewModeMap } from '../config/appAssets';
import { useSalesFlowContext } from '../hooks/useSalesFlowContext';
import type { FlowOption, SelectedApp, TrialCreationResult } from '../types/salesFlow';
import { loadPublicBestPanelConfig } from '../utils/bestPanelConfig';
import { formatBrazilianPhone } from '../utils/phone';

const TRIAL_WAIT_SECONDS = 240;
const FIRST_ACCESS_CHECK_SECONDS = 180;
const RETRY_NOTICE_SECONDS = 60;
const SECOND_ACCESS_CHECK_SECONDS = 120;
const PIX_RELEASE_SECONDS = 20;
const PIX_KEY = 'xyz';
const PIX_RECEIVER = 'Minha revenda';
const PIX_PLANS = [
  { id: 'monthly', label: 'MENSAL', price: '29,90' },
  { id: 'bimonthly', label: 'BIMESTRAL', price: '49,90' },
];

interface CatalogHighlight {
  title: string;
  year?: number | null;
  category: string;
  type: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  overview?: string;
}

interface CatalogHighlightsResponse {
  items?: CatalogHighlight[];
}

function getSupportUrl(phone: string, supportWhatsapp: string, supportMessage: string) {
  if (!supportWhatsapp) {
    return '';
  }

  const message = `${supportMessage} Meu telefone: ${formatBrazilianPhone(phone)}.`;
  return `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(message)}`;
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

function formatWaitTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
}

function buildActivationMessage(
  trial: TrialCreationResult,
  phone: string,
  selectedPlan: string,
  receiptName: string,
) {
  return [
    'Cliente enviou comprovante para ativacao.',
    `Telefone: ${formatBrazilianPhone(phone)}`,
    `Plano: ${selectedPlan}`,
    `Aplicativo: ${trial.appName ?? '-'}`,
    `Usuario: ${trial.username ?? '-'}`,
    `Senha: ${trial.password ?? '-'}`,
    `Validade do teste: ${trial.expiresAt ?? '-'}`,
    `Horario de criacao: ${trial.createdAt ? new Date(trial.createdAt).toLocaleString('pt-BR') : '-'}`,
    `Comprovante selecionado: ${receiptName}`,
    'Confira o comprovante anexado pelo cliente e faca a ativacao.',
  ].join('\n');
}

function getWhatsAppTextUrl(phone: string, message: string) {
  if (!phone) {
    return '';
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function getWaitingSteps(selectedApp: SelectedApp | null) {
  const appName = selectedApp ? appAssets[selectedApp].name : 'aplicativo';

  if (selectedApp === 'MAXPLAYER') {
    return [
      'Criando teste no painel',
      'Aguardando liberacao do acesso',
      'Vinculando usuario no MAX PLAYER',
      'Organizando os dados para envio',
    ];
  }

  return [
    'Criando teste no painel',
    'Aguardando liberacao do acesso',
    `Preparando dados do ${appName}`,
    'Organizando os dados para envio',
  ];
}

function getCatalogWindow(items: CatalogHighlight[], elapsedSeconds: number) {
  if (items.length <= 6) {
    return items;
  }

  const startIndex = Math.floor(elapsedSeconds / 14) % items.length;
  return Array.from({ length: 6 }, (_, index) => items[(startIndex + index) % items.length]);
}

function TrialWaitingScreen({ selectedApp }: { selectedApp: SelectedApp | null }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [catalogItems, setCatalogItems] = useState<CatalogHighlight[]>([]);
  const steps = useMemo(() => getWaitingSteps(selectedApp), [selectedApp]);
  const catalogWindow = useMemo(() => getCatalogWindow(catalogItems, elapsedSeconds), [catalogItems, elapsedSeconds]);
  const remainingSeconds = Math.max(0, TRIAL_WAIT_SECONDS - elapsedSeconds);
  const progress = Math.min(100, Math.round((elapsedSeconds / TRIAL_WAIT_SECONDS) * 100));
  const activeStep = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let ignoreResponse = false;

    void fetch('/data/catalog-highlights.json')
      .then((response) => (response.ok ? response.json() as Promise<CatalogHighlightsResponse> : Promise.reject()))
      .then((body) => {
        if (!ignoreResponse) {
          setCatalogItems(body.items ?? []);
        }
      })
      .catch(() => {
        if (!ignoreResponse) {
          setCatalogItems([]);
        }
      });

    return () => {
      ignoreResponse = true;
    };
  }, []);

  return (
    <section className="trial-waiting" aria-live="polite">
      <div className="waiting-timer">
        <span>{remainingSeconds > 0 ? 'Liberando em' : 'Finalizando'}</span>
        <strong>{formatWaitTime(remainingSeconds)}</strong>
      </div>
      <div className="waiting-progress" aria-hidden="true">
        <div style={{ width: `${progress}%` }} />
        <span>{progress}%</span>
      </div>
      <p>Nao feche esta tela. O painel pode levar ate 4 minutos para liberar o teste.</p>
      <div className="catalog-preview">
        <div>
          <span>Enquanto isso</span>
          <strong>Alguns lancamentos do catalogo</strong>
        </div>
        {catalogWindow.length > 0 ? (
          <div className="catalog-grid">
            {catalogWindow.map((item) => (
              <article key={`${item.category}-${item.title}`}>
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt="" loading="lazy" />
                ) : (
                  <div className="catalog-poster-fallback">{item.type}</div>
                )}
                <div>
                  <span>{item.category}{item.year ? ` - ${item.year}` : ''}</span>
                  <strong>{item.title}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Buscando filmes e series em destaque...</p>
        )}
      </div>
      <div className="waiting-steps">
        {steps.map((step, index) => (
          <div
            className={`waiting-step ${index < activeStep ? 'done' : ''} ${index === activeStep ? 'active' : ''}`}
            key={step}
          >
            <span>{index < activeStep ? 'OK' : index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PostTrialActivation({
  phone,
  supportWhatsapp,
  trial,
}: {
  phone: string;
  supportWhatsapp: string;
  trial: TrialCreationResult;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [accessStatus, setAccessStatus] = useState<'waiting-first' | 'first-question' | 'retry-wait' | 'second-question' | 'payment-wait' | 'payment'>('waiting-first');
  const [statusStartedAt, setStatusStartedAt] = useState(Date.now());
  const [selectedPlan, setSelectedPlan] = useState(PIX_PLANS[0].label);
  const [receiptName, setReceiptName] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const waitingFirstRemaining = Math.max(0, FIRST_ACCESS_CHECK_SECONDS - elapsedSeconds);
  const statusElapsedSeconds = Math.floor((Date.now() - statusStartedAt) / 1000);
  const retryRemaining = Math.max(0, RETRY_NOTICE_SECONDS + SECOND_ACCESS_CHECK_SECONDS - statusElapsedSeconds);
  const paymentRemaining = Math.max(0, PIX_RELEASE_SECONDS - statusElapsedSeconds);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (accessStatus === 'waiting-first' && elapsedSeconds >= FIRST_ACCESS_CHECK_SECONDS) {
      setAccessStatus('first-question');
    }
  }, [accessStatus, elapsedSeconds]);

  function startRetryWait() {
    setAccessStatus('retry-wait');
    setStatusStartedAt(Date.now());

    window.setTimeout(() => {
      setAccessStatus('second-question');
      setStatusStartedAt(Date.now());
    }, (RETRY_NOTICE_SECONDS + SECOND_ACCESS_CHECK_SECONDS) * 1000);
  }

  function startPaymentWait() {
    setAccessStatus('payment-wait');
    setStatusStartedAt(Date.now());

    window.setTimeout(() => {
      setAccessStatus('payment');
      setStatusStartedAt(Date.now());
    }, PIX_RELEASE_SECONDS * 1000);
  }

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopyStatus('Chave copiada.');
    } catch {
      setCopyStatus('Nao foi possivel copiar. Toque e segure na chave.');
    }
  }

  function openActivationWhatsApp() {
    const url = getWhatsAppTextUrl(
      supportWhatsapp,
      buildActivationMessage(trial, phone, selectedPlan, receiptName || 'nao informado'),
    );

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  if (accessStatus === 'payment') {
    return (
      <section className="activation-panel">
        <div className="activation-heading">
          <span>Pagamento</span>
          <strong>Escolha seu plano no PIX</strong>
        </div>
        <div className="pix-plan-grid">
          {PIX_PLANS.map((plan) => (
            <button
              className={selectedPlan === plan.label ? 'selected' : ''}
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.label)}
            >
              <span>{plan.label}</span>
              <strong>R$ {plan.price}</strong>
            </button>
          ))}
        </div>
        <div className="pix-key-box">
          <span>Recebedor</span>
          <strong>{PIX_RECEIVER}</strong>
          <span>Chave PIX</span>
          <button type="button" onClick={() => void copyPixKey()}>{PIX_KEY}</button>
          {copyStatus ? <p>{copyStatus}</p> : null}
        </div>
        <label className="receipt-upload">
          <span>Anexar comprovante</span>
          <input
            accept="image/*,.pdf"
            type="file"
            onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? '')}
          />
          <strong>{receiptName || 'Selecionar arquivo'}</strong>
        </label>
        <button
          className="primary-action"
          type="button"
          disabled={!receiptName || !supportWhatsapp}
          onClick={openActivationWhatsApp}
        >
          Enviar comprovante para ativacao
        </button>
        <p className="form-note">
          O WhatsApp abrira com os dados do teste. Anexe o comprovante selecionado antes de enviar.
        </p>
      </section>
    );
  }

  return (
    <section className="activation-panel">
      <div className="activation-heading">
        <span>Validacao do acesso</span>
        <strong>Vamos confirmar se o teste abriu corretamente</strong>
      </div>
      {accessStatus === 'waiting-first' ? (
        <div className="access-countdown">
          <span>Primeira pergunta em</span>
          <strong>{formatWaitTime(waitingFirstRemaining)}</strong>
        </div>
      ) : null}
      {accessStatus === 'first-question' || accessStatus === 'second-question' ? (
        <div className="access-question">
          <strong>{accessStatus === 'first-question' ? 'Conseguiu acessar o teste?' : 'Conseguiu logar agora?'}</strong>
          <div>
            <button type="button" className="primary-action" onClick={startPaymentWait}>Sim</button>
            <button type="button" onClick={startRetryWait}>Nao</button>
          </div>
        </div>
      ) : null}
      {accessStatus === 'retry-wait' ? (
        <div className="access-countdown">
          <span>Espere 1 minuto e tente novamente. Vamos perguntar de novo em instantes.</span>
          <strong>{formatWaitTime(retryRemaining)}</strong>
        </div>
      ) : null}
      {accessStatus === 'payment-wait' ? (
        <div className="access-countdown">
          <span>Perfeito. Liberando opcoes de pagamento em</span>
          <strong>{formatWaitTime(paymentRemaining)}</strong>
        </div>
      ) : null}
    </section>
  );
}

export function SalesAssistantPage() {
  const [supportWhatsapp, setSupportWhatsapp] = useState(appConfig.supportWhatsapp);
  const [supportMessage, setSupportMessage] = useState(appConfig.supportMessage);
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

  const supportUrl = getSupportUrl(data.phone, supportWhatsapp, supportMessage);
  const previewApp = stepAssetMap[currentStep.id];
  const previewMode = stepPreviewModeMap[currentStep.id] ?? 'wide';
  const isWaitingForTrial = isBusy && (currentStep.type === 'ready' || currentStep.id === 'trial-placeholder');
  const cardEyebrow = isWaitingForTrial ? 'Criando teste' : currentStep.eyebrow;
  const cardTitle = isWaitingForTrial ? 'Aguardando liberacao do acesso' : currentStep.title;
  const cardDescription = isWaitingForTrial
    ? 'Estamos preparando o teste no painel. Assim que liberar, os dados aparecem automaticamente.'
    : currentStep.description;

  useEffect(() => {
    void loadPublicBestPanelConfig()
      .then((config) => {
        setSupportWhatsapp(config.supportWhatsapp);
        setSupportMessage(config.supportMessage || appConfig.supportMessage);
      })
      .catch(() => {
        setSupportWhatsapp(appConfig.supportWhatsapp);
        setSupportMessage(appConfig.supportMessage);
      });
  }, []);

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
    if (isWaitingForTrial) {
      return <TrialWaitingScreen selectedApp={data.selectedApp} />;
    }

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
            <>
              <div className="credential-list">
                {resultRows.map(([label, value]) => (
                  <div className="credential-row" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <PostTrialActivation
                phone={data.phone}
                supportWhatsapp={supportWhatsapp}
                trial={data.trial}
              />
            </>
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
        eyebrow={cardEyebrow}
        title={cardTitle}
        description={cardDescription}
      >
        {previewApp && currentStep.type !== 'instructions' && currentStep.type !== 'ready' && !isWaitingForTrial ? (
          <AppPreview app={previewApp} compact={currentStep.type === 'options'} mode={previewMode} />
        ) : null}
        {renderContent()}
      </FlowCard>

      {!isWaitingForTrial && currentStep.id !== 'trial-placeholder' ? (
        <NavigationButtons canGoBack={canGoBack} onBack={goBack} onRestart={restart} />
      ) : null}
    </main>
  );
}
