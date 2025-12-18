import type { Explainability } from '@/types/spine';

interface ExplainabilityStripProps {
  explainability: Explainability;
}

export const ExplainabilityStrip = ({ explainability }: ExplainabilityStripProps) => {
  return (
    <div className="border border-ink-100 rounded-r2 p-s4 space-y-s4 bg-surface-50">
      <div>
        <h4 className="text-[12px] font-mono font-semibold text-ink-700 mb-s3">
          Feature Importance
        </h4>
        <div className="space-y-s2">
          {explainability.features.map((feature) => (
            <div key={feature.id} className="flex items-center gap-s3">
              <div className="flex-1">
                <div className="text-[12px] text-ink-700 mb-s1">{feature.label}</div>
                <div className="h-[6px] bg-ink-100 rounded-r1">
                  <div
                    className="h-full bg-ink-700 rounded-r1"
                    style={{ width: `${feature.weight * 100}%` }}
                    data-explainability-weight={feature.weight}
                  />
                </div>
              </div>
              <span className="text-[12px] font-mono text-ink-500 w-[40px] text-right">
                {(feature.weight * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-s4 pt-s3 border-t border-ink-100">
        <div>
          <div className="text-[10px] font-mono text-ink-500 mb-s1">Model Confidence</div>
          <div className="text-[14px] font-semibold text-ink-900">
            {(explainability.confidence * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-ink-500 mb-s1">Decision Steps</div>
          <div className="text-[14px] font-semibold text-ink-900">
            {explainability.decisionPath.length}
          </div>
        </div>
      </div>
    </div>
  );
};
