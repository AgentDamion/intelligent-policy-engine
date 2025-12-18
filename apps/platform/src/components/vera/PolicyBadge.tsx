/**
 * PolicyBadge Component
 * 
 * Displays the active policy digest with a shield icon.
 * Supports click-to-copy functionality and shows full reference in tooltip.
 */

import { useState } from 'react'
import { Shield, Copy, Check, ExternalLink } from 'lucide-react'
import { usePolicyContext } from '@/hooks/usePolicyContext'
import toast from 'react-hot-toast'

interface PolicyBadgeProps {
  enterpriseId: string | undefined
  workspaceId?: string
  showFullReference?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

// Truncate digest for display
function formatDigest(digest: string, length: number = 12): string {
  if (!digest) return ''
  const cleanDigest = digest.replace('sha256:', '')
  return `sha256:${cleanDigest.slice(0, length)}...`
}

// Format the full OCI reference for display
function formatReference(reference: string): string {
  if (!reference) return ''
  // Truncate the digest part for readability
  const parts = reference.split('@')
  if (parts.length === 2) {
    const digestPart = parts[1]
    const shortDigest = digestPart.slice(0, 19) + '...'
    return `${parts[0]}@${shortDigest}`
  }
  return reference
}

export function PolicyBadge({ 
  enterpriseId, 
  workspaceId,
  showFullReference = false,
  size = 'md',
  variant = 'default',
  className = ''
}: PolicyBadgeProps) {
  const { policy, isLoading, error } = usePolicyContext(enterpriseId, workspaceId)
  const [copied, setCopied] = useState(false)

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!policy?.digest) return
    
    try {
      await navigator.clipboard.writeText(policy.digest)
      setCopied(true)
      toast.success('Policy digest copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy digest')
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`inline-flex items-center ${sizeClasses[size]} bg-slate-100 rounded-full animate-pulse ${className}`}>
        <div className={`${iconSizes[size]} bg-slate-200 rounded`} />
        <div className="w-20 h-4 bg-slate-200 rounded" />
      </div>
    )
  }

  // No policy state
  if (!policy || error) {
    return (
      <div className={`inline-flex items-center ${sizeClasses[size]} bg-slate-100 text-slate-400 rounded-full ${className}`}>
        <Shield className={`${iconSizes[size]} opacity-50`} />
        <span className="font-mono">No active policy</span>
      </div>
    )
  }

  // Compact variant - just the icon with tooltip
  if (variant === 'compact') {
    return (
      <div className="relative group">
        <button
          onClick={handleCopy}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors ${className}`}
          title={`Policy: ${policy.digest}`}
        >
          <Shield className="w-4 h-4" />
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          <div className="font-semibold mb-1">Active Policy</div>
          <div className="font-mono">{formatDigest(policy.digest)}</div>
          <div className="text-slate-400 text-[10px] mt-1">Click to copy</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    )
  }

  // Detailed variant - shows more information
  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden ${className}`}>
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Active Policy</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
            title="Copy digest"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-emerald-600" />
            )}
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Digest</div>
            <div className="font-mono text-sm text-slate-700 break-all">
              {policy.digest}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">OCI Reference</div>
            <div className="font-mono text-xs text-slate-600 break-all">
              {policy.fullReference}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500">Version</div>
              <div className="text-sm font-medium text-slate-700">v{policy.versionNumber}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Activated</div>
              <div className="text-sm font-medium text-slate-700">
                {new Date(policy.activatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default variant - inline badge
  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className={`
          inline-flex items-center ${sizeClasses[size]}
          bg-emerald-50 border border-emerald-200 
          text-emerald-700 rounded-full 
          cursor-pointer hover:bg-emerald-100 
          transition-colors font-mono
          ${className}
        `}
      >
        <Shield className={iconSizes[size]} />
        <span>
          {showFullReference 
            ? formatReference(policy.fullReference)
            : formatDigest(policy.digest)
          }
        </span>
        {copied ? (
          <Check className={`${iconSizes[size]} text-emerald-500`} />
        ) : (
          <Copy className={`${iconSizes[size]} opacity-50 group-hover:opacity-100`} />
        )}
      </button>

      {/* Tooltip with full details */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-4 py-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="font-semibold mb-2">Active Policy Digest</div>
        <div className="font-mono text-[11px] break-all text-emerald-300 mb-2">
          {policy.fullReference}
        </div>
        <div className="flex justify-between text-slate-400 text-[10px]">
          <span>Version: v{policy.versionNumber}</span>
          <span>Activated: {new Date(policy.activatedAt).toLocaleDateString()}</span>
        </div>
        <div className="text-slate-500 text-[10px] mt-2 text-center">
          Click to copy full digest
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  )
}

/**
 * Standalone policy digest display (no data fetching)
 */
export function PolicyDigestDisplay({ 
  digest, 
  fullReference,
  size = 'sm',
  className = ''
}: { 
  digest: string
  fullReference?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(digest)
      setCopied(true)
      toast.success('Digest copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center gap-1.5 ${sizeClasses[size]}
        bg-slate-100 hover:bg-slate-200 
        text-slate-700 rounded font-mono
        transition-colors
        ${className}
      `}
      title={fullReference || digest}
    >
      <Shield className="w-3 h-3 text-slate-500" />
      <span>{formatDigest(digest, 8)}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Copy className="w-3 h-3 opacity-50" />
      )}
    </button>
  )
}

export default PolicyBadge

