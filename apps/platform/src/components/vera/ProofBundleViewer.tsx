/**
 * ProofBundleViewer Component
 * 
 * Displays detailed view of a VERA Proof Bundle:
 * - Decision summary and status
 * - EPS (Effective Policy Snapshot) information
 * - Policy evaluation details
 * - Cryptographic verification status
 * - Certificate generation and QR code
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Download,
  QrCode,
  Loader2,
  Eye,
  Lock,
  Fingerprint,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '../ui/button'
import {
  getProofBundle,
  verifyProofBundle,
  generateCertificateUrl,
  generateQRCodeData,
  type ProofBundle,
  type ProofBundleStatus,
  type DecisionType
} from '../../services/vera/proofBundleService'
import { PolicyDigestDisplay } from './PolicyBadge'
import toast from 'react-hot-toast'

interface ProofBundleViewerProps {
  proofBundleId: string
  onClose?: () => void
  className?: string
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const statusConfig: Record<ProofBundleStatus, { icon: React.ReactNode; color: string; label: string }> = {
  draft: {
    icon: <Eye className="w-5 h-5" />,
    color: 'amber',
    label: 'Draft (Shadow Mode)'
  },
  verified: {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'emerald',
    label: 'Verified'
  },
  blocked: {
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'rose',
    label: 'Blocked'
  },
  pending_verification: {
    icon: <Clock className="w-5 h-5" />,
    color: 'blue',
    label: 'Pending Verification'
  }
}

const decisionConfig: Record<DecisionType, { icon: React.ReactNode; color: string; label: string }> = {
  approved: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'emerald',
    label: 'Approved'
  },
  rejected: {
    icon: <XCircle className="w-5 h-5" />,
    color: 'rose',
    label: 'Rejected'
  },
  escalated: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'amber',
    label: 'Escalated'
  },
  auto_cleared: {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'emerald',
    label: 'Auto-Cleared'
  },
  needs_review: {
    icon: <Eye className="w-5 h-5" />,
    color: 'blue',
    label: 'Needs Review'
  }
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{icon}</span>
          <span className="font-semibold text-slate-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm text-slate-900 text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function HashDisplay({ hash, label }: { hash?: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!hash) return
    navigator.clipboard.writeText(hash)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }, [hash])

  if (!hash) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-sm text-slate-400 italic">Not available</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
          {hash.substring(0, 8)}...{hash.substring(hash.length - 8)}
        </code>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
          title="Copy full hash"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  )
}

export function ProofBundleViewer({
  proofBundleId,
  onClose,
  className = ''
}: ProofBundleViewerProps) {
  const [bundle, setBundle] = useState<ProofBundle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null)
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null)
  const [isGeneratingCert, setIsGeneratingCert] = useState(false)

  // Load proof bundle
  useEffect(() => {
    async function loadBundle() {
      setIsLoading(true)
      const data = await getProofBundle(proofBundleId)
      setBundle(data)
      setIsLoading(false)
    }

    loadBundle()
  }, [proofBundleId])

  // Verify proof bundle
  const handleVerify = useCallback(async () => {
    setIsVerifying(true)
    const result = await verifyProofBundle(proofBundleId)
    setVerificationResult(result)
    setIsVerifying(false)
    
    if (result.valid) {
      toast.success('Proof bundle verification passed')
    } else {
      toast.error(result.message)
    }
  }, [proofBundleId])

  // Generate certificate
  const handleGenerateCertificate = useCallback(async () => {
    setIsGeneratingCert(true)
    const url = await generateCertificateUrl(proofBundleId)
    setCertificateUrl(url)
    setIsGeneratingCert(false)
    
    if (url) {
      toast.success('Certificate URL generated')
    }
  }, [proofBundleId])

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
          <p className="text-slate-600">Loading proof bundle...</p>
        </div>
      </div>
    )
  }

  if (!bundle) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center text-center">
          <ShieldOff className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Proof Bundle Not Found</h3>
          <p className="text-slate-600 mb-4">The requested proof bundle could not be loaded.</p>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[bundle.status]
  const decisionInfo = bundle.decision ? decisionConfig[bundle.decision] : null
  const toolInfo = bundle.atomStatesSnapshot?.toolUsage?.[0]
  const qrData = generateQRCodeData(bundle)

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${statusInfo.color}-100 text-${statusInfo.color}-600`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Proof Bundle</h2>
              <p className="text-sm text-slate-500 font-mono">{bundle.id.substring(0, 8)}...</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
            {statusInfo.icon}
            <span className="text-sm font-medium">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Decision Summary */}
        {decisionInfo && (
          <div className={`p-4 rounded-xl bg-${decisionInfo.color}-50 border border-${decisionInfo.color}-200`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`text-${decisionInfo.color}-600`}>
                {decisionInfo.icon}
              </div>
              <span className={`text-lg font-bold text-${decisionInfo.color}-700`}>
                Decision: {decisionInfo.label}
              </span>
            </div>
            {bundle.draftReasoning && (
              <p className="text-sm text-slate-600 mt-2">{bundle.draftReasoning}</p>
            )}
          </div>
        )}

        {/* Justification Section - Audit Compliance */}
        {(bundle.rationaleHuman || bundle.justification?.human_readable) && (
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                Decision Justification
              </span>
            </div>
            
            {/* Human-readable rationale - prominently displayed */}
            <div className="px-3 py-2 bg-slate-800 rounded-lg font-mono text-sm text-slate-200 mb-3">
              {bundle.rationaleHuman || bundle.justification?.human_readable}
            </div>
            
            {/* Structured rationale details */}
            {(bundle.rationaleStructured || bundle.justification?.structured) && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Policy:</span>
                  <span className="ml-2 font-medium">
                    {(bundle.rationaleStructured || bundle.justification?.structured)?.policy_id}
                    {' v'}
                    {(bundle.rationaleStructured || bundle.justification?.structured)?.policy_version}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Rule:</span>
                  <span className="ml-2 font-medium truncate" title={(bundle.rationaleStructured || bundle.justification?.structured)?.rule_matched}>
                    {(bundle.rationaleStructured || bundle.justification?.structured)?.rule_matched}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Confidence:</span>
                  <span className="ml-2 font-medium">
                    {((bundle.rationaleStructured || bundle.justification?.structured)?.confidence_score !== undefined) 
                      ? `${Math.round(((bundle.rationaleStructured || bundle.justification?.structured)?.confidence_score || 0) * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Actor:</span>
                  <span className="ml-2 font-medium">
                    {(bundle.rationaleStructured || bundle.justification?.structured)?.actor?.name || 
                     (bundle.rationaleStructured || bundle.justification?.structured)?.actor?.type || 
                     'automated'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tool Information */}
        {toolInfo && (
          <CollapsibleSection title="Tool Information" icon={<FileText className="w-4 h-4" />}>
            <InfoRow label="Tool Name" value={toolInfo.toolKey || toolInfo.toolId || 'Unknown'} />
            {toolInfo.vendor && <InfoRow label="Vendor" value={toolInfo.vendor} />}
            {toolInfo.action && <InfoRow label="Action" value={toolInfo.action} />}
            {bundle.atomStatesSnapshot?.riskScore !== undefined && (
              <InfoRow 
                label="Risk Score" 
                value={
                  <span className={`font-semibold ${
                    bundle.atomStatesSnapshot.riskScore >= 70 ? 'text-rose-600' :
                    bundle.atomStatesSnapshot.riskScore >= 40 ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>
                    {bundle.atomStatesSnapshot.riskScore}%
                  </span>
                } 
              />
            )}
          </CollapsibleSection>
        )}

        {/* Policy Evaluation */}
        {bundle.atomStatesSnapshot?.policyReasons && bundle.atomStatesSnapshot.policyReasons.length > 0 && (
          <CollapsibleSection title="Policy Evaluation" icon={<Shield className="w-4 h-4" />}>
            <div className="space-y-2">
              {bundle.atomStatesSnapshot.policyReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{reason}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Policy Digest (OCI-based governance) */}
        {bundle.policyDigest && (
          <CollapsibleSection title="Policy Governance" icon={<Shield className="w-4 h-4" />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Policy Digest</span>
                <PolicyDigestDisplay 
                  digest={bundle.policyDigest} 
                  fullReference={bundle.policyReference}
                  size="sm"
                />
              </div>
              {bundle.policyReference && (
                <div className="py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500 block mb-1">Full OCI Reference</span>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700 block break-all">
                    {bundle.policyReference}
                  </code>
                </div>
              )}
              {bundle.traceId && (
                <InfoRow label="Trace ID" value={bundle.traceId.substring(0, 16) + '...'} mono />
              )}
              {bundle.policyArtifactId && (
                <InfoRow label="Artifact ID" value={bundle.policyArtifactId.substring(0, 8) + '...'} mono />
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* EPS Information (Legacy) */}
        <CollapsibleSection title="Effective Policy Snapshot (EPS)" icon={<Lock className="w-4 h-4" />} defaultOpen={!bundle.policyDigest}>
          <InfoRow label="EPS ID" value={bundle.epsSnapshotId || 'N/A'} mono />
          <InfoRow label="EPS Version" value={bundle.epsVersion || 'N/A'} />
          <HashDisplay hash={bundle.epsHash} label="EPS Hash" />
        </CollapsibleSection>

        {/* Cryptographic Verification */}
        <CollapsibleSection title="Cryptographic Verification" icon={<Fingerprint className="w-4 h-4" />}>
          <HashDisplay hash={bundle.contentHash} label="Content Hash" />
          <HashDisplay hash={bundle.signatureHash} label="Signature Hash" />
          <InfoRow label="VERA Mode" value={bundle.veraMode} />
          {bundle.verifiedAt && (
            <InfoRow 
              label="Verified At" 
              value={bundle.verifiedAt.toLocaleString()} 
            />
          )}
          {bundle.verifiedBy && (
            <InfoRow label="Verified By" value={bundle.verifiedBy} />
          )}

          {/* Verification Button */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              variant="outline"
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify Integrity
                </>
              )}
            </Button>

            {verificationResult && (
              <div className={`mt-3 p-3 rounded-lg ${
                verificationResult.valid 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-rose-50 border border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {verificationResult.valid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    verificationResult.valid ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {verificationResult.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Timestamps */}
        <CollapsibleSection title="Timeline" icon={<Clock className="w-4 h-4" />} defaultOpen={false}>
          <InfoRow label="Created" value={bundle.createdAt.toLocaleString()} />
          <InfoRow label="Updated" value={bundle.updatedAt.toLocaleString()} />
          {bundle.submissionId && (
            <InfoRow label="Submission ID" value={bundle.submissionId} mono />
          )}
        </CollapsibleSection>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerateCertificate}
              disabled={isGeneratingCert}
              variant="outline"
            >
              {isGeneratingCert ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Certificate
                </>
              )}
            </Button>

            {certificateUrl && (
              <Button
                onClick={() => window.open(certificateUrl, '_blank')}
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Certificate
              </Button>
            )}

            <Button
              onClick={() => {
                navigator.clipboard.writeText(qrData)
                toast.success('QR data copied')
              }}
              variant="outline"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Copy QR Data
            </Button>

            {onClose && (
              <Button variant="outline" onClick={onClose} className="ml-auto">
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProofBundleViewer

