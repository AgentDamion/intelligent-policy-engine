import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Shield, FileText, Bot, User, Clock } from 'lucide-react'
import { buildSurfaceLink } from '@/surfaces/registry'

export type EventType = 'thread' | 'decision' | 'signature' | 'proof' | 'agent'

export interface MissionEvent {
  id: string
  type: EventType
  label: string
  actorType: 'human' | 'agent' | 'system'
  actorLabel: string
  occurredAt: string // ISO
  link?: { surface: 'mission' | 'inbox' | 'decisions' | 'forge' | 'proof' | 'lab'; id?: string }
  status?: 'ok' | 'warn' | 'error'
  raw?: string
}

function iconForType(type: EventType) {
  switch (type) {
    case 'thread':
      return <Activity className="h-4 w-4 text-indigo-600" />
    case 'decision':
    case 'signature':
      return <Shield className="h-4 w-4 text-emerald-600" />
    case 'proof':
      return <FileText className="h-4 w-4 text-teal-600" />
    case 'agent':
    default:
      return <Bot className="h-4 w-4 text-slate-600" />
  }
}

function actorIcon(actorType: MissionEvent['actorType']) {
  switch (actorType) {
    case 'human':
      return <User className="h-3.5 w-3.5 text-slate-500" />
    case 'agent':
    case 'system':
    default:
      return <Bot className="h-3.5 w-3.5 text-slate-500" />
  }
}

export default function EventStream({ events }: { events?: MissionEvent[] }) {
  const [raw, setRaw] = useState(false)

  const resolved = useMemo<MissionEvent[]>(
    () =>
      events && events.length > 0
        ? events
        : [
            {
              id: 'e1',
              type: 'thread',
              label: 'New tool request received',
              actorType: 'system',
              actorLabel: 'System',
              occurredAt: new Date().toISOString(),
              link: { surface: 'inbox' },
              status: 'ok',
              raw: '[14:23:01] System: New tool request thread created (THR_ABC)',
            },
            {
              id: 'e2',
              type: 'decision',
              label: 'Decision drafted and awaiting signature',
              actorType: 'agent',
              actorLabel: 'PolicyAgent',
              occurredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              link: { surface: 'decisions' },
              status: 'warn',
              raw: "[14:22:10] PolicyAgent: Drafted decision for thread 'THR_ABC' (needs human sign-off)",
            },
            {
              id: 'e3',
              type: 'proof',
              label: 'Proof bundle generated',
              actorType: 'system',
              actorLabel: 'System',
              occurredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              link: { surface: 'proof' },
              status: 'ok',
              raw: "[14:20:33] System: Proof bundle created for decision 'DEC_123'",
            },
          ],
    [events]
  )

  if (raw) {
    return (
      <div className="bg-slate-950 text-slate-300 font-mono text-xs p-4 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Raw log</div>
          <button
            type="button"
            onClick={() => setRaw(false)}
            className="text-[10px] font-bold text-slate-300 hover:text-white"
          >
            Show rows
          </button>
        </div>
        {resolved.map((e) => (
          <div key={e.id} className="text-slate-300">
            {e.raw || `${e.occurredAt} ${e.actorLabel}: ${e.label}`}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-600" />
          <h3 className="font-bold text-slate-900">Activity</h3>
        </div>
        <button
          type="button"
          onClick={() => setRaw(true)}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest"
        >
          Raw log
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {resolved.map((e) => {
          const content = (
            <div className="px-6 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5">{iconForType(e.type)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900 truncate">{e.label}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(e.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                  {actorIcon(e.actorType)}
                  <span className="font-medium">{e.actorLabel}</span>
                  {e.status === 'warn' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                      Needs attention
                    </span>
                  )}
                </div>
              </div>
            </div>
          )

          if (!e.link) return <div key={e.id}>{content}</div>

          return (
            <Link key={e.id} to={buildSurfaceLink(e.link.surface, e.link.id)} className="block">
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}








