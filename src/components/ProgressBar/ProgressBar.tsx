interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="progress-shell" aria-label={`Progresso ${value}%`}>
      <div className="progress-track">
        <span className="progress-fill" style={{ width: `${value}%` }} />
      </div>
      <span>{value}%</span>
    </div>
  );
}
