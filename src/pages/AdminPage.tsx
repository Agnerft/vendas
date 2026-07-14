import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { appConfig } from '../config/appConfig';
import {
  getDefaultBestPanelConfig,
  loadAdminBestPanelConfig,
  loadBestPanelConfig,
  saveAdminBestPanelConfig,
  saveBestPanelConfig,
  type BestPanelConfig,
} from '../utils/bestPanelConfig';

const ADMIN_SESSION_KEY = 'iptv-admin-unlocked';

function isAdminUnlocked() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function hasPanelCredentials(config: BestPanelConfig) {
  return Boolean(config.apiToken && config.packageId);
}

export function AdminPage() {
  const defaultConfig = useMemo(() => loadBestPanelConfig(), []);
  const [isUnlocked, setIsUnlocked] = useState(isAdminUnlocked);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [config, setConfig] = useState<BestPanelConfig>(defaultConfig);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      let serverConfig = await loadAdminBestPanelConfig(password);
      const localConfig = loadBestPanelConfig();

      if (!hasPanelCredentials(serverConfig) && hasPanelCredentials(localConfig)) {
        serverConfig = await saveAdminBestPanelConfig(password, localConfig);
        setMessage('Configuracao que estava neste navegador foi salva no servidor.');
      }

      saveBestPanelConfig(serverConfig);
      setConfig(serverConfig);
      setAdminPassword(password);
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsUnlocked(true);
      setError('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Senha incorreta.');
    }
  }

  function updateField(field: keyof BestPanelConfig, value: string) {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage('');
  }

  function updateBooleanField(field: keyof BestPanelConfig, value: boolean) {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage('');
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const savedConfig = await saveAdminBestPanelConfig(adminPassword || password || appConfig.adminPassword, config);
      setConfig(savedConfig);
      setMessage('Configuracao salva no servidor com sucesso.');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar a configuracao.');
    }
  }

  async function handleResetDefaults() {
    const nextConfig = getDefaultBestPanelConfig();

    try {
      const savedConfig = await saveAdminBestPanelConfig(adminPassword || password || appConfig.adminPassword, nextConfig);
      setConfig(savedConfig);
      setMessage('Configuracao voltou para o padrao do projeto.');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel restaurar o padrao.');
    }
  }

  if (!isUnlocked) {
    return (
      <main className="admin-shell">
        <section className="admin-panel admin-login-panel">
          <img className="admin-brand-logo" src={appConfig.logoWide} alt="NIXPLAY" />
          <div className="admin-heading">
            <p className="eyebrow">Admin</p>
            <h1>Configuracao do painel</h1>
            <p>Informe a senha para acessar as configuracoes de criacao de teste.</p>
          </div>
          <form className="admin-form" onSubmit={handleLogin}>
            <label htmlFor="admin-password">Senha</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              autoFocus
            />
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="primary-action">Entrar</button>
          </form>
          <a className="admin-back-link" href="/">Voltar para o atendimento</a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel">
        <img className="admin-brand-logo" src={appConfig.logoWide} alt="NIXPLAY" />
        <div className="admin-heading">
          <p className="eyebrow">Admin</p>
          <h1>Configuracao The Best</h1>
          <p>Esses dados serao usados quando o cliente clicar em CRIAR TESTE.</p>
        </div>

        <form className="admin-form" onSubmit={handleSave}>
          <label htmlFor="best-endpoint">Endpoint de criacao</label>
          <input
            id="best-endpoint"
            type="url"
            value={config.endpoint}
            onChange={(event) => updateField('endpoint', event.target.value)}
            placeholder="https://api.painel.best/lines/create-trial/"
          />

          <label htmlFor="best-login">Username do header antigo</label>
          <input
            id="best-login"
            type="text"
            value={config.login}
            onChange={(event) => updateField('login', event.target.value)}
            placeholder="Opcional nesta API"
          />

          <label htmlFor="best-token">API key</label>
          <input
            id="best-token"
            type="password"
            value={config.apiToken}
            onChange={(event) => updateField('apiToken', event.target.value)}
            placeholder="Cole a chave Api-Key aqui"
          />

          <label htmlFor="best-package">Package</label>
          <input
            id="best-package"
            type="text"
            value={config.packageId}
            onChange={(event) => updateField('packageId', event.target.value)}
            placeholder="ID do pacote"
          />

          <label htmlFor="best-notes">Observacao enviada</label>
          <input
            id="best-notes"
            type="text"
            value={config.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Vendas pelo APP"
          />

          <label htmlFor="support-whatsapp">WhatsApp do suporte</label>
          <input
            id="support-whatsapp"
            type="tel"
            value={config.supportWhatsapp}
            onChange={(event) => updateField('supportWhatsapp', event.target.value)}
            placeholder="5551999999999"
          />

          <label htmlFor="support-message">Mensagem inicial do suporte</label>
          <input
            id="support-message"
            type="text"
            value={config.supportMessage}
            onChange={(event) => updateField('supportMessage', event.target.value)}
            placeholder="Ola, preciso de ajuda para configurar meu teste."
          />

          <label className="admin-toggle" htmlFor="voice-reader-enabled">
            <input
              checked={config.voiceReaderEnabled}
              id="voice-reader-enabled"
              type="checkbox"
              onChange={(event) => updateBooleanField('voiceReaderEnabled', event.target.checked)}
            />
            <span>Ativar leitor de voz para login e senha</span>
          </label>

          {message ? <p className="admin-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <div className="admin-actions">
            <button type="submit" className="primary-action">Salvar configuracao</button>
            <button type="button" onClick={handleResetDefaults}>Restaurar padrao</button>
          </div>
        </form>

        <div className="admin-note">
          <strong>Senha atual:</strong>
          <span>123, apenas para teste. Depois altere em `src/config/appConfig.ts`.</span>
        </div>

        <a className="admin-back-link" href="/">Voltar para o atendimento</a>
      </section>
    </main>
  );
}
