import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Sparkles, ListChecks, History, ArrowRight } from 'lucide-react'
import { buildSurfaceLink } from '@/surfaces/registry'

export interface VeraDrawerProps {
  open: boolean
  onClose: () => void
}

type VeraTab = 'summary' | 'recommendations' | 'history'

interface VeraRecommendation {
  id: string
  title: string
  why: string
  surface: 'mission' | 'inbox' | 'decisions' | 'forge' | 'proof' | 'lab'
  targetId?: string
  query?: Record<string, string>
}

const DRAWER_WIDTH_CLASS = 'w-[380px] max-w-[90vw]'

export default function VeraDrawer({ open, onClose }: VeraDrawerProps) {
  const [tab, setTab] = useState<VeraTab>('summary')

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const recommendations: VeraRecommendation[] = useMemo(
    () => [
      {
        id: 'triage_hot',
        title: 'Triage high-priority tool requests',
        why: 'New high-severity threads need routing to a decision owner.',
        surface: 'inbox',
      },
      {
        id: 'sign_pending',
        title: 'Review & sign pending decisions',
        why: 'Decision drafts exist; signatures must occur on the Decisions surface.',
        surface: 'decisions',
      },
      {
        id: 'export_bundle',
        title: 'Export regulator-ready proof bundle',
        why: 'Exports are logged and must be initiated from Evidence Vault.',
        surface: 'proof',
      },
    ],
    []
  )

  return (
    <aside
      aria-label="VERA drawer"
      className={`fixed right-0 top-0 h-screen ${DRAWER_WIDTH_CLASS} bg-white border-l border-slate-200 shadow-2xl z-40 transform transition-transform duration-200 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">VERA</div>
            <div className="text-[11px] text-slate-500 truncate">
              Navigator · Recommendations · Audit context
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          aria-label="Close VERA"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTab('summary')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              tab === 'summary'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setTab('recommendations')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              tab === 'recommendations'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Recs
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              tab === 'history'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 overflow-y-auto h-[calc(100vh-56px-64px)]">
        {tab === 'summary' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                What changed
              </div>
              <ul className="text-sm text-slate-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  New requests arrived in Triage that require routing.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  At least one decision is ready for signature on Decisions surface.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Guardrails
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                <p>Signatures only happen on <span className="font-semibold">Decisions</span>.</p>
                <p>Exports are logged from <span className="font-semibold">Evidence Vault</span>.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'recommendations' && (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">{rec.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{rec.why}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <ListChecks className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    to={buildSurfaceLink(rec.surface, rec.targetId, rec.query)}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                  >
                    Jump
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-slate-600" />
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  VERA History (stub)
                </div>
              </div>
              <p className="text-sm text-slate-700">
                This will show your recent VERA prompts, recommendations, and surface handoffs with trace IDs.
              </p>
              <div className="mt-3">
                <Link
                  to="/vera-plus"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  Open VERA+ hub
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}








