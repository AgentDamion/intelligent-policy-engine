/**
 * VERASettingsPage
 * 
 * Comprehensive settings page for VERA configuration:
 * - Mode Toggle (Shadow/Enforcement/Disabled)
 * - Velocity Coefficients (for ROI calculations)
 * - Notification Preferences
 * - Feature Toggles (Auto-Clear, DLP, Meta-Loop)
 * - Data Retention Settings
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Settings,
  Bell,
  Database,
  Sliders,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Clock,
  Zap,
  Eye,
  Lock,
  Mail,
  MessageSquare,
  Loader2,
  Award,
  FileText,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VERAModeToggle } from '@/components/vera/VERAModeToggle'
import { ComplianceCertificate } from '@/components/vera/ComplianceCertificate'
import { PolicyBadge } from '@/components/vera/PolicyBadge'
import { useEnterprise } from '@/contexts/EnterpriseContext'
import { usePolicyContext, usePolicyActivationHistory, useAvailablePolicyArtifacts } from '@/hooks/usePolicyContext'
import { supabase } from '@/lib/supabase'
import {
  getOrCreateVERAPreferences,
  updateVERAPreferences,
  setVERAMode,
  getModeTransitionHistory,
  type VERAPreferences,
  type VERAMode
} from '@/services/vera/veraPreferencesService'
import toast from 'react-hot-toast'

interface SettingsSectionProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SettingsSection({ title, description, icon, children }: SettingsSectionProps) {
  return (
    <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-white shadow-sm border border-slate-200">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
        ${enabled ? 'bg-purple-600' : 'bg-slate-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div
        className={`
          absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  disabled?: boolean
}

function NumberInput({ value, onChange, min, max, step = 1, prefix, suffix, disabled }: NumberInputProps) {
  return (
    <div className="flex items-center gap-2">
      {prefix && <span className="text-sm text-slate-500">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-32 px-3 py-2 border border-slate-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50"
      />
      {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
    </div>
  )
}

// Policy Activation Section Component
function PolicyActivationSection({ enterpriseId }: { enterpriseId: string }) {
  const { policy, isLoading: isPolicyLoading, invalidate } = usePolicyContext(enterpriseId)
  const { data: artifacts = [], isLoading: isArtifactsLoading } = useAvailablePolicyArtifacts(enterpriseId)
  const { data: history = [], isLoading: isHistoryLoading } = usePolicyActivationHistory(enterpriseId, 10)
  
  const [isActivating, setIsActivating] = useState(false)
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null)
  const [activationReason, setActivationReason] = useState<string>('policy_update')
  const [activationNotes, setActivationNotes] = useState('')

  const handleActivate = async () => {
    if (!selectedArtifactId) {
      toast.error('Please select a policy artifact')
      return
    }

    setIsActivating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Please sign in to activate policies')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          policyArtifactId: selectedArtifactId,
          enterpriseId,
          activationReason,
          activationNotes: activationNotes || undefined
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Policy activated successfully')
        invalidate()
        setSelectedArtifactId(null)
        setActivationNotes('')
      } else {
        toast.error(result.error || 'Failed to activate policy')
      }
    } catch (error) {
      console.error('[PolicyActivation] Error:', error)
      toast.error('Failed to activate policy')
    } finally {
      setIsActivating(false)
    }
  }

  const isLoading = isPolicyLoading || isArtifactsLoading || isHistoryLoading

  if (isLoading) {
    return (
      <SettingsSection
        title="Policy Activation"
        description="Manage active policy digests for OCI-based governance"
        icon={<FileText className="w-5 h-5 text-emerald-600" />}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </SettingsSection>
    )
  }

  return (
    <SettingsSection
      title="Policy Activation"
      description="Manage active policy digests for OCI-based governance"
      icon={<FileText className="w-5 h-5 text-emerald-600" />}
    >
      <div className="space-y-6">
        {/* Current Active Policy */}
        <div className="p-4 rounded-none bg-slate-50 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Current Active Policy</h4>
          {policy ? (
            <div className="space-y-3">
              <PolicyBadge 
                enterpriseId={enterpriseId}
                variant="detailed"
              />
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">
              No active policy. Activate a policy artifact below.
            </div>
          )}
        </div>

        {/* Activate New Policy */}
        {artifacts.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">Activate New Policy Version</h4>
            
            {/* Artifact Selection */}
            <div>
              <label className="block text-sm text-slate-500 mb-2">Policy Artifact</label>
              <select
                value={selectedArtifactId || ''}
                onChange={(e) => setSelectedArtifactId(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a policy artifact...</option>
                {artifacts.map((artifact) => (
                  <option key={artifact.id} value={artifact.id}>
                    {artifact.policyName} v{artifact.versionNumber} ({artifact.digest.slice(0, 16)}...)
                  </option>
                ))}
              </select>
            </div>

            {/* Activation Reason */}
            <div>
              <label className="block text-sm text-slate-500 mb-2">Activation Reason</label>
              <select
                value={activationReason}
                onChange={(e) => setActivationReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="initial_deployment">Initial Deployment</option>
                <option value="policy_update">Policy Update</option>
                <option value="rollback">Rollback</option>
                <option value="compliance_remediation">Compliance Remediation</option>
                <option value="emergency_change">Emergency Change</option>
                <option value="scheduled_update">Scheduled Update</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-slate-500 mb-2">Notes (optional)</label>
              <textarea
                value={activationNotes}
                onChange={(e) => setActivationNotes(e.target.value)}
                placeholder="Add notes about this activation..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Activate Button */}
            <Button
              onClick={handleActivate}
              disabled={!selectedArtifactId || isActivating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Activate Policy
                </>
              )}
            </Button>
          </div>
        )}

        {artifacts.length === 0 && (
          <div className="p-4 rounded-none bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-700">
              No policy artifacts available. Create a policy in Policy Studio first, 
              then publish it as an artifact.
            </p>
          </div>
        )}

        {/* Activation History */}
        {history.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Activations</h4>
            <div className="space-y-2">
              {history.slice(0, 5).map((activation: any) => (
                <div
                  key={activation.activation_id}
                  className="flex items-center justify-between p-3 rounded-none bg-slate-50 border border-slate-200 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activation.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <code className="text-xs text-slate-600 font-mono">
                      {activation.active_digest.slice(0, 20)}...
                    </code>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(activation.activated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  )
}

export default function VERASettingsPage() {
  const { currentEnterprise } = useEnterprise()
  const enterpriseId = currentEnterprise?.id

  // State
  const [preferences, setPreferences] = useState<VERAPreferences | null>(null)
  const [transitionHistory, setTransitionHistory] = useState<Array<{
    id: string
    fromMode: VERAMode | null
    toMode: VERAMode
    transitionedAt: Date
    reason: string | null
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)

  // Local form state
  const [formState, setFormState] = useState({
    avgCampaignValueUsd: 150000,
    avgManualReviewDays: 14,
    avgToolProcurementDays: 30,
    autoClearEnabled: true,
    autoClearThreshold: 95,
    dlpEnabled: true,
    metaLoopEnabled: false,
    proofBundleRetentionDays: 365,
    auditLogRetentionDays: 730,
    emailOnDecision: true,
    emailOnAlert: true,
    emailOnProofBundle: false,
    realtimeEnabled: true
  })

  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!enterpriseId) {
        setIsLoading(false)
        return
      }

      try {
        const [prefs, history] = await Promise.all([
          getOrCreateVERAPreferences(enterpriseId),
          getModeTransitionHistory(enterpriseId)
        ])

        if (prefs) {
          setPreferences(prefs)
          setFormState({
            avgCampaignValueUsd: prefs.avgCampaignValueUsd,
            avgManualReviewDays: prefs.avgManualReviewDays,
            avgToolProcurementDays: prefs.avgToolProcurementDays,
            autoClearEnabled: prefs.autoClearEnabled,
            autoClearThreshold: Math.round(prefs.autoClearThreshold * 100),
            dlpEnabled: prefs.dlpEnabled,
            metaLoopEnabled: prefs.metaLoopEnabled,
            proofBundleRetentionDays: prefs.proofBundleRetentionDays,
            auditLogRetentionDays: prefs.auditLogRetentionDays,
            emailOnDecision: prefs.notificationPreferences.email_on_decision,
            emailOnAlert: prefs.notificationPreferences.email_on_alert,
            emailOnProofBundle: prefs.notificationPreferences.email_on_proof_bundle,
            realtimeEnabled: prefs.notificationPreferences.realtime_enabled
          })
        }

        setTransitionHistory(history)
      } catch (error) {
        console.error('[VERASettingsPage] Error loading preferences:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [enterpriseId])

  // Handle form changes
  const updateFormState = useCallback((updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }, [])

  // Handle mode change
  const handleModeChange = useCallback(async (mode: VERAMode, reason?: string): Promise<boolean> => {
    if (!enterpriseId) return false

    try {
      const success = await setVERAMode(enterpriseId, mode, reason)
      if (success) {
        setPreferences(prev => prev ? { ...prev, veraMode: mode } : null)
        toast.success(`Switched to ${mode} mode`)
        
        // Refresh history
        const history = await getModeTransitionHistory(enterpriseId)
        setTransitionHistory(history)
        
        return true
      }
      return false
    } catch (error) {
      console.error('[VERASettingsPage] Error changing mode:', error)
      toast.error('Failed to change mode')
      return false
    }
  }, [enterpriseId])

  // Save preferences
  const handleSave = useCallback(async () => {
    if (!enterpriseId || !preferences) return

    setIsSaving(true)
    try {
      const updated = await updateVERAPreferences(enterpriseId, {
        avgCampaignValueUsd: formState.avgCampaignValueUsd,
        avgManualReviewDays: formState.avgManualReviewDays,
        avgToolProcurementDays: formState.avgToolProcurementDays,
        autoClearEnabled: formState.autoClearEnabled,
        autoClearThreshold: formState.autoClearThreshold / 100,
        dlpEnabled: formState.dlpEnabled,
        metaLoopEnabled: formState.metaLoopEnabled,
        proofBundleRetentionDays: formState.proofBundleRetentionDays,
        auditLogRetentionDays: formState.auditLogRetentionDays,
        notificationPreferences: {
          email_on_decision: formState.emailOnDecision,
          email_on_alert: formState.emailOnAlert,
          email_on_proof_bundle: formState.emailOnProofBundle,
          realtime_enabled: formState.realtimeEnabled
        }
      })

      if (updated) {
        setPreferences(updated)
        setHasChanges(false)
        toast.success('Settings saved successfully')
      }
    } catch (error) {
      console.error('[VERASettingsPage] Error saving preferences:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }, [enterpriseId, preferences, formState])

  // Reset changes
  const handleReset = useCallback(() => {
    if (!preferences) return

    setFormState({
      avgCampaignValueUsd: preferences.avgCampaignValueUsd,
      avgManualReviewDays: preferences.avgManualReviewDays,
      avgToolProcurementDays: preferences.avgToolProcurementDays,
      autoClearEnabled: preferences.autoClearEnabled,
      autoClearThreshold: Math.round(preferences.autoClearThreshold * 100),
      dlpEnabled: preferences.dlpEnabled,
      metaLoopEnabled: preferences.metaLoopEnabled,
      proofBundleRetentionDays: preferences.proofBundleRetentionDays,
      auditLogRetentionDays: preferences.auditLogRetentionDays,
      emailOnDecision: preferences.notificationPreferences.email_on_decision,
      emailOnAlert: preferences.notificationPreferences.email_on_alert,
      emailOnProofBundle: preferences.notificationPreferences.email_on_proof_bundle,
      realtimeEnabled: preferences.notificationPreferences.realtime_enabled
    })
    setHasChanges(false)
  }, [preferences])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading VERA settings...</p>
        </div>
      </div>
    )
  }

  if (!enterpriseId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Enterprise Selected</h2>
          <p className="text-slate-600">Please select an enterprise to configure VERA settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-none bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">VERA Settings</h1>
                <p className="text-sm text-slate-500">Configure your AI Governance Officer</p>
              </div>
            </div>

            {/* Save/Reset buttons */}
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Unsaved changes
                </span>
              )}
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Mode Toggle Section */}
        <SettingsSection
          title="Operating Mode"
          description="Control how VERA handles governance decisions"
          icon={<Shield className="w-5 h-5 text-purple-600" />}
        >
          <VERAModeToggle
            currentMode={preferences?.veraMode || 'shadow'}
            onModeChange={handleModeChange}
            showHistory
            transitionHistory={transitionHistory}
          />
        </SettingsSection>

        {/* Policy Activation */}
        {enterpriseId && <PolicyActivationSection enterpriseId={enterpriseId} />}

        {/* Velocity Coefficients */}
        <SettingsSection
          title="Velocity Coefficients"
          description="Configure values used for ROI and velocity calculations"
          icon={<Sliders className="w-5 h-5 text-blue-600" />}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Average Campaign Value</p>
                  <p className="text-xs text-slate-500">Used to calculate Revenue Protected metric</p>
                </div>
              </div>
              <NumberInput
                value={formState.avgCampaignValueUsd}
                onChange={(v) => updateFormState({ avgCampaignValueUsd: v })}
                prefix="$"
                suffix="USD"
                min={0}
                step={1000}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Average Manual Review Days</p>
                  <p className="text-xs text-slate-500">Typical time for manual policy review</p>
                </div>
              </div>
              <NumberInput
                value={formState.avgManualReviewDays}
                onChange={(v) => updateFormState({ avgManualReviewDays: v })}
                suffix="days"
                min={1}
                max={90}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Average Tool Procurement Days</p>
                  <p className="text-xs text-slate-500">Typical time for new tool procurement</p>
                </div>
              </div>
              <NumberInput
                value={formState.avgToolProcurementDays}
                onChange={(v) => updateFormState({ avgToolProcurementDays: v })}
                suffix="days"
                min={1}
                max={180}
              />
            </div>
          </div>
        </SettingsSection>

        {/* Feature Toggles */}
        <SettingsSection
          title="Feature Toggles"
          description="Enable or disable VERA capabilities"
          icon={<Zap className="w-5 h-5 text-amber-600" />}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Auto-Clear</p>
                  <p className="text-xs text-slate-500">Automatically approve low-risk compliant requests</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {formState.autoClearEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Threshold:</span>
                    <NumberInput
                      value={formState.autoClearThreshold}
                      onChange={(v) => updateFormState({ autoClearThreshold: v })}
                      suffix="%"
                      min={80}
                      max={100}
                    />
                  </div>
                )}
                <ToggleSwitch
                  enabled={formState.autoClearEnabled}
                  onChange={(v) => updateFormState({ autoClearEnabled: v })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-rose-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">DLP Engine</p>
                  <p className="text-xs text-slate-500">Data Loss Prevention for sensitive content</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={formState.dlpEnabled}
                onChange={(v) => updateFormState({ dlpEnabled: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Meta-Loop Intelligence</p>
                  <p className="text-xs text-slate-500">AI-powered continuous policy refinement</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                  Beta
                </span>
                <ToggleSwitch
                  enabled={formState.metaLoopEnabled}
                  onChange={(v) => updateFormState({ metaLoopEnabled: v })}
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Configure how you receive VERA updates"
          icon={<Bell className="w-5 h-5 text-indigo-600" />}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email on Decisions</p>
                  <p className="text-xs text-slate-500">Receive email for each governance decision</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={formState.emailOnDecision}
                onChange={(v) => updateFormState({ emailOnDecision: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email on Alerts</p>
                  <p className="text-xs text-slate-500">Receive email for policy violations and alerts</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={formState.emailOnAlert}
                onChange={(v) => updateFormState({ emailOnAlert: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email on Proof Bundles</p>
                  <p className="text-xs text-slate-500">Receive email when Proof Bundles are generated</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={formState.emailOnProofBundle}
                onChange={(v) => updateFormState({ emailOnProofBundle: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Real-time Notifications</p>
                  <p className="text-xs text-slate-500">Show in-app notifications for VERA events</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={formState.realtimeEnabled}
                onChange={(v) => updateFormState({ realtimeEnabled: v })}
              />
            </div>
          </div>
        </SettingsSection>

        {/* Data Retention */}
        <SettingsSection
          title="Data Retention"
          description="Configure how long VERA data is stored"
          icon={<Database className="w-5 h-5 text-slate-600" />}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Proof Bundle Retention</p>
                <p className="text-xs text-slate-500">How long to keep Proof Bundles</p>
              </div>
              <NumberInput
                value={formState.proofBundleRetentionDays}
                onChange={(v) => updateFormState({ proofBundleRetentionDays: v })}
                suffix="days"
                min={90}
                max={3650}
                step={30}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Audit Log Retention</p>
                <p className="text-xs text-slate-500">How long to keep detailed audit logs</p>
              </div>
              <NumberInput
                value={formState.auditLogRetentionDays}
                onChange={(v) => updateFormState({ auditLogRetentionDays: v })}
                suffix="days"
                min={365}
                max={3650}
                step={30}
              />
            </div>

            <div className="p-3 rounded-none bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">
                <strong>Note:</strong> Data retention settings comply with enterprise data governance policies. 
                Some data may be retained longer for regulatory compliance.
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Compliance Certification */}
        <SettingsSection
          title="Compliance Certification"
          description="Generate formal compliance certificates for your organization"
          icon={<Award className="w-5 h-5 text-amber-600" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Generate a formal AI Governance Compliance Certificate based on your current 
              compliance score and governance metrics. Certificates are valid for 3 months 
              and can be printed or saved as PDF.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 rounded-none bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-amber-100">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Certificate Features</p>
                    <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <li>• Compliance score breakdown</li>
                      <li>• Certification level (Bronze/Silver/Gold/Platinum)</li>
                      <li>• QR code for verification</li>
                      <li>• Cryptographic verification hash</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowCertificate(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
            >
              <Award className="w-4 h-4 mr-2" />
              Generate Compliance Certificate
            </Button>
          </div>
        </SettingsSection>
      </div>

      {/* Certificate Modal */}
      {showCertificate && enterpriseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-none shadow-2xl">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors no-print"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <ComplianceCertificate
              enterpriseId={enterpriseId}
              onClose={() => setShowCertificate(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

