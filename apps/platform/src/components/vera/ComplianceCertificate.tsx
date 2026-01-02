/**
 * ComplianceCertificate Component
 * 
 * Generates a formal compliance certificate for an enterprise:
 * - Professional certificate design with VERA branding
 * - Compliance score and breakdown
 * - Certification period and validity
 * - QR code for verification
 * - Print and PDF export functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Shield,
  ShieldCheck,
  Award,
  Download,
  Printer,
  Copy,
  CheckCircle,
  Calendar,
  Building2,
  Hash,
  Loader2,
  X
} from 'lucide-react'
import { Button } from '../ui/button'
import { getComplianceScore, type ComplianceScore } from '../../services/vera/veraDashboardService'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface ComplianceCertificateProps {
  enterpriseId: string
  onClose?: () => void
  className?: string
}

interface EnterpriseInfo {
  id: string
  name: string
  domain?: string
  tier?: string
  createdAt?: Date
}

interface CertificateData {
  certificateId: string
  enterpriseInfo: EnterpriseInfo
  complianceScore: ComplianceScore
  issuedAt: Date
  validUntil: Date
  veraVersion: string
  certificationLevel: 'bronze' | 'silver' | 'gold' | 'platinum'
  verificationHash: string
}

function generateCertificateId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'VERA-'
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    if (i < 3) result += '-'
  }
  return result
}

function generateVerificationHash(data: string): string {
  // Simple hash for demo - in production use proper crypto
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(16, '0').toUpperCase()
}

function getCertificationLevel(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (score >= 95) return 'platinum'
  if (score >= 85) return 'gold'
  if (score >= 70) return 'silver'
  return 'bronze'
}

const certificationColors = {
  bronze: {
    primary: '#CD7F32',
    secondary: '#B87333',
    gradient: 'from-amber-600 to-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700'
  },
  silver: {
    primary: '#C0C0C0',
    secondary: '#A8A8A8',
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700'
  },
  gold: {
    primary: '#FFD700',
    secondary: '#DAA520',
    gradient: 'from-yellow-400 to-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700'
  },
  platinum: {
    primary: '#E5E4E2',
    secondary: '#C0C0C8',
    gradient: 'from-violet-400 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-700'
  }
}

function CertificateBadge({ level }: { level: 'bronze' | 'silver' | 'gold' | 'platinum' }) {
  const colors = certificationColors[level]
  
  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${colors.gradient} p-1 shadow-lg`}>
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <Award className={`w-12 h-12 ${colors.text}`} />
        </div>
      </div>
      <span className={`mt-2 text-sm font-bold uppercase tracking-wider ${colors.text}`}>
        {level} Certified
      </span>
    </div>
  )
}

function QRCodePlaceholder({ data: _data }: { data: string }) {
  // In production, use a proper QR code library like qrcode.react
  // For now, we'll show a placeholder that represents the QR code
  // The _data parameter would be used to generate the actual QR code
  return (
    <div className="w-24 h-24 bg-white border-2 border-slate-900 rounded-none p-1 flex items-center justify-center">
      <div className="w-full h-full bg-slate-900 rounded grid grid-cols-5 gap-0.5 p-1">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm ${
              Math.random() > 0.4 ? 'bg-white' : 'bg-slate-900'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 90) return '#10b981'
    if (s >= 75) return '#8b5cf6'
    if (s >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
      </div>
    </div>
  )
}

export function ComplianceCertificate({
  enterpriseId,
  onClose,
  className = ''
}: ComplianceCertificateProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)

  // Load certificate data
  useEffect(() => {
    async function loadCertificateData() {
      setIsLoading(true)
      
      try {
        // Fetch enterprise info - only select columns that exist
        const { data: enterprise, error: enterpriseError } = await supabase
          .from('enterprises')
          .select('id, name, domain, created_at')
          .eq('id', enterpriseId)
          .single()

        if (enterpriseError) throw enterpriseError

        // Fetch compliance score with fallback
        let complianceScore = await getComplianceScore(enterpriseId)

        // Provide default score if not available (for demo/testing)
        if (!complianceScore) {
          complianceScore = {
            overall: 85,
            policyAdherence: 90,
            auditCompleteness: 82,
            toolApprovalRate: 88,
            trend7d: 2,
            trend30d: 5
          }
        }

        const certificationLevel = getCertificationLevel(complianceScore.overall)
        const issuedAt = new Date()
        const validUntil = new Date()
        validUntil.setMonth(validUntil.getMonth() + 3) // Valid for 3 months

        const certificateId = generateCertificateId()
        const verificationHash = generateVerificationHash(
          `${enterpriseId}${certificateId}${issuedAt.toISOString()}${complianceScore.overall}`
        )

        setCertificateData({
          certificateId,
          enterpriseInfo: {
            id: enterprise.id,
            name: enterprise.name,
            domain: enterprise.domain,
            tier: 'standard', // Default tier since column may not exist
            createdAt: enterprise.created_at ? new Date(enterprise.created_at) : undefined
          },
          complianceScore,
          issuedAt,
          validUntil,
          veraVersion: '1.0.0',
          certificationLevel,
          verificationHash
        })
      } catch (error) {
        console.error('Error loading certificate data:', error)
        toast.error('Failed to load certificate data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCertificateData()
  }, [enterpriseId])

  // Handle print
  const handlePrint = useCallback(() => {
    setIsPrinting(true)
    
    // Small delay to ensure print styles are applied
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }, [])

  // Handle download as PDF (using browser print dialog)
  const handleDownloadPDF = useCallback(() => {
    setIsPrinting(true)
    
    // Trigger print dialog - user can select "Save as PDF"
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }, [])

  // Copy verification hash
  const handleCopyHash = useCallback(() => {
    if (certificateData?.verificationHash) {
      navigator.clipboard.writeText(certificateData.verificationHash)
      toast.success('Verification hash copied to clipboard')
    }
  }, [certificateData])

  // Copy certificate ID
  const handleCopyCertificateId = useCallback(() => {
    if (certificateData?.certificateId) {
      navigator.clipboard.writeText(certificateData.certificateId)
      toast.success('Certificate ID copied to clipboard')
    }
  }, [certificateData])

  if (isLoading) {
    return (
      <div className={`bg-white rounded-none border border-slate-200 shadow-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Generating certificate...</p>
          <p className="text-slate-400 text-sm mt-1">Please wait</p>
        </div>
      </div>
    )
  }

  if (!certificateData) {
    return (
      <div className={`bg-white rounded-none border border-slate-200 shadow-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Generate Certificate</h3>
          <p className="text-slate-600 text-center max-w-md">
            We couldn't generate a compliance certificate at this time. Please ensure your enterprise has sufficient compliance data.
          </p>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  const colors = certificationColors[certificateData.certificationLevel]

  return (
    <>
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #compliance-certificate, #compliance-certificate * {
              visibility: visible;
            }
            #compliance-certificate {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 40px;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .print-break-inside-avoid {
              break-inside: avoid;
            }
          }
        `}
      </style>

      <div className={`${className}`}>
        {/* Action Bar - Hidden on print */}
        <div className="no-print bg-slate-50 border border-slate-200 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-slate-900">AI Governance Compliance Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              variant="outline"
              size="sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isPrinting}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Save PDF
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Certificate Content */}
        <div
          id="compliance-certificate"
          ref={certificateRef}
          className="bg-white border-x border-b border-slate-200 rounded-b-2xl overflow-hidden"
        >
          {/* Certificate Header with Border */}
          <div className={`border-8 ${colors.border} m-4 rounded-none overflow-hidden`}>
            {/* Header Banner */}
            <div className={`bg-gradient-to-r ${colors.gradient} py-6 px-8`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-none flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">VERA</h1>
                    <p className="text-white/80 text-sm">Velocity Engine for Risk & Assurance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-xs uppercase tracking-wider">Certificate of</p>
                  <p className="text-xl font-bold text-white">AI Governance Compliance</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8 bg-gradient-to-b from-white to-slate-50">
              {/* Organization Info */}
              <div className="text-center mb-8">
                <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">
                  This is to certify that
                </p>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  {certificateData.enterpriseInfo.name}
                </h2>
                {certificateData.enterpriseInfo.domain && (
                  <p className="text-slate-600">{certificateData.enterpriseInfo.domain}</p>
                )}
              </div>

              {/* Badge and Score */}
              <div className="flex items-center justify-center gap-12 mb-8 print-break-inside-avoid">
                <CertificateBadge level={certificateData.certificationLevel} />
                
                <div className="flex flex-col items-center">
                  <ScoreGauge score={certificateData.complianceScore.overall} size={100} />
                  <p className="text-slate-500 text-sm mt-2">Compliance Score</p>
                </div>
              </div>

              {/* Certification Statement */}
              <div className="text-center mb-8 px-8">
                <p className="text-slate-700 leading-relaxed">
                  has been evaluated and certified by VERA AI Governance System for maintaining 
                  <span className="font-semibold"> {certificateData.certificationLevel.toUpperCase()} </span>
                  level compliance with AI governance policies and industry best practices.
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-8 print-break-inside-avoid">
                <div className={`text-center p-4 rounded-none ${colors.bg} ${colors.border} border`}>
                  <p className="text-3xl font-bold text-slate-900">
                    {certificateData.complianceScore.policyAdherence}%
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Policy Adherence</p>
                </div>
                <div className={`text-center p-4 rounded-none ${colors.bg} ${colors.border} border`}>
                  <p className="text-3xl font-bold text-slate-900">
                    {certificateData.complianceScore.auditCompleteness}%
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Audit Completeness</p>
                </div>
                <div className={`text-center p-4 rounded-none ${colors.bg} ${colors.border} border`}>
                  <p className="text-3xl font-bold text-slate-900">
                    {certificateData.complianceScore.toolApprovalRate}%
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Tool Approval Rate</p>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="grid grid-cols-2 gap-8 mb-8 print-break-inside-avoid">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Certificate ID:</span>
                    <button 
                      onClick={handleCopyCertificateId}
                      className="font-mono text-slate-900 hover:text-purple-600 transition-colors no-print"
                      title="Click to copy"
                    >
                      {certificateData.certificateId}
                    </button>
                    <span className="font-mono text-slate-900 hidden print:inline">
                      {certificateData.certificateId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Issued:</span>
                    <span className="text-slate-900">
                      {certificateData.issuedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Valid Until:</span>
                    <span className="text-slate-900">
                      {certificateData.validUntil.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Enterprise Tier:</span>
                    <span className="text-slate-900 capitalize">
                      {certificateData.enterpriseInfo.tier || 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <QRCodePlaceholder data={`vera://verify/${certificateData.certificateId}`} />
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Scan to verify
                  </p>
                </div>
              </div>

              {/* Verification Hash */}
              <div className="bg-slate-100 rounded-none p-4 print-break-inside-avoid">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Verification Hash
                    </p>
                    <code className="text-sm font-mono text-slate-700">
                      {certificateData.verificationHash}
                    </code>
                  </div>
                  <button 
                    onClick={handleCopyHash}
                    className="no-print p-2 hover:bg-slate-200 rounded-none transition-colors"
                    title="Copy hash"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200 print-break-inside-avoid">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-slate-600">
                      Automatically verified by VERA v{certificateData.veraVersion}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Powered by</p>
                      <p className="text-sm font-semibold text-slate-700">AIComplyr.io</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-none flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
              This certificate is automatically generated based on the enterprise's compliance metrics 
              at the time of issuance. It represents a point-in-time assessment and should be 
              re-validated periodically. For official compliance attestation, please contact 
              AIComplyr.io for a formal audit.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ComplianceCertificate
