import { clsx } from 'clsx';

interface ProofBar {
  label: string;
  percent: number;
  status: 'pass' | 'fail' | 'warning';
}

interface ProofBarsProps {
  bars: ProofBar[];
  className?: string;
}

export const ProofBars = ({ bars, className }: ProofBarsProps) => {
  return (
    <div className={clsx('space-y-s3', className)} data-proof-bars>
      {bars.map((bar, i) => (
        <div key={i} className="space-y-s1">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink-700">{bar.label}</span>
            <span className="font-mono text-ink-900">{bar.percent}%</span>
          </div>
          <div className="h-[8px] bg-surface-50 rounded-r1 overflow-hidden">
            <div
              className={clsx('h-full transition-all duration-500', {
                'bg-ink-900': bar.status === 'pass',
                'bg-ink-300': bar.status === 'warning',
                'bg-ink-500': bar.status === 'fail'
              })}
              style={{ width: `${bar.percent}%` }}
              data-status={bar.status}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
