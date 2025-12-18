import { DemoDecision } from '@/types/intelligenceDemo';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface DemoDecisionPanelProps {
  decision: DemoDecision;
}

const getRecommendationColor = (type: string) => {
  switch (type) {
    case 'approve':
      return 'bg-green-50 border-green-200 text-green-900';
    case 'approve_with_conditions':
      return 'bg-blue-50 border-blue-200 text-blue-900';
    case 'reject':
      return 'bg-red-50 border-red-200 text-red-900';
    case 'escalate':
      return 'bg-amber-50 border-amber-200 text-amber-900';
    default:
      return 'bg-surface-100 border-ink-200 text-ink-900';
  }
};

export const DemoDecisionPanel = ({ decision }: DemoDecisionPanelProps) => {
  return (
    <div className="p-s6 max-w-4xl mx-auto">
      <div className="space-y-s6">
        {/* Policy Header */}
        <div>
          <h2 className="text-2xl font-bold text-ink-900 mb-s2">Decision Analysis</h2>
          <div className="flex items-center gap-s2 text-ink-600">
            <span className="font-mono text-sm">{decision.policyId}</span>
            <span className="text-ink-400">•</span>
            <span className="text-sm">{decision.policyName}</span>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="bg-surface-0 border border-ink-100 rounded-lg p-s5">
          <h3 className="font-semibold text-ink-900 mb-s4">Requirements Assessment</h3>
          <div className="space-y-s3">
            {decision.requirements.map((req, index) => (
              <div key={index} className="flex items-start gap-s3">
                {req.satisfied ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={clsx(
                    'text-sm',
                    req.satisfied ? 'text-ink-700' : 'text-red-700 font-medium'
                  )}
                >
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts */}
        {decision.conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-s5">
            <div className="flex items-center gap-s2 mb-s4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">
                {decision.conflicts.filter(c => !c.resolved).length > 0
                  ? 'Conflicts Requiring Attention'
                  : 'Conflicts Resolved'}
              </h3>
            </div>
            <div className="space-y-s4">
              {decision.conflicts.map((conflict, index) => (
                <div key={index} className="space-y-s2">
                  <div className="flex items-start gap-s2">
                    {conflict.resolved ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm text-amber-900">{conflict.text}</span>
                  </div>
                  {conflict.resolution && (
                    <div className="ml-6 flex items-start gap-s2">
                      <ArrowRight className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-green-800">{conflict.resolution}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className={clsx('border-2 rounded-lg p-s5', getRecommendationColor(decision.recommendationType))}>
          <h3 className="font-semibold mb-s2 uppercase text-xs tracking-wide opacity-70">
            Recommendation
          </h3>
          <p className="text-lg font-bold">{decision.recommendation}</p>
        </div>
      </div>
    </div>
  );
};
