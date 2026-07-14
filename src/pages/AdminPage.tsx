import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { appConfig } from '../config/appConfig';
import {
  getDefaultBestPanelConfig,
  loadBestPanelConfig,
  saveBestPanelConfig,
  type BestPanelConfig,
} from '../utils/bestPanelConfig';

const ADMIN_SESSION_KEY = 'iptv-admin-unlocked';

function isAdminUnlocked() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function AdminPage() {
  const defaultConfig = useMemo(() => loadBestPanelConfig(), []);
  const [isUnlocked, setIsUnlocked] = useState(isAdminUnlocked);
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState<BestPanelConfig>(defaultConfig);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== appConfig.adminPassword) {
      setError('Senha incorreta.');
      return;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setIsUnlocked(true);
    setError('');
  }

  function updateField(field: keyof BestPanelConfig, value: string) {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage('');
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveBestPanelConfig(config);
    setMessage('Configuracao salva com sucesso.');
    setError('');
  }

  function handleResetDefaults() {
    const nextConfig = getDefaultBestPanelConfig();
    setConfig(nextConfig);
    saveBestPanelConfig(nextConfig);
    setMessage('Configuracao voltou para o padrao do projeto.');
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
            placeholder="https://painel.best/api/test/"
          />

          <label htmlFor="best-login">Username do header</label>
          <input
            id="best-login"
            type="text"
            value={config.login}
            onChange={(event) => updateField('login', event.target.value)}
            placeholder="revendaluiz"
          />

          <label htmlFor="best-token">API key do header</label>
          <input
            id="best-token"
            type="password"
            value={config.apiToken}
            onChange={(event) => updateField('apiToken', event.target.value)}
            placeholder="Cole a api_key aqui"
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
