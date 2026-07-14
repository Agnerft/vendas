import { CopyCodeCard } from '../CopyCodeCard/CopyCodeCard';
import { appConfig } from '../../config/appConfig';
import { appAssets, installerAssets } from '../../config/appAssets';
import type { ReactNode } from 'react';

interface AppInstructionsProps {
  children?: ReactNode;
}

export function AppInstructions({ children }: AppInstructionsProps) {
  const codes = appConfig.installCodes;
  const uhdAssets = appAssets.UHD_ULTRA_PLAYER;

  return (
    <div className="instruction-list">
      <div className="app-name-block">
        <img src={uhdAssets.logo} alt={`Logo ${codes.appName}`} />
        <div>
          <span>Aplicativo</span>
          <strong>{codes.appName}</strong>
        </div>
      </div>
      {uhdAssets.video ? (
        <video className="instruction-video" controls preload="metadata" playsInline>
          <source src={uhdAssets.video} type="video/quicktime" />
          <source src={uhdAssets.video} type="video/mp4" />
        </video>
      ) : null}
      <div className="install-steps" aria-label="Passos de instalacao">
        <article>
          <span>1</span>
          <strong>Escolha o metodo</strong>
          <p>Use o link direto, Downloader ou NtDown, conforme o que tiver no aparelho.</p>
        </article>
        <article>
          <span>2</span>
          <strong>Digite o codigo</strong>
          <p>Copie o codigo correto e confirme no aplicativo escolhido.</p>
        </article>
        <article>
          <span>3</span>
          <strong>Abra o UHD</strong>
          <p>Depois de instalar, volte aqui e continue para criar o teste.</p>
        </article>
      </div>
      {children}
      <CopyCodeCard
        title="Codigo do provedor"
        value={codes.providerCode}
        instruction={`Voce vai usar este codigo dentro do ${codes.appName}, quando o aplicativo pedir o provedor.`}
        canCopy={false}
      />
      <CopyCodeCard
        title="Link direto"
        value={codes.directLink}
        instruction={`Abra o navegador do aparelho e acesse ${codes.directLink}.`}
      />
      <CopyCodeCard
        title="Codigo pelo Downloader"
        value={codes.downloaderCode}
        imageSrc={installerAssets.downloader}
        imageAlt="Logo Downloader"
        instruction={`Abra o Downloader, digite o codigo ${codes.downloaderCode} e confirme.`}
      />
      <CopyCodeCard
        title="Codigo pelo NtDown"
        value={codes.ntDownCode}
        imageSrc={installerAssets.ntDown}
        imageAlt="Logo NtDown"
        instruction={`Abra o NtDown, digite o codigo ${codes.ntDownCode} e confirme.`}
      />
    </div>
  );
}
