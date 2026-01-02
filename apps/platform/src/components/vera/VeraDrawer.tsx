import { useEffect, useMemo, useState } from 'react'
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
          <div className="h-8 w-8 rounded-none bg-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-aicomplyr-black truncate uppercase tracking-wider">VERA</div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate">
              Navigator · Recommendations · Audit context
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-none text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
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
            className={`px-3 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              tab === 'summary'
                ? 'bg-aicomplyr-black text-white border-aicomplyr-black'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setTab('recommendations')}
            className={`px-3 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              tab === 'recommendations'
                ? 'bg-aicomplyr-black text-white border-aicomplyr-black'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Recs
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-3 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              tab === 'history'
                ? 'bg-aicomplyr-black text-white border-aicomplyr-black'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
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
            <div className="p-4 rounded-none border-l-structural border-l-aicomplyr-black bg-neutral-50 border border-neutral-200">
              <div className="text-[10px] font-bold text-aicomplyr-black uppercase tracking-widest mb-2">
                What changed
              </div>
              <ul className="text-sm text-neutral-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 bg-aicomplyr-yellow flex-shrink-0" />
                  New requests arrived in Triage that require routing.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 bg-aicomplyr-yellow flex-shrink-0" />
                  At least one decision is ready for signature on Decisions surface.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-none border border-neutral-200 bg-white">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                Guardrails
              </div>
              <div className="text-sm text-neutral-700 space-y-1">
                <p>Signatures only happen on <span className="font-semibold">Decisions</span>.</p>
                <p>Exports are logged from <span className="font-semibold">Evidence Vault</span>.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'recommendations' && (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-none border-l-structural border-l-aicomplyr-black border border-neutral-200 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-aicomplyr-black">{rec.title}</div>
                    <div className="text-xs text-neutral-600 mt-1 leading-relaxed">{rec.why}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <ListChecks className="h-4 w-4 text-aicomplyr-black" />
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    to={buildSurfaceLink(rec.surface, rec.targetId, rec.query)}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-xs font-bold text-aicomplyr-black uppercase tracking-wider hover:underline"
                  >
                    Jump
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            <div className="p-4 rounded-none border-l-structural border-l-neutral-400 bg-neutral-50 border border-neutral-200">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-neutral-600" />
                <div className="text-[10px] font-bold text-aicomplyr-black uppercase tracking-widest">
                  VERA History (stub)
                </div>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                This will show your recent VERA prompts, recommendations, and surface handoffs with trace IDs.
              </p>
              <div className="mt-3">
                <Link
                  to="/vera-plus"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-xs font-bold text-aicomplyr-black uppercase tracking-wider hover:underline"
                >
                  Open VERA+ hub
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}








