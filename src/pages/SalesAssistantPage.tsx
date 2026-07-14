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

type CatalogMode = 'movies' | 'series';

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

function spellValue(value: string) {
  return value
    .replace(/@/g, ' arroba ')
    .replace(/\./g, ' ponto ')
    .replace(/-/g, ' traco ')
    .split('')
    .filter((character) => character.trim())
    .join(', ')
    .replace(/,\s\s+/g, ', ');
}

function speakCredential(label: string, value: string) {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${label}: ${spellValue(value)}.`);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.68;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
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

function buildThinkingMessage(trial: TrialCreationResult, phone: string) {
  return [
    'Cliente vai pensar antes de assinar.',
    `Telefone: ${formatBrazilianPhone(phone)}`,
    `Aplicativo: ${trial.appName ?? '-'}`,
    `Usuario: ${trial.username ?? '-'}`,
    `Senha: ${trial.password ?? '-'}`,
    `Tempo de teste: ${trial.testDuration ?? '-'}`,
    `Validade do teste: ${trial.expiresAt ?? '-'}`,
    'Mensagem para o cliente: Certo, tenha um otimo teste. Fique com Deus.',
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

function TrialWaitingScreen({ selectedApp }: { selectedApp: SelectedApp | null }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [movieItems, setMovieItems] = useState<CatalogHighlight[]>([]);
  const [seriesItems, setSeriesItems] = useState<CatalogHighlight[]>([]);
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('movies');
  const [catalogIndex, setCatalogIndex] = useState(0);
  const steps = useMemo(() => getWaitingSteps(selectedApp), [selectedApp]);
  const catalogItems = catalogMode === 'movies' ? movieItems : seriesItems;
  const featuredCatalogItem = catalogItems[catalogIndex % Math.max(catalogItems.length, 1)];
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

    async function loadCatalog() {
      try {
        const [moviesResponse, seriesResponse] = await Promise.all([
          fetch('/data/catalog-highlights.json'),
          fetch('/data/catalog-series-highlights.json'),
        ]);

        const moviesBody = moviesResponse.ok ? await moviesResponse.json() as CatalogHighlightsResponse : { items: [] };
        const seriesBody = seriesResponse.ok ? await seriesResponse.json() as CatalogHighlightsResponse : { items: [] };

        if (!ignoreResponse) {
          setMovieItems(moviesBody.items ?? []);
          setSeriesItems(seriesBody.items ?? []);
        }
      } catch {
        if (!ignoreResponse) {
          setMovieItems([]);
          setSeriesItems([]);
        }
      }
    }

    void loadCatalog();

    return () => {
      ignoreResponse = true;
    };
  }, []);

  function goToPreviousCatalogItem() {
    setCatalogIndex((current) => (current === 0 ? catalogItems.length - 1 : current - 1));
  }

  function goToNextCatalogItem() {
    setCatalogIndex((current) => (current + 1) % catalogItems.length);
  }

  function changeCatalogMode(nextMode: CatalogMode) {
    setCatalogMode(nextMode);
    setCatalogIndex(0);
  }

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
          <strong>Destaque do catalogo</strong>
        </div>
        <div className="catalog-tabs" aria-label="Tipo de destaque">
          <button
            className={catalogMode === 'movies' ? 'active' : ''}
            type="button"
            onClick={() => changeCatalogMode('movies')}
          >
            Filmes
          </button>
          <button
            className={catalogMode === 'series' ? 'active' : ''}
            type="button"
            onClick={() => changeCatalogMode('series')}
            disabled={seriesItems.length === 0}
          >
            Series
          </button>
        </div>
        {featuredCatalogItem ? (
          <article className="catalog-feature">
            {featuredCatalogItem.posterUrl ? (
              <img src={featuredCatalogItem.posterUrl} alt="" loading="lazy" />
            ) : (
              <div className="catalog-poster-fallback">{featuredCatalogItem.type}</div>
            )}
            <div className="catalog-feature-copy">
              <span>{featuredCatalogItem.category}{featuredCatalogItem.year ? ` - ${featuredCatalogItem.year}` : ''}</span>
              <strong>{featuredCatalogItem.title}</strong>
              <p>{featuredCatalogItem.overview || 'Sinopse em atualizacao no catalogo.'}</p>
              <small>Genero: {featuredCatalogItem.category}</small>
            </div>
            <div className="catalog-controls">
              <button type="button" onClick={goToPreviousCatalogItem} aria-label="Anterior">&larr;</button>
              <span>{catalogIndex + 1}/{catalogItems.length}</span>
              <button type="button" onClick={goToNextCatalogItem} aria-label="Proximo">&rarr;</button>
            </div>
          </article>
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
  const [receiptSent, setReceiptSent] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
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
      setReceiptSent(true);
    }
  }

  function openThinkingWhatsApp() {
    const url = getWhatsAppTextUrl(supportWhatsapp, buildThinkingMessage(trial, phone));

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  if (accessStatus === 'payment') {
    if (receiptSent) {
      return (
        <section className="activation-panel thank-you-panel">
          <img src={appConfig.logoWide} alt={appConfig.companyName} />
          <div className="activation-heading">
            <span>Comprovante encaminhado</span>
            <strong>Obrigado por ser nosso cliente.</strong>
          </div>
          <p>
            Recebemos sua solicitacao de ativacao. Nossa equipe vai conferir o comprovante e finalizar seu acesso.
          </p>
        </section>
      );
    }

    if (isThinking) {
      return (
        <section className="activation-panel think-panel">
          <div className="activation-heading">
            <span>Tudo certo</span>
            <strong>Certo, tenha um otimo teste. Fique com Deus.</strong>
          </div>
          <p>
            Voce pode chamar nosso atendimento com os dados do teste quando quiser continuar.
          </p>
          <button
            className="primary-action"
            disabled={!supportWhatsapp}
            type="button"
            onClick={openThinkingWhatsApp}
          >
            Ir para o WhatsApp
          </button>
        </section>
      );
    }

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
        <button type="button" className="secondary-action" onClick={() => setIsThinking(true)}>
          Vou pensar um pouco
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
  const [voiceReaderEnabled, setVoiceReaderEnabled] = useState(false);
  const [adminTestModeEnabled, setAdminTestModeEnabled] = useState(false);
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
        setVoiceReaderEnabled(config.voiceReaderEnabled);
        setAdminTestModeEnabled(config.adminTestModeEnabled);
      })
      .catch(() => {
        setSupportWhatsapp(appConfig.supportWhatsapp);
        setSupportMessage(appConfig.supportMessage);
        setVoiceReaderEnabled(false);
        setAdminTestModeEnabled(false);
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
                    {voiceReaderEnabled && ['Usuario', 'Senha'].includes(label) ? (
                      <button
                        type="button"
                        onClick={() => speakCredential(label, value)}
                        aria-label={`Ouvir ${label.toLowerCase()}`}
                      >
                        Ouvir
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <PostTrialActivation
                phone={data.phone}
                supportWhatsapp={supportWhatsapp}
                trial={data.trial}
              />
              {adminTestModeEnabled ? (
                <button type="button" className="secondary-action" onClick={restart}>
                  Reiniciar atendimento
                </button>
              ) : null}
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
