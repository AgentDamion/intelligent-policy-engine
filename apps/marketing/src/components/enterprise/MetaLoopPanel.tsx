import React from 'react'
import type { MetaLoopRec } from '../../pages/enterprise/types'

export function MetaLoopPanel({
  phase,
  rec,
  onRouteToReview
}: {
  phase: string
  rec?: MetaLoopRec
  onRouteToReview: (id: string) => void
}) {
  const phaseColors = {
    observe: 'bg-blue-50 text-blue-700',
    document: 'bg-purple-50 text-purple-700',
    analyze: 'bg-amber-50 text-amber-700',
    recommend: 'bg-emerald-50 text-emerald-700'
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-slate-700">MetaLoop Intelligence</h3>
      
      <div className="space-y-3">
        {/* Current Phase */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-600">Current Phase</div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${phaseColors[phase as keyof typeof phaseColors] || 'bg-gray-50 text-gray-700'}`}>
              {phase}
            </span>
          </div>
        </div>

        {/* Recommendation */}
        {rec && (
          <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-teal-700 font-medium">AI Recommendation</div>
                <p className="mt-1 text-sm text-teal-800">{rec.title}</p>
                {rec.rationale && (
                  <p className="mt-1 text-xs text-teal-600">{rec.rationale}</p>
                )}
                <div className="mt-2 flex items-center gap-4">
                  <div className="text-xs text-teal-600">
                    Confidence: <span className="font-medium">{Math.round(rec.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => onRouteToReview(rec.id)}
              className="mt-3 w-full rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Route to Review
            </button>
          </div>
        )}

        {/* Phase Progress */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-600 mb-2">Phase Progress</div>
          <div className="flex items-center gap-1">
            {['observe', 'document', 'analyze', 'recommend'].map((p, i) => (
              <React.Fragment key={p}>
                <div className={`h-1.5 flex-1 rounded-full ${
                  ['observe', 'document', 'analyze', 'recommend'].indexOf(phase) >= i
                    ? 'bg-teal-600'
                    : 'bg-slate-200'
                }`} />
                {i < 3 && <div className="w-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
