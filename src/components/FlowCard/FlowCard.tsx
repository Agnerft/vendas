import type { ReactNode } from 'react';

interface FlowCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FlowCard({ eyebrow, title, description, children }: FlowCardProps) {
  return (
    <section className="flow-card" aria-live="polite">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <div className="flow-copy">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="flow-card-body">{children}</div>
    </section>
  );
}
