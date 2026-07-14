import type { SelectedApp } from '../types/salesFlow';

const assetBase = '/assets/apps';

export interface AppAssetSet {
  name: string;
  logo: string;
  screenshots: {
    mobile?: string;
    wide?: string;
    store?: string;
    login?: string;
  };
  video?: string;
}

export const appAssets: Record<SelectedApp, AppAssetSet> = {
  HDPLAYER: {
    name: 'HD PLAYER',
    logo: `${assetBase}/hdplayer-logo.png`,
    screenshots: {
      wide: `${assetBase}/hdplayer-login.png`,
      login: `${assetBase}/hdplayer-home.jpg`,
    },
  },
  MAXPLAYER: {
    name: 'MAX PLAYER',
    logo: `${assetBase}/maxplayer-logo-alt.png`,
    screenshots: {
      mobile: `${assetBase}/maxplayer-mobile-login.png`,
      wide: `${assetBase}/maxplayer-tv-login.png`,
    },
  },
  CLOUDDY: {
    name: 'CLOUDDY',
    logo: `${assetBase}/clouddy-logo.jpg`,
    screenshots: {
      wide: `${assetBase}/clouddy-login.png`,
    },
  },
  BLESSED_PLAYER: {
    name: 'BLESSED PLAYER',
    logo: `${assetBase}/blessed-logo.png`,
    screenshots: {
      store: `${assetBase}/blessed-playstore.png`,
      mobile: `${assetBase}/blessed-store-device.png`,
      wide: `${assetBase}/blessed-login.png`,
    },
    video: `${assetBase}/blessed-install.mov`,
  },
  UHD_ULTRA_PLAYER: {
    name: 'UHD ULTRA PLAYER',
    logo: `${assetBase}/uhdplayer-logo.png`,
    screenshots: {},
    video: `${assetBase}/uhd-player-pro.mov`,
  },
};

export const installerAssets = {
  downloader: `${assetBase}/downloader.png`,
  ntDown: `${assetBase}/ntdown.png`,
};

export const stepAssetMap: Record<string, SelectedApp> = {
  'smart-tv-hd-player': 'HDPLAYER',
  'smart-tv-max-player': 'MAXPLAYER',
  'smart-tv-clouddy': 'CLOUDDY',
  'box-blessed-player': 'BLESSED_PLAYER',
  'box-max-player': 'MAXPLAYER',
  'mobile-max-player': 'MAXPLAYER',
  'mobile-install': 'MAXPLAYER',
  'computer-max-player': 'MAXPLAYER',
  'computer-install': 'MAXPLAYER',
  'uhd-install': 'UHD_ULTRA_PLAYER',
  'prepare-hdplayer': 'HDPLAYER',
  'prepare-maxplayer': 'MAXPLAYER',
  'prepare-clouddy': 'CLOUDDY',
  'prepare-blessed': 'BLESSED_PLAYER',
  'prepare-uhd': 'UHD_ULTRA_PLAYER',
};

export type AppPreviewMode = 'mobile' | 'wide' | 'store' | 'logo';

export const stepPreviewModeMap: Record<string, AppPreviewMode> = {
  'smart-tv-hd-player': 'wide',
  'smart-tv-max-player': 'wide',
  'smart-tv-clouddy': 'wide',
  'box-blessed-player': 'store',
  'box-max-player': 'wide',
  'mobile-max-player': 'mobile',
  'mobile-install': 'mobile',
  'computer-max-player': 'wide',
  'computer-install': 'wide',
  'uhd-install': 'logo',
  'prepare-hdplayer': 'wide',
  'prepare-maxplayer': 'wide',
  'prepare-clouddy': 'wide',
  'prepare-blessed': 'wide',
  'prepare-uhd': 'logo',
};
