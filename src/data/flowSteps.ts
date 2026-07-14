import type { FlowStep } from '../types/salesFlow';

export const INITIAL_PHONE_STEP = 'phone-entry';
export const DEVICE_STEP = 'device-selection';

export const flowSteps: FlowStep[] = [
  {
    id: INITIAL_PHONE_STEP,
    type: 'phone',
    eyebrow: 'Inicio do atendimento',
    title: 'Para comecarmos, informe seu WhatsApp.',
    description: 'Vamos usar esse numero para identificar seu atendimento.',
  },
  {
    id: 'phone-confirm',
    type: 'phone-confirm',
    eyebrow: 'Confirmacao',
    title: 'Este e o seu numero?',
    description: 'Confira antes de continuar.',
    options: [
      {
        id: 'phone-confirm-yes',
        label: 'Sim, continuar',
        value: 'PHONE_CONFIRMED',
        nextStep: DEVICE_STEP,
      },
      {
        id: 'phone-confirm-no',
        label: 'Nao, corrigir',
        value: 'PHONE_CORRECT',
        nextStep: INITIAL_PHONE_STEP,
        mutation: { phone: '', phoneSource: 'manual' },
      },
    ],
  },
  {
    id: DEVICE_STEP,
    type: 'device-options',
    eyebrow: 'Dispositivo',
    title: 'Onde voce deseja assistir?',
    description: 'Escolha o aparelho em que pretende usar o servico.',
    options: [
      {
        id: 'smart-tv',
        label: 'SMART TV',
        value: 'SMART_TV',
        nextStep: 'smart-tv-hd-player',
        icon: 'tv',
        description: 'Samsung, LG, TCL e outras TVs com loja de apps.',
        clearDeviceSpecific: true,
        mutation: { device: 'SMART_TV' },
      },
      {
        id: 'tv-box',
        label: 'TV BOX / FIRE TV / MI STICK / PROJETOR',
        value: 'TV_BOX_FIRE_STICK_MI_STICK_PROJETOR',
        nextStep: 'box-play-store',
        icon: 'box',
        description: 'Aparelhos Android, sticks, boxes e projetores.',
        clearDeviceSpecific: true,
        mutation: { device: 'TV_BOX_FIRE_STICK_MI_STICK_PROJETOR' },
      },
      {
        id: 'mobile',
        label: 'CELULAR',
        value: 'CELULAR',
        nextStep: 'mobile-max-player',
        icon: 'phone',
        description: 'Android ou iPhone com loja de aplicativos.',
        clearDeviceSpecific: true,
        mutation: { device: 'CELULAR' },
      },
      {
        id: 'computer',
        label: 'COMPUTADOR',
        value: 'COMPUTADOR',
        nextStep: 'computer-max-player',
        icon: 'monitor',
        description: 'Notebook ou computador de mesa.',
        clearDeviceSpecific: true,
        mutation: { device: 'COMPUTADOR' },
      },
    ],
  },
  {
    id: 'smart-tv-hd-player',
    type: 'options',
    title: 'Voce encontrou o aplicativo HD PLAYER na loja da sua TV?',
    options: [
      {
        id: 'hd-yes',
        label: 'SIM',
        value: 'YES_HDPLAYER',
        nextStep: 'prepare-hdplayer',
        mutation: { selectedApp: 'HDPLAYER' },
      },
      { id: 'hd-no', label: 'NAO', value: 'NO_HDPLAYER', nextStep: 'smart-tv-max-player' },
    ],
  },
  {
    id: 'smart-tv-max-player',
    type: 'options',
    title: 'Voce encontrou o aplicativo MAX PLAYER?',
    options: [
      {
        id: 'max-tv-yes',
        label: 'SIM',
        value: 'YES_MAXPLAYER',
        nextStep: 'prepare-maxplayer',
        mutation: { selectedApp: 'MAXPLAYER' },
      },
      { id: 'max-tv-no', label: 'NAO', value: 'NO_MAXPLAYER', nextStep: 'smart-tv-no-app' },
    ],
  },
  {
    id: 'smart-tv-no-app',
    type: 'support',
    title: 'Nao encontramos um aplicativo compativel automaticamente.',
    description: 'Nossa equipe ira ajudar voce a escolher a melhor opcao para a sua TV.',
    options: [
      { id: 'support-tv', label: 'Falar com o suporte', value: 'SUPPORT', nextStep: 'smart-tv-no-app', external: 'support' },
      { id: 'retry-tv', label: 'Tentar novamente', value: 'RETRY_SMART_TV', nextStep: 'smart-tv-hd-player' },
      { id: 'other-device-tv', label: 'Escolher outro dispositivo', value: 'OTHER_DEVICE', nextStep: DEVICE_STEP, clearDeviceSpecific: true },
    ],
  },
  {
    id: 'box-play-store',
    type: 'options',
    title: 'O seu aparelho possui Google Play Store?',
    options: [
      {
        id: 'play-yes',
        label: 'SIM',
        value: 'YES_PLAY_STORE',
        nextStep: 'box-blessed-player',
        mutation: { hasPlayStore: true },
      },
      {
        id: 'play-no',
        label: 'NAO',
        value: 'NO_PLAY_STORE',
        nextStep: 'box-downloader-ntdown',
        mutation: { hasPlayStore: false },
      },
    ],
  },
  {
    id: 'box-blessed-player',
    type: 'options',
    title: 'Voce encontrou o aplicativo BLESSED PLAYER?',
    options: [
      {
        id: 'blessed-yes',
        label: 'SIM',
        value: 'YES_BLESSED_PLAYER',
        nextStep: 'prepare-blessed',
        mutation: { selectedApp: 'BLESSED_PLAYER' },
      },
      { id: 'blessed-no', label: 'NAO', value: 'NO_BLESSED_PLAYER', nextStep: 'box-max-player' },
    ],
  },
  {
    id: 'box-max-player',
    type: 'options',
    title: 'Voce encontrou o aplicativo MAX PLAYER?',
    options: [
      {
        id: 'box-max-yes',
        label: 'SIM',
        value: 'YES_MAXPLAYER',
        nextStep: 'prepare-maxplayer',
        mutation: { selectedApp: 'MAXPLAYER' },
      },
      { id: 'box-max-no', label: 'NAO', value: 'NO_MAXPLAYER', nextStep: 'box-downloader-ntdown' },
    ],
  },
  {
    id: 'box-downloader-ntdown',
    type: 'options',
    title: 'O seu aparelho possui o aplicativo DOWNLOADER ou NTDOWN?',
    options: [
      {
        id: 'has-downloader',
        label: 'Tenho o DOWNLOADER',
        value: 'HAS_DOWNLOADER',
        nextStep: 'uhd-install',
        mutation: { hasDownloader: true, hasNtDown: false },
      },
      {
        id: 'has-ntdown',
        label: 'Tenho o NTDOWN',
        value: 'HAS_NTDOWN',
        nextStep: 'uhd-install',
        mutation: { hasDownloader: false, hasNtDown: true },
      },
      {
        id: 'has-both',
        label: 'Tenho os dois',
        value: 'HAS_BOTH',
        nextStep: 'uhd-install',
        mutation: { hasDownloader: true, hasNtDown: true },
      },
      {
        id: 'has-none',
        label: 'Nao tenho nenhum',
        value: 'HAS_NONE',
        nextStep: 'need-installer',
        mutation: { hasDownloader: false, hasNtDown: false },
      },
    ],
  },
  {
    id: 'uhd-install',
    type: 'instructions',
    title: 'Instale o UHD PLAYER PRO',
    description: 'Utilize uma das opcoes abaixo para instalar o aplicativo.',
    options: [
      {
        id: 'uhd-installed',
        label: 'SIM, INSTALEI',
        value: 'UHD_INSTALLED',
        nextStep: 'prepare-uhd',
        mutation: { selectedApp: 'UHD_ULTRA_PLAYER' },
      },
      { id: 'uhd-not-yet', label: 'AINDA NAO', value: 'UHD_NOT_INSTALLED', nextStep: 'uhd-install-help' },
    ],
  },
  {
    id: 'uhd-install-help',
    type: 'support',
    title: 'Sem problema. Revise os codigos ou fale com o nosso suporte.',
    options: [
      { id: 'see-codes', label: 'Ver codigos novamente', value: 'SEE_CODES', nextStep: 'uhd-install' },
      { id: 'support-uhd', label: 'Falar com o suporte', value: 'SUPPORT', nextStep: 'uhd-install-help', external: 'support' },
      { id: 'other-device-uhd', label: 'Escolher outro dispositivo', value: 'OTHER_DEVICE', nextStep: DEVICE_STEP, clearDeviceSpecific: true },
    ],
  },
  {
    id: 'need-installer',
    type: 'support',
    title: 'Para instalar o aplicativo, primeiro sera necessario instalar o Downloader ou o NtDown.',
    options: [
      { id: 'instructions', label: 'Ver instrucoes', value: 'SEE_INSTRUCTIONS', nextStep: 'installer-tutorial' },
      { id: 'support-installer', label: 'Falar com o suporte', value: 'SUPPORT', nextStep: 'need-installer', external: 'support' },
      { id: 'other-device-installer', label: 'Escolher outro dispositivo', value: 'OTHER_DEVICE', nextStep: DEVICE_STEP, clearDeviceSpecific: true },
    ],
  },
  {
    id: 'installer-tutorial',
    type: 'placeholder',
    title: 'Tutorial em preparacao.',
    description: 'Em breve vamos adicionar aqui o passo a passo para instalar o Downloader ou o NtDown.',
    options: [
      { id: 'back-installer', label: 'Voltar', value: 'BACK_TO_INSTALLER_OPTIONS', nextStep: 'need-installer' },
      { id: 'support-tutorial', label: 'Falar com o suporte', value: 'SUPPORT', nextStep: 'installer-tutorial', external: 'support' },
      { id: 'other-device-tutorial', label: 'Escolher outro dispositivo', value: 'OTHER_DEVICE', nextStep: DEVICE_STEP, clearDeviceSpecific: true },
    ],
  },
  {
    id: 'mobile-max-player',
    type: 'options',
    title: 'No celular, utilize o aplicativo MAX PLAYER.',
    description: 'Voce ja instalou o MAX PLAYER?',
    options: [
      {
        id: 'mobile-installed',
        label: 'SIM',
        value: 'MOBILE_MAX_INSTALLED',
        nextStep: 'prepare-maxplayer',
        mutation: { selectedApp: 'MAXPLAYER' },
      },
      { id: 'mobile-not-yet', label: 'AINDA NAO', value: 'MOBILE_MAX_NOT_INSTALLED', nextStep: 'mobile-install' },
    ],
  },
  {
    id: 'mobile-install',
    type: 'placeholder',
    title: 'Instale o MAX PLAYER na loja de aplicativos do seu celular.',
    description: 'Apos instalar, volte para continuar.',
    options: [
      {
        id: 'mobile-now-installed',
        label: 'Ja instalei',
        value: 'MOBILE_MAX_NOW_INSTALLED',
        nextStep: 'prepare-maxplayer',
        mutation: { selectedApp: 'MAXPLAYER' },
      },
      { id: 'support-mobile', label: 'Falar com o suporte', value: 'SUPPORT', nextStep: 'mobile-install', external: 'support' },
      { id: 'other-device-mobile', label: 'Escolher outro dispositivo', value: 'OTHER_DEVICE', nextStep: DEVICE_STEP, clearDeviceSpecific: true },
    ],
  },
  {
    id: 'computer-max-player',
    type: 'options',
    title: 'No computador, utilize o MAX PLAYER.',
    description: 'Voce ja possui o MAX PLAYER instalado?',
    options: [
      {
        id: 'computer-installed',
        label: 'SIM',
        value: 'COMPUTER_MAX_INSTALLED',
        nextStep: 'prepare-maxplayer',
        mutation: { selectedApp: 'MAXPLAYER' },
      },
      { id: 'computer-not-yet', label: 'AINDA NAO', value: 'COMPUTER_MAX_NOT_INSTALLED', nextStep: 'computer-install' },
    ],
  },
  {
    id: 'computer-install',
    type: 'placeholder',
    title: 'Baixe e instale o MAX PLAYER no seu computador.',
    description: 'Apos instalar, volte para continuar.',
    options: [
      {
        id: 'computer-now-installed',
        label: 'Ja instalei',
        value: 'COMPUTER_MAX_NOW_INSTALLED',
        nextStep: 'prepare-maxplayer',
        mutation: { selectedApp: 'MAXPLAYER' },
      },
      { id: 'support-computer', label: 'Falar com o suporte', value: 'SUPPORT', nextStep: 'computer-install', external: 'support' },
      { id: 'other-device-computer', label: 'Escolher outro dispositivo', value: 'OTHER_DEVICE', nextStep: DEVICE_STEP, clearDeviceSpecific: true },
    ],
  },
  {
    id: 'prepare-hdplayer',
    type: 'ready',
    title: 'Otimo! Vamos preparar o seu teste no HD PLAYER.',
    appToPrepare: 'HDPLAYER',
  },
  {
    id: 'prepare-maxplayer',
    type: 'ready',
    title: 'Otimo! Vamos preparar o seu teste no MAX PLAYER.',
    appToPrepare: 'MAXPLAYER',
  },
  {
    id: 'prepare-blessed',
    type: 'ready',
    title: 'Otimo! Vamos preparar o seu teste no BLESSED PLAYER.',
    appToPrepare: 'BLESSED_PLAYER',
  },
  {
    id: 'prepare-uhd',
    type: 'ready',
    title: 'Otimo! Vamos preparar o seu teste no UHD PLAYER PRO.',
    appToPrepare: 'UHD_ULTRA_PLAYER',
  },
  {
    id: 'trial-placeholder',
    type: 'placeholder',
    title: 'Resultado da criacao do teste.',
    description: 'Confira abaixo o retorno do atendimento.',
  },
];

export const flowStepById = flowSteps.reduce<Record<string, FlowStep>>((steps, step) => {
  steps[step.id] = step;
  return steps;
}, {});

export const progressStepIds = flowSteps
  .filter((step) => step.id !== 'phone-confirm')
  .map((step) => step.id);
