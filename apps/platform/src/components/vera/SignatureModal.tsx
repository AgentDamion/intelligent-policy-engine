/**
 * SignatureModal Component
 * 
 * Week 9-10: FDA 21 CFR Part 11 Completion
 * Modal for electronic signature collection during governance actions.
 * 
 * Features:
 * - Password re-authentication
 * - Signature reason selection
 * - Legal meaning acknowledgment
 * - FDA compliance indicators
 */

import { memo, useState, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  AlertTriangle,
  Check,
  FileSignature,
  Key,
  Loader2,
  Lock,
  Shield,
  X,
} from 'lucide-react'
import { 
  electronicSignatureService,
  type SignatureReason,
  type SignatureMeaning 
} from '@/services/auth/electronicSignatureService'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  actionId: string
  actionType: string
  actionDescription: string
}

const SIGNATURE_REASONS: { value: SignatureReason; label: string }[] = [
  { value: 'approval', label: 'Approval of submission' },
  { value: 'rejection', label: 'Rejection of submission' },
  { value: 'review_completed', label: 'Review completed' },
  { value: 'escalation', label: 'Escalation for additional review' },
  { value: 'policy_change', label: 'Policy change approval' },
  { value: 'audit_acknowledgment', label: 'Audit acknowledgment' },
]

const SIGNATURE_MEANINGS: { value: SignatureMeaning; label: string; reasons: SignatureReason[] }[] = [
  { 
    value: 'I have reviewed and approve this action', 
    label: 'I have reviewed and approve this action',
    reasons: ['approval', 'policy_change']
  },
  { 
    value: 'I have reviewed and reject this action', 
    label: 'I have reviewed and reject this action',
    reasons: ['rejection']
  },
  { 
    value: 'I have completed my review of this submission', 
    label: 'I have completed my review of this submission',
    reasons: ['review_completed']
  },
  { 
    value: 'I am escalating this for additional review', 
    label: 'I am escalating this for additional review',
    reasons: ['escalation']
  },
  { 
    value: 'I acknowledge this audit finding', 
    label: 'I acknowledge this audit finding',
    reasons: ['audit_acknowledgment']
  },
]

export const SignatureModal = memo(({ 
  isOpen, 
  onClose, 
  onSuccess,
  actionId,
  actionType,
  actionDescription
}: SignatureModalProps) => {
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState<SignatureReason>('approval')
  const [meaning, setMeaning] = useState<SignatureMeaning>('I have reviewed and approve this action')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'reason' | 'authenticate' | 'confirm'>('reason')

  // Filter meanings based on selected reason
  const applicableMeanings = SIGNATURE_MEANINGS.filter(m => m.reasons.includes(reason))

  const handleReasonChange = useCallback((newReason: SignatureReason) => {
    setReason(newReason)
    // Reset meaning if it's not applicable to the new reason
    const newApplicableMeanings = SIGNATURE_MEANINGS.filter(m => m.reasons.includes(newReason))
    if (!newApplicableMeanings.find(m => m.value === meaning)) {
      setMeaning(newApplicableMeanings[0]?.value || 'I have reviewed and approve this action')
    }
  }, [meaning])

  const handleSubmit = useCallback(async () => {
    if (!password.trim()) {
      setError('Password is required for authentication')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await electronicSignatureService.signAction({
        actionId,
        reason,
        meaning,
        password,
      })

      if (result.success) {
        onSuccess()
        onClose()
        // Reset state
        setPassword('')
        setStep('reason')
        setError(null)
      } else {
        setError(result.error || 'Signature failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [actionId, reason, meaning, password, onSuccess, onClose])

  const handleClose = useCallback(() => {
    setPassword('')
    setStep('reason')
    setError(null)
    onClose()
  }, [onClose])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FileSignature className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-800">
                        Electronic Signature
                      </Dialog.Title>
                      <p className="text-xs text-slate-500">
                        FDA 21 CFR Part 11 Compliant
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Progress */}
                <div className="px-6 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {['reason', 'authenticate', 'confirm'].map((s, idx) => (
                      <Fragment key={s}>
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            step === s 
                              ? 'bg-indigo-600 text-white' 
                              : idx < ['reason', 'authenticate', 'confirm'].indexOf(step)
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {idx < ['reason', 'authenticate', 'confirm'].indexOf(step) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        {idx < 2 && (
                          <div className={`flex-1 h-0.5 ${
                            idx < ['reason', 'authenticate', 'confirm'].indexOf(step)
                              ? 'bg-emerald-500'
                              : 'bg-slate-200'
                          }`} />
                        )}
                      </Fragment>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Reason</span>
                    <span>Authenticate</span>
                    <span>Confirm</span>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  {/* Action Summary */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Action: </span>
                      {actionType}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">Description: </span>
                      {actionDescription}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {step === 'reason' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Signature Reason
                        </label>
                        <select
                          value={reason}
                          onChange={(e) => handleReasonChange(e.target.value as SignatureReason)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {SIGNATURE_REASONS.map(r => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Signature Meaning
                        </label>
                        <div className="space-y-2">
                          {applicableMeanings.map(m => (
                            <label 
                              key={m.value}
                              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                meaning === m.value
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                checked={meaning === m.value}
                                onChange={() => setMeaning(m.value)}
                                className="mt-0.5"
                              />
                              <span className="text-sm text-slate-700">{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 'authenticate' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                        <Lock className="w-4 h-4 text-indigo-500" />
                        <span>Re-authenticate to confirm your identity</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 'confirm' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                          <Shield className="w-4 h-4" />
                          Legal Acknowledgment
                        </div>
                        <p className="text-sm text-amber-700">
                          By clicking "Sign", you acknowledge that this electronic signature 
                          is legally binding and equivalent to a handwritten signature under 
                          FDA 21 CFR Part 11 regulations.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                        <p className="text-sm">
                          <span className="font-medium text-slate-700">Reason: </span>
                          <span className="text-slate-600">
                            {SIGNATURE_REASONS.find(r => r.value === reason)?.label}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-slate-700">Meaning: </span>
                          <span className="text-slate-600">{meaning}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => {
                      if (step === 'authenticate') setStep('reason')
                      else if (step === 'confirm') setStep('authenticate')
                      else handleClose()
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    {step === 'reason' ? 'Cancel' : 'Back'}
                  </button>

                  <button
                    onClick={() => {
                      if (step === 'reason') setStep('authenticate')
                      else if (step === 'authenticate') setStep('confirm')
                      else handleSubmit()
                    }}
                    disabled={isLoading || (step === 'authenticate' && !password.trim())}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing...
                      </>
                    ) : step === 'confirm' ? (
                      <>
                        <FileSignature className="w-4 h-4" />
                        Sign
                      </>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
})
SignatureModal.displayName = 'SignatureModal'

export default SignatureModal

