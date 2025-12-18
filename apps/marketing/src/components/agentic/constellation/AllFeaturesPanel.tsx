interface FeatureDriver {
  label: string;
  impact: string;
  weight: number;
}

interface AllFeaturesPanelProps {
  features: FeatureDriver[];
}

export const AllFeaturesPanel = ({ features }: AllFeaturesPanelProps) => {
  return (
    <div className="h-full overflow-auto bg-white">
      <div className="space-y-s3">
        <h4 className="text-sm font-semibold text-ink-900 sticky top-0 z-10 bg-white pb-s2">
          All Feature Drivers ({features.length})
        </h4>
        <div className="space-y-s2">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between p-s3 bg-surface-50 rounded-r2 hover:bg-surface-100 transition-colors"
            >
              <span className="text-sm text-ink-900">{feature.label}</span>
              <span className="text-xs text-ink-600 font-mono">{feature.impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
