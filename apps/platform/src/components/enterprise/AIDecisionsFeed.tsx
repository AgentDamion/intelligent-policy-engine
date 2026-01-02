interface AIDecision {
  id: string
  agent: string
  action: string
  outcome: 'approved' | 'rejected' | 'needs_review'
  risk: 'low' | 'medium' | 'high'
  created_at: string
  details?: any
}

export function AIDecisionsFeed({
  decisions,
  loading,
  onAnalyzeDocument
}: {
  decisions: AIDecision[]
  loading: boolean
  onAnalyzeDocument?: (doc: any) => void
}) {
  if (loading) {
    return <div className="h-64 rounded-none bg-slate-100 animate-pulse" />
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'approved': return 'text-green-600 bg-green-50'
      case 'rejected': return 'text-red-600 bg-red-50'
      case 'needs_review': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <section className="rounded-none border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">AI Agent Decisions</h3>
        <span className="text-xs text-slate-500">Real-time feed</span>
      </div>

      {decisions.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-none border border-dashed border-slate-200">
          <div className="text-center">
            <p className="text-sm text-slate-500">No AI decisions yet</p>
            {onAnalyzeDocument && (
              <button 
                onClick={() => onAnalyzeDocument({ type: 'test', content: 'Test document' })}
                className="mt-2 text-sm text-teal-600 hover:text-teal-700"
              >
                Analyze Test Document
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.slice(0, 5).map((decision) => (
            <div key={decision.id} className="rounded-none border border-slate-200 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{decision.agent}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getOutcomeColor(decision.outcome)}`}>
                      {decision.outcome}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{decision.action}</p>
                  {decision.details?.reasoning && (
                    <p className="mt-1 text-xs text-slate-500">{decision.details.reasoning}</p>
                  )}
                </div>
                <time className="text-xs text-slate-500">
                  {new Date(decision.created_at).toLocaleTimeString()}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
