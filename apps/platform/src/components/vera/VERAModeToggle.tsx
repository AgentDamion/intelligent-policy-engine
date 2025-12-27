/**
 * VERAModeToggle Component
 * 
 * Toggle between VERA operating modes:
 * - Shadow Mode: Observe-only, generates draft decisions without enforcement
 * - Enforcement Mode: Active governance with real-time blocking/approval
 * - Disabled: VERA is completely disabled
 * 
 * Includes confirmation dialog for mode changes and transition history
 */

import React, { useState, useCallback } from 'react'
import {
  ShieldCheck,
  ShieldOff,
  Eye,
  Zap,
  AlertTriangle,
  Check,
  History,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { Button } from '../ui/button'
import type { VERAMode } from '../../services/vera/veraPreferencesService'

interface VERAModeToggleProps {
  currentMode: VERAMode
  onModeChange: (mode: VERAMode, reason?: string) => Promise<boolean>
  isLoading?: boolean
  disabled?: boolean
  showHistory?: boolean
  transitionHistory?: Array<{
    id: string
    fromMode: VERAMode | null
    toMode: VERAMode
    transitionedAt: Date
    reason: string | null
  }>
  className?: string
}

interface ModeOption {
  mode: VERAMode
  label: string
  description: string
  icon: React.ReactNode
  color: {
    bg: string
    border: string
    text: string
    ring: string
    activeBg: string
  }
  features: string[]
}

const modeOptions: ModeOption[] = [
  {
    mode: 'shadow',
    label: 'Shadow Mode',
    description: 'Observe and learn without enforcing decisions',
    icon: <Eye className="w-5 h-5" />,
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      ring: 'ring-amber-500/20',
      activeBg: 'bg-amber-100'
    },
    features: [
      'Zero-risk pilot mode',
      'Draft decisions generated',
      'No blocking enforcement',
      'Full audit trail',
      'Compare AI vs human decisions'
    ]
  },
  {
    mode: 'enforcement',
    label: 'Enforcement Mode',
    description: 'Active governance with real-time enforcement',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      ring: 'ring-emerald-500/20',
      activeBg: 'bg-emerald-100'
    },
    features: [
      'Real-time blocking',
      'Auto-clear for compliant requests',
      'Verified Proof Bundles',
      'Full policy enforcement',
      'Cryptographic audit trail'
    ]
  },
  {
    mode: 'disabled',
    label: 'Disabled',
    description: 'VERA governance is completely disabled',
    icon: <ShieldOff className="w-5 h-5" />,
    color: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-500',
      ring: 'ring-slate-500/20',
      activeBg: 'bg-slate-100'
    },
    features: [
      'No governance active',
      'Manual review only',
      'No automated decisions',
      'Historical data preserved'
    ]
  }
]

