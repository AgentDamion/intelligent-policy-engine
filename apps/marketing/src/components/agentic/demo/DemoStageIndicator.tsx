import { DemoStage } from '@/types/intelligenceDemo';
import { clsx } from 'clsx';
import { CheckCircle, MessageSquare, Scale, Shield, TrendingUp } from 'lucide-react';

interface DemoStageIndicatorProps {
  stages: DemoStage[];
  currentStage: number;
  onStageSelect: (stageIndex: number) => void;
}

const getStageIcon = (type: string) => {
  switch (type) {
    case 'intro':
      return Shield;
    case 'conversation':
      return MessageSquare;
    case 'decision':
      return Scale;
    case 'proof':
      return CheckCircle;
    case 'outcome':
      return TrendingUp;
    default:
      return Shield;
  }
};

const getStageLabel = (type: string) => {
  switch (type) {
    case 'intro':
      return 'Introduction';
    case 'conversation':
      return 'Agent Discussion';
    case 'decision':
      return 'Decision';
    case 'proof':
      return 'Proof Generation';
    case 'outcome':
      return 'Outcome';
    default:
      return type;
  }
};

export const DemoStageIndicator = ({
  stages,
  currentStage,
  onStageSelect,
}: DemoStageIndicatorProps) => {
  return (
    <div className="flex items-center gap-s2">
      {stages.map((stage, index) => {
        const Icon = getStageIcon(stage.type);
        const isActive = index === currentStage;
        const isPast = index < currentStage;
        const isFuture = index > currentStage;

        return (
          <button
            key={stage.id}
            onClick={() => onStageSelect(index)}
            className={clsx(
              'flex items-center gap-s2 px-s3 py-s2 rounded-lg transition-all',
              'hover:bg-surface-100',
              isActive && 'bg-primary/10 ring-2 ring-primary/20',
              isPast && 'opacity-60',
              isFuture && 'opacity-40'
            )}
            title={getStageLabel(stage.type)}
          >
            <Icon
              className={clsx(
                'h-4 w-4',
                isActive && 'text-primary',
                isPast && 'text-ink-500',
                isFuture && 'text-ink-400'
              )}
            />
            <span
              className={clsx(
                'text-sm font-medium',
                isActive && 'text-primary',
                isPast && 'text-ink-600',
                isFuture && 'text-ink-400'
              )}
            >
              {getStageLabel(stage.type)}
            </span>
            {isActive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
