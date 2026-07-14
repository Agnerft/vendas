import { appAssets } from '../../config/appAssets';
import type { AppPreviewMode } from '../../config/appAssets';
import type { SelectedApp } from '../../types/salesFlow';

interface AppPreviewProps {
  app: SelectedApp;
  compact?: boolean;
  mode?: AppPreviewMode;
}

function pickScreenshot(app: SelectedApp, mode: Exclude<AppPreviewMode, 'logo'>) {
  const asset = appAssets[app];
  return (
    asset.screenshots[mode] ??
    asset.screenshots.wide ??
    asset.screenshots.mobile ??
    asset.screenshots.store ??
    asset.screenshots.login
  );
}

export function AppPreview({ app, compact = false, mode = 'wide' }: AppPreviewProps) {
  const asset = appAssets[app];
  const previewImage = mode === 'logo' ? undefined : pickScreenshot(app, mode);
  const frameMode = previewImage ? mode : 'logo';

  return (
    <aside
      className={`app-preview app-preview-${frameMode} ${compact ? 'app-preview-compact' : ''}`}
      aria-label={asset.name}
    >
      <div className="app-preview-frame">
        {frameMode === 'mobile' ? <span className="phone-speaker" aria-hidden="true" /> : null}
        <div className="app-preview-brand">
          <img src={asset.logo} alt={`Logo ${asset.name}`} />
          <span>{asset.name}</span>
        </div>
        {previewImage ? (
          <img className="app-preview-screen" src={previewImage} alt={`Tela do ${asset.name}`} />
        ) : (
          <img className="app-preview-logo-only" src={asset.logo} alt={`Logo ${asset.name}`} />
        )}
        {frameMode === 'wide' ? <span className="tv-stand" aria-hidden="true" /> : null}
      </div>
      {frameMode === 'store' ? <p className="preview-hint">Procure por este nome e icone na loja do aparelho.</p> : null}
      {asset.video ? (
        <video className="app-preview-video" controls preload="metadata" playsInline>
          <source src={asset.video} type="video/quicktime" />
          <source src={asset.video} type="video/mp4" />
        </video>
      ) : null}
    </aside>
  );
}
