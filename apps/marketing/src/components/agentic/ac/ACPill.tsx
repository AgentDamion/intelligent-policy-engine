import { clsx } from 'clsx';

interface ACPillProps {
  label: string;
  kind?: 'agent' | 'human' | 'status' | 'fact';
  selected?: boolean;
  onClick?: () => void;
}

export const ACPill = ({ label, kind = 'fact', selected, onClick }: ACPillProps) => {
  return (
    <span
      onClick={onClick}
      data-pill-kind={kind}
      className={clsx(
        'inline-flex items-center h-[28px] px-s2 rounded-r2 text-[12px] font-medium border transition-colors',
        {
          'bg-ink-900 text-white border-ink-900': kind === 'agent',
          'bg-surface-50 text-ink-700 border-ink-200': kind === 'status' || kind === 'fact',
          'bg-ink-700 text-white border-ink-700': kind === 'human',
        },
        selected && 'ring-2 ring-ink-500',
        onClick && 'cursor-pointer hover:bg-ink-700 hover:text-white hover:border-ink-700'
      )}
    >
      {label}
    </span>
  );
};
