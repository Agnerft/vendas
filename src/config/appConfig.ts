export const appConfig = {
  companyName: 'NIXPLAY',
  logoText: 'NIXPLAY',
  logoIcon: '/assets/brand/nixplay-icon-dark.png',
  logoWide: '/assets/brand/nixplay-logo-wide.png',
  adminPassword: '123',
  supportWhatsapp: '',
  supportMessage: 'Ola, preciso de ajuda para configurar meu teste.',
  bestPanel: {
    endpoint: import.meta.env.VITE_BEST_PANEL_TEST_ENDPOINT || 'https://api.painel.best/lines/create-trial/',
    apiToken: import.meta.env.VITE_BEST_PANEL_API_TOKEN || '',
    login: import.meta.env.VITE_BEST_PANEL_LOGIN || '',
    packageId: import.meta.env.VITE_BEST_PANEL_PACKAGE_ID || '',
    notes: 'BotConversa CR7',
  },
  theme: {
    primary: '#8f3cff',
    accent: '#45a6ff',
  },
  installCodes: {
    appName: 'UHD PLAYER PRO',
    providerCode: '789',
    adultPassword: '0000',
    directLink: 'dl.ntdev.in/81567',
    downloaderCode: '2659615',
    ntDownCode: '81567',
  },
};
