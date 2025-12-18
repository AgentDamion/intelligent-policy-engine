import { DemoMetrics } from '@/types/intelligenceDemo';
import { useCountUp } from '@/hooks/useMessageStreaming';
import { Clock, Shield, TrendingDown, DollarSign } from 'lucide-react';

interface DemoMetricsOverlayProps {
  metrics: DemoMetrics;
  isActive: boolean;
}

export const DemoMetricsOverlay = ({ metrics, isActive }: DemoMetricsOverlayProps) => {
  const complianceScore = useCountUp(metrics.complianceScore, 2000, isActive);
  const riskReduction = useCountUp(metrics.riskReduction, 2000, isActive);

  return (
    <div className="p-s6 max-w-5xl mx-auto">
      <div className="space-y-s6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink-900 mb-s2">Outcome & Impact</h2>
          <p className="text-ink-600">
            AI governance system completed what would have taken weeks of manual review
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-s6">
          {/* Time Saved - Primary Metric */}
          <div className="bg-white border border-ink-100 rounded-lg p-s6 text-center shadow-sm hover:shadow-md transition-shadow">
            <Clock className="h-6 w-6 text-ink-400 mx-auto mb-s3" strokeWidth={1.5} />
            <div className="text-sm font-medium text-ink-600 uppercase tracking-wide mb-s2">
              Time Saved
            </div>
            <div className="text-6xl font-bold text-ink-900 mb-s2">{metrics.timeSaved.split(',')[0]}</div>
            <div className="text-xs text-ink-500">vs traditional manual process</div>
          </div>

          {/* Compliance Score - Primary Metric with Brand Color */}
          <div className="bg-white border border-ink-100 rounded-lg p-s6 text-center shadow-sm hover:shadow-md transition-shadow">
            <Shield className="h-6 w-6 text-ink-400 mx-auto mb-s3" strokeWidth={1.5} />
            <div className="text-sm font-medium text-ink-600 uppercase tracking-wide mb-s2">
              Compliance Score
            </div>
            <div className="text-6xl font-bold text-primary mb-s2">{complianceScore}%</div>
            <div className="text-xs text-ink-500">FDA audit-ready documentation</div>
          </div>

          {/* Risk Reduction - Secondary Metric */}
          <div className="bg-white border border-ink-100 rounded-lg p-s6 text-center shadow-sm hover:shadow-md transition-shadow">
            <TrendingDown className="h-6 w-6 text-ink-400 mx-auto mb-s3" strokeWidth={1.5} />
            <div className="text-sm font-medium text-ink-600 uppercase tracking-wide mb-s2">
              Risk Reduction
            </div>
            <div className="text-4xl font-bold text-ink-900 mb-s2">{riskReduction}%</div>
            <div className="text-xs text-ink-500">fewer audit findings expected</div>
          </div>

          {/* Cost Impact - Secondary Metric */}
          <div className="bg-white border border-ink-100 rounded-lg p-s6 text-center shadow-sm hover:shadow-md transition-shadow">
            <DollarSign className="h-6 w-6 text-ink-400 mx-auto mb-s3" strokeWidth={1.5} />
            <div className="text-sm font-medium text-ink-600 uppercase tracking-wide mb-s2">
              Cost Impact
            </div>
            <div className="text-4xl font-bold text-ink-900 mb-s2">{metrics.costImpact}</div>
            <div className="text-xs text-ink-500">saved in delays and rework</div>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="bg-white border border-ink-100 rounded-lg p-s6">
          <h3 className="text-sm font-semibold text-ink-700 uppercase tracking-wide mb-s6 text-center">
            Before vs After
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-s8 relative">
            {/* Vertical separator line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-ink-200 -translate-x-1/2" />
            
            {/* Left: Manual Process */}
            <div className="text-left md:pr-s4">
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-s4">
                Manual Process
              </div>
              <div className="space-y-s3 text-sm text-ink-700">
                <div>45+ days review time</div>
                <div>Multiple expert consultations</div>
                <div>Inconsistent interpretations</div>
                <div>High risk of oversights</div>
              </div>
            </div>
            
            {/* Right: AI Governance */}
            <div className="text-left md:pl-s4">
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-s4">
                AI Governance
              </div>
              <div className="space-y-s3 text-sm text-ink-900">
                <div><strong className="font-semibold">18 seconds</strong> to approval</div>
                <div>Multi-agent collaboration</div>
                <div><strong className="font-semibold">Consistent</strong> policy application</div>
                <div><strong className="font-semibold">Complete</strong> audit trail</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
