/**
 * ContextSnapshotViewer Component
 * 
 * Displays the full context snapshot captured at decision time.
 * FDA 21 CFR Part 11 compliance: Shows complete decision context for audit trails.
 */

import { memo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Shield,
  Users,
  Wrench,
  Building2,
  Globe,
  Clock,
} from 'lucide-react'
import type { ContextSnapshot } from '@/services/vera/governanceThreadService'

interface ContextSnapshotViewerProps {
  snapshot: ContextSnapshot
  compact?: boolean
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

const CollapsibleSection = memo(({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          {title}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 bg-white border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  )
})
CollapsibleSection.displayName = 'CollapsibleSection'

const KeyValue = memo(({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex justify-between items-start py-1.5 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className={`text-xs text-slate-700 text-right ${mono ? 'font-mono' : ''}`}>
      {value}
    </span>
  </div>
))
KeyValue.displayName = 'KeyValue'

const RiskBadge = memo(({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const styles = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[level]}`}>
      {level.toUpperCase()}
    </span>
  )
})
RiskBadge.displayName = 'RiskBadge'

const ModeBadge = memo(({ mode }: { mode: 'disabled' | 'shadow' | 'enforcement' }) => {
  const styles = {
    disabled: 'bg-slate-100 text-slate-600',
    shadow: 'bg-indigo-100 text-indigo-700',
    enforcement: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[mode]}`}>
      {mode.toUpperCase()}
    </span>
  )
})
ModeBadge.displayName = 'ModeBadge'

export const ContextSnapshotViewer = memo(({ snapshot, compact = false }: ContextSnapshotViewerProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Database className="w-3 h-3" />
        <span>Policy v{snapshot.policy_state.version}</span>
        <span className="text-slate-300">•</span>
        <RiskBadge level={snapshot.partner_state.risk_level} />
        <span className="text-slate-300">•</span>
        <ModeBadge mode={snapshot.enterprise_state.vera_mode} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Policy State */}
      <CollapsibleSection 
        title="Policy State" 
        icon={<Shield className="w-4 h-4 text-indigo-500" />}
        defaultOpen
      >
        <div className="space-y-1">
          <KeyValue label="EPS ID" value={snapshot.policy_state.eps_id?.slice(0, 8) + '...'} mono />
          <KeyValue label="Version" value={snapshot.policy_state.version} />
          <KeyValue 
            label="Hash" 
            value={snapshot.policy_state.sha256_hash?.slice(0, 16) + '...'} 
            mono 
          />
          {snapshot.policy_state.policy_json && (
            <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono text-slate-600 max-h-32 overflow-y-auto">
              {JSON.stringify(snapshot.policy_state.policy_json, null, 2).slice(0, 500)}
              {JSON.stringify(snapshot.policy_state.policy_json).length > 500 && '...'}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Partner State */}
      <CollapsibleSection 
        title="Partner State" 
        icon={<Users className="w-4 h-4 text-blue-500" />}
      >
        <div className="space-y-1">
          <KeyValue 
            label="Partner ID" 
            value={snapshot.partner_state.partner_id?.slice(0, 8) + '...' || 'N/A'} 
            mono 
          />
          <KeyValue 
            label="Compliance Score" 
            value={`${snapshot.partner_state.compliance_score}%`} 
          />
          <KeyValue 
            label="Active Attestations" 
            value={snapshot.partner_state.active_attestations} 
          />
          <KeyValue 
            label="Risk Level" 
            value={<RiskBadge level={snapshot.partner_state.risk_level} />} 
          />
        </div>
      </CollapsibleSection>

      {/* Tool State */}
      <CollapsibleSection 
        title="Tool State" 
        icon={<Wrench className="w-4 h-4 text-amber-500" />}
      >
        <div className="space-y-2">
          {snapshot.tool_state.tools_evaluated.length > 0 ? (
            snapshot.tool_state.tools_evaluated.map((tool, idx) => (
              <div key={idx} className="p-2 bg-slate-50 rounded">
                <KeyValue label="Tool ID" value={tool.tool_id?.slice(0, 8) + '...'} mono />
                <KeyValue label="Vendor" value={tool.vendor} />
                <KeyValue label="Risk Profile" value={tool.risk_profile} />
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No tools evaluated</span>
          )}
          <KeyValue 
            label="Last Audit" 
            value={snapshot.tool_state.last_audit_date || 'N/A'} 
          />
        </div>
      </CollapsibleSection>

      {/* Enterprise State */}
      <CollapsibleSection 
        title="Enterprise State" 
        icon={<Building2 className="w-4 h-4 text-purple-500" />}
      >
        <div className="space-y-1">
          <KeyValue 
            label="Enterprise ID" 
            value={snapshot.enterprise_state.enterprise_id?.slice(0, 8) + '...'} 
            mono 
          />
          <KeyValue 
            label="VERA Mode" 
            value={<ModeBadge mode={snapshot.enterprise_state.vera_mode} />} 
          />
          <KeyValue 
            label="Compliance Posture" 
            value={snapshot.enterprise_state.compliance_posture} 
          />
          <div className="mt-2">
            <span className="text-xs text-slate-500">Regulatory Environment</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {snapshot.enterprise_state.regulatory_environment.length > 0 ? (
                snapshot.enterprise_state.regulatory_environment.map((reg, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                  >
                    {reg}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None specified</span>
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* External Context */}
      <CollapsibleSection 
        title="External Context" 
        icon={<Globe className="w-4 h-4 text-teal-500" />}
      >
        <div className="space-y-1">
          <KeyValue 
            label="Regulatory Guidance" 
            value={snapshot.external_context.regulatory_guidance_version} 
          />
          <KeyValue 
            label="Decision Timestamp" 
            value={
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(snapshot.external_context.decision_timestamp).toLocaleString()}
              </span>
            } 
          />
          <KeyValue 
            label="Agent Version" 
            value={snapshot.external_context.agent_version} 
            mono 
          />
        </div>
      </CollapsibleSection>

      {/* Submission Details */}
      {snapshot.submission_details && (
        <CollapsibleSection 
          title="Submission Details" 
          icon={<FileText className="w-4 h-4 text-slate-500" />}
        >
          <div className="p-2 bg-slate-50 rounded text-xs font-mono text-slate-600 max-h-32 overflow-y-auto">
            {JSON.stringify(snapshot.submission_details, null, 2)}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
})
ContextSnapshotViewer.displayName = 'ContextSnapshotViewer'

export default ContextSnapshotViewer

