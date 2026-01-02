import { useState, useCallback, useEffect, Suspense } from 'react'
import { VERAOrb } from './VERAOrb'
import { MessageCircle, X, Loader2 } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'

// Loading skeleton for the floating orb
function OrbLoadingSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-none">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
          <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-spin" />
        </div>
        <p className="text-sm text-gray-500">Loading VERA...</p>
      </div>
    </div>
  )
}

// Error fallback when VERAOrb fails
function OrbErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 rounded-none p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">VERA encountered an error</p>
          <p className="text-xs text-gray-500 mt-1">{error.message}</p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-none hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export function FloatingVERAOrb() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Handle expand with animation
  const handleExpand = useCallback(() => {
    setShouldRender(true)
    // Small delay to allow the container to render before animating
    requestAnimationFrame(() => {
      setIsAnimating(true)
      setIsExpanded(true)
    })
  }, [])

  // Handle collapse with animation
  const handleCollapse = useCallback(() => {
    setIsExpanded(false)
    setIsAnimating(true)
    // Delay removing from DOM until animation completes
    setTimeout(() => {
      setShouldRender(false)
      setIsAnimating(false)
    }, 300)
  }, [])

  // Keyboard escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, handleCollapse])

  // Collapsed state - floating button
  if (!shouldRender) {
    return (
      <button
        onClick={handleExpand}
        className="fixed bottom-8 right-[420px] z-[60] w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Open VERA AI Assistant"
        aria-expanded="false"
      >
        <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75" />
        {/* Tooltip on hover */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Talk to VERA
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </span>
      </button>
    )
  }

  // Expanded state - orb container
  return (
    <div 
      className={`fixed bottom-8 right-[420px] z-[60] w-96 h-96 transition-all duration-300 ease-out ${
        isExpanded && !isAnimating ? 'scale-100 opacity-100' : ''
      } ${!isExpanded ? 'scale-75 opacity-0' : ''}`}
      role="dialog"
      aria-label="VERA AI Assistant"
      aria-modal="false"
    >
      {/* Close button */}
      <button
        onClick={handleCollapse}
        className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Close VERA"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Background blur/glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl blur-xl" />

      {/* VERA Orb with error boundary */}
      <ErrorBoundary FallbackComponent={OrbErrorFallback}>
        <Suspense fallback={<OrbLoadingSkeleton />}>
          <VERAOrb 
            className="w-full h-full" 
            onChatOpen={handleCollapse}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