function ConfirmationDialog({
  isOpen,
  fromMode,
  toMode,
  onConfirm,
  onCancel,
  isLoading
}: {
  isOpen: boolean
  fromMode: VERAMode
  toMode: VERAMode
  onConfirm: (reason: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')
  const toOption = modeOptions.find(o => o.mode === toMode)

  if (!isOpen) return null

  const isDowngrade = toMode === 'disabled' || (fromMode === 'enforcement' && toMode === 'shadow')
  const isUpgrade = toMode === 'enforcement' || (fromMode === 'disabled' && toMode === 'shadow')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${toOption?.color.bg} border-b ${toOption?.color.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${toOption?.color.activeBg} ${toOption?.color.text}`}>
              {toOption?.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Switch to {toOption?.label}
              </h3>
              <p className="text-sm text-slate-600">
                {isDowngrade ? 'This will reduce governance coverage' : 
                 isUpgrade ? 'This will enable active governance' : 
                 'Confirm mode change'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning for enforcement mode */}
          {toMode === 'enforcement' && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Production Impact</p>
                  <p className="mt-0.5 text-amber-600">
                    Enabling enforcement mode will actively block non-compliant requests in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for disabled mode */}
          {toMode === 'disabled' && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-rose-700">
                  <p className="font-medium">Governance Disabled</p>
                  <p className="mt-0.5 text-rose-600">
                    Disabling VERA will stop all automated governance. Manual review will be required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for change <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Testing new policies before enforcement..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Features preview */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              What changes
            </p>
            <ul className="space-y-1.5">
              {toOption?.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className={`w-4 h-4 ${toOption.color.text}`} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className={`
              ${toMode === 'enforcement' ? 'bg-emerald-600 hover:bg-emerald-700' :
                toMode === 'disabled' ? 'bg-slate-600 hover:bg-slate-700' :
                'bg-amber-600 hover:bg-amber-700'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Confirm Switch
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function VERAModeToggle({
  currentMode,
  onModeChange,
  isLoading = false,
  disabled = false,
  showHistory = false,
  transitionHistory = [],
  className = ''
}: VERAModeToggleProps) {
  const [pendingMode, setPendingMode] = useState<VERAMode | null>(null)
  const [isChanging, setIsChanging] = useState(false)

  const handleModeSelect = useCallback((mode: VERAMode) => {
    if (mode === currentMode || disabled || isLoading) return
    setPendingMode(mode)
  }, [currentMode, disabled, isLoading])

  const handleConfirm = useCallback(async (reason: string) => {
    if (!pendingMode) return
    
    setIsChanging(true)
    try {
      const success = await onModeChange(pendingMode, reason || undefined)
      if (success) {
        setPendingMode(null)
      }
    } finally {
      setIsChanging(false)
    }
  }, [pendingMode, onModeChange])

  const handleCancel = useCallback(() => {
    setPendingMode(null)
  }, [])

  const currentOption = modeOptions.find(o => o.mode === currentMode)

  return (
    <div className={className}>
      {/* Current Mode Display */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${currentOption?.color.bg} ${currentOption?.color.ring} ring-4`}>
            <div className={currentOption?.color.text}>
              {currentOption?.icon}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Mode
            </p>
            <p className={`text-lg font-bold ${currentOption?.color.text}`}>
              {currentOption?.label}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 ml-14">
          {currentOption?.description}
        </p>
      </div>

      {/* Mode Options */}
      <div className="space-y-3">
        {modeOptions.map((option) => {
          const isSelected = option.mode === currentMode
          const isPending = option.mode === pendingMode
          
          return (
            <button
              key={option.mode}
              onClick={() => handleModeSelect(option.mode)}
              disabled={disabled || isLoading || isSelected}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected 
                  ? `${option.color.activeBg} ${option.color.border} ring-2 ${option.color.ring}` 
                  : `bg-white border-slate-200 hover:border-slate-300 hover:shadow-md`
                }
                ${isPending ? 'ring-2 ring-purple-500' : ''}
                ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${option.color.bg} ${option.color.text}`}>
                    {option.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{option.label}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{option.description}</p>
                  </div>
                </div>
                {!isSelected && (
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                )}
                {isSelected && (
                  <Check className={`w-5 h-5 ${option.color.text}`} />
                )}
              </div>

              {/* Feature list (expanded when selected) */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Features
                  </p>
                  <ul className="grid grid-cols-2 gap-2">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Check className={`w-3 h-3 ${option.color.text}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Transition History */}
      {showHistory && transitionHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-700">Recent Changes</h4>
          </div>
          <div className="space-y-2">
            {transitionHistory.slice(0, 5).map((transition) => {
              const toOption = modeOptions.find(o => o.mode === transition.toMode)
              return (
                <div 
                  key={transition.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${toOption?.color.bg} ${toOption?.color.text}`}>
                      {toOption?.icon && React.cloneElement(toOption.icon as React.ReactElement, { className: 'w-3 h-3' })}
                    </div>
                    <span className="text-slate-600">
                      {transition.fromMode ? `${transition.fromMode} → ` : ''}{transition.toMode}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {transition.transitionedAt.toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={pendingMode !== null}
        fromMode={currentMode}
        toMode={pendingMode || 'shadow'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isChanging}
      />
    </div>
  )
}

export default VERAModeToggle

