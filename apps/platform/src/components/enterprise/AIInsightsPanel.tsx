export function AIInsightsPanel({
  phase,
  recommendation,
  aiDecisions,
  onRouteToReview
}: {
  phase: string
  recommendation?: any
  aiDecisions: any[]
  onRouteToReview?: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-slate-700">AI Intelligence Hub</h3>
      
      <div className="space-y-3">
        {/* MetaLoop Status */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-600">MetaLoop Phase</div>
          <div className="mt-1 text-sm font-medium text-slate-800 capitalize">{phase}</div>
        </div>

        {/* AI Confidence Meter */}
        {aiDecisions.length > 0 && (
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-600">AI Confidence</div>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-600 transition-all duration-500"
                    style={{ 
                      width: `${Math.round(
                        aiDecisions.reduce((acc, d) => acc + (d.details?.confidence || 0), 0) / aiDecisions.length * 100
                      )}%` 
                    }}
                  />
                </div>
                <span className="text-xs text-slate-700">
                  {Math.round(
                    aiDecisions.reduce((acc, d) => acc + (d.details?.confidence || 0), 0) / aiDecisions.length * 100
                  )}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {recommendation && (
          <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
            <div className="text-xs text-teal-700 font-medium">AI Recommendation</div>
            <p className="mt-1 text-sm text-teal-800">{recommendation.title}</p>
            {onRouteToReview && (
              <button
                onClick={() => onRouteToReview(recommendation.id)}
                className="mt-2 text-xs text-teal-600 hover:text-teal-700 underline"
              >
                Route to Review →
              </button>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-slate-600">Decisions/hr</div>
            <div className="font-medium text-slate-800">{aiDecisions.length * 12}</div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-slate-600">Accuracy</div>
            <div className="font-medium text-slate-800">98.5%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
