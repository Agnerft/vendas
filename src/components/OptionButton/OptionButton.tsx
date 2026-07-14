import type { FlowOption } from '../../types/salesFlow';

const iconMap: Record<string, string> = {
  tv: 'TV',
  box: 'BOX',
  phone: 'TEL',
  monitor: 'PC',
};

interface OptionButtonProps {
  option: FlowOption;
  onSelect: (option: FlowOption) => void;
  variant?: 'default' | 'device';
}

export function OptionButton({ option, onSelect, variant = 'default' }: OptionButtonProps) {
  return (
    <button
      type="button"
      className={`option-button ${variant === 'device' ? 'option-button-device' : ''}`}
      onClick={() => onSelect(option)}
    >
      {option.icon ? <span className="option-icon" aria-hidden="true">{iconMap[option.icon]}</span> : null}
      <span>
        <strong>{option.label}</strong>
        {option.description ? <small>{option.description}</small> : null}
      </span>
    </button>
  );
}
