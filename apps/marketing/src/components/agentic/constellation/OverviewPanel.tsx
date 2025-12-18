import { TopThreeDrivers } from './TopThreeDrivers';

interface FeatureDriver {
  label: string;
  impact: string;
  weight: number;
}

interface OverviewPanelProps {
  drivers: FeatureDriver[];
  confidence: number;
}

export const OverviewPanel = ({ drivers, confidence }: OverviewPanelProps) => {
  return (
    <div className="h-full flex flex-col bg-white">
      <TopThreeDrivers drivers={drivers} confidence={confidence} />
      <p className="text-xs text-ink-600 mt-s4 text-center">
        Swipe or use arrow keys to explore more details →
      </p>
    </div>
  );
};
