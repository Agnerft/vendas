import { useState } from 'react';

interface CopyCodeCardProps {
  title: string;
  value: string;
  instruction: string;
  imageSrc?: string;
  imageAlt?: string;
  canCopy?: boolean;
}

export function CopyCodeCard({
  title,
  value,
  instruction,
  imageSrc,
  imageAlt,
  canCopy = true,
}: CopyCodeCardProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('error');
    }
  }

  return (
    <article className={`copy-card ${imageSrc ? 'copy-card-with-image' : ''}`}>
      {imageSrc ? <img className="copy-card-image" src={imageSrc} alt={imageAlt ?? title} /> : null}
      <div>
        <h2>{title}</h2>
        <p className="copy-value">{value}</p>
        <p>{instruction}</p>
      </div>
      {canCopy ? (
        <>
          <button type="button" onClick={handleCopy}>
            Copiar
          </button>
          {status === 'copied' ? <span className="copy-status success">Copiado!</span> : null}
          {status === 'error' ? <span className="copy-status error">Nao foi possivel copiar.</span> : null}
        </>
      ) : null}
    </article>
  );
}
