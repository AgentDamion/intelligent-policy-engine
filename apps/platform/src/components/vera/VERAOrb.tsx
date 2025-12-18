import { useState, useRef, useCallback, Suspense, lazy } from 'react'
import { VERAChatWidget } from './VERAChatWidget'
import { useEnterprise } from '../../contexts/EnterpriseContext'
import type { Application, SPEObject } from '@splinetool/runtime'

// Lazy load Spline for performance
const Spline = lazy(() => import('@splinetool/react-spline'))

// ================================
// SPLINE SCENE URL - UPDATE THIS
// ================================
// After creating your scene in Spline, replace this URL:
// 1. Go to https://spline.design
// 2. Create scene following SPLINE_DESIGN_SPEC.md
// 3. Export → Code Embed → Copy URL
const SPLINE_SCENE_URL = 'https://prod.spline.design/placeholder/scene.splinecode'

// Set to true once you have a real Spline scene
const SPLINE_ENABLED = false

// Mobile detection - use CSS fallback on mobile for performance
function useIsMobile() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches || 
         window.matchMedia('(pointer: coarse)').matches
}

// Use Spline only on desktop with the feature enabled
const shouldUseSpline = () => SPLINE_ENABLED && !useIsMobile()

interface VERAOrbProps {
  className?: string
  onChatOpen?: () => void
  onChatClose?: () => void
}

// Loading skeleton for Spline
function SplineLoadingSkeleton() {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Animated loading orb */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white to-gray-100 animate-pulse" />
      <div className="text-4xl font-bold text-gray-400 z-10 animate-pulse">V</div>
      
      {/* Loading ring */}
      <div className="absolute inset-0 w-full h-full">
        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(99, 102, 241, 0.3)"
            strokeWidth="2"
            strokeDasharray="70 200"
          />
        </svg>
      </div>
    </div>
  )
}

// CSS Fallback Orb (existing implementation)
function CSSFallbackOrb({ 
  onOrbClick, 
  isHovered, 
  setIsHovered,
  tiltX,
  tiltY 
}: { 
  onOrbClick: () => void
  isHovered: boolean
  setIsHovered: (h: boolean) => void
  tiltX: number
  tiltY: number
}) {
  return (
    <div
      className="relative cursor-pointer transition-transform duration-300"
      style={{
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.05 : 1})`,
        transformStyle: 'preserve-3d'
      }}
      onClick={onOrbClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Glowing Ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="absolute w-[280px] h-[280px] rounded-full border-2 border-white/30"
          style={{
            transform: 'rotateX(60deg)',
            boxShadow: '0 0 40px rgba(255, 255, 255, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Ring Labels */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-gray-400 font-light tracking-wider">
              META-LOOP
            </div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 text-xs text-gray-400 font-light tracking-wider -rotate-90">
              POLICY
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-xs text-gray-400 font-light tracking-wider">
              PROOF
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 text-xs text-gray-400 font-light tracking-wider rotate-90">
              PARTNERS
            </div>
          </div>
        </div>
      </div>

      {/* Nodal Points (4 small orange spheres) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/50 animate-pulse"
        style={{ transform: 'translateZ(140px)' }}
      />
      <div 
        className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/50 animate-pulse"
        style={{ transform: 'translateZ(140px)', animationDelay: '0.5s' }}
      />
      <div 
        className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/50 animate-pulse"
        style={{ transform: 'translateZ(140px)', animationDelay: '1s' }}
      />
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/50 animate-pulse"
        style={{ transform: 'translateZ(140px)', animationDelay: '1.5s' }}
      />

      {/* Main White Orb */}
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-gray-50 to-white blur-xl opacity-60" />
        
        <div 
          className="relative w-full h-full rounded-full shadow-2xl"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,1), rgba(240,240,240,0.9), rgba(220,220,220,0.8))',
            boxShadow: `
              inset -10px -10px 30px rgba(0,0,0,0.1),
              inset 10px 10px 30px rgba(255,255,255,0.8),
              0 20px 60px rgba(0,0,0,0.2),
              0 0 80px rgba(255,255,255,0.3)
            `
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="text-7xl font-bold text-gray-700"
              style={{
                textShadow: `-2px -2px 0px rgba(255,255,255,0.8), 2px 2px 0px rgba(0,0,0,0.1)`,
                transform: 'translateZ(20px)',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '-0.05em'
              }}
            >
              V
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div 
              className="text-sm font-light text-gray-500 tracking-widest"
              style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
              VERA
            </div>
          </div>
        </div>
      </div>

      {/* Orange Crescent Base */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-56 h-16 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(251,146,60,0.8) 0%, rgba(234,88,12,0.6) 50%, transparent 100%)',
          filter: 'blur(12px)',
          transform: 'translateZ(-50px)',
          boxShadow: '0 0 40px rgba(251,146,60,0.6), 0 0 80px rgba(251,146,60,0.4)'
        }}
      />
    </div>
  )
}

// Spline-powered orb
function SplineOrb({ onOrbClick }: { onOrbClick: () => void }) {
  const splineRef = useRef<Application | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleSplineLoad = useCallback((spline: Application) => {
    splineRef.current = spline
    setIsLoaded(true)

    // Find the orb object for programmatic control
    const orb = spline.findObjectByName('Orb') as SPEObject | undefined
    if (orb) {
      console.log('[VERAOrb] Spline scene loaded, Orb object found')
    }
  }, [])

  const handleSplineMouseDown = useCallback((e: any) => {
    // Spline provides target.name for clicked objects
    if (e?.target?.name === 'Orb') {
      // Trigger click animation in Spline (if configured)
      if (splineRef.current) {
        splineRef.current.emitEvent('mouseDown', 'Orb')
      }
      onOrbClick()
    }
  }, [onOrbClick])

  const handleSplineError = useCallback(() => {
    console.error('[VERAOrb] Failed to load Spline scene')
    setHasError(true)
  }, [])

  if (hasError) {
    // Fall back to CSS orb on error
    return (
      <CSSFallbackOrb 
        onOrbClick={onOrbClick}
        isHovered={false}
        setIsHovered={() => {}}
        tiltX={0}
        tiltY={0}
      />
    )
  }

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <SplineLoadingSkeleton />
        </div>
      )}
      <Suspense fallback={<SplineLoadingSkeleton />}>
        <Spline
          scene={SPLINE_SCENE_URL}
          onLoad={handleSplineLoad}
          onMouseDown={handleSplineMouseDown}
          onError={handleSplineError}
          style={{ 
            width: '100%', 
            height: '100%',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      </Suspense>
    </div>
  )
}

export function VERAOrb({ className = '', onChatOpen, onChatClose }: VERAOrbProps) {
  const { currentEnterprise } = useEnterprise()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const orbRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Determine if we should use Spline (desktop only, feature enabled)
  const useSpline = shouldUseSpline()

  // Track mouse movement for CSS fallback tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!orbRef.current || isChatOpen || useSpline) return
    
    const rect = orbRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const x = (e.clientX - centerX) / (rect.width / 2)
    const y = (e.clientY - centerY) / (rect.height / 2)
    
    setMousePosition({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
  }, [isChatOpen])

  const handleOrbClick = useCallback(() => {
    setIsChatOpen(true)
    onChatOpen?.()
  }, [onChatOpen])

  const handleChatClose = useCallback(() => {
    setIsChatOpen(false)
    onChatClose?.()
  }, [onChatClose])

  // Calculate 3D transform based on mouse position (CSS fallback only)
  const tiltX = mousePosition.y * 15
  const tiltY = mousePosition.x * -15

  return (
    <div className={`relative ${className}`} onMouseMove={handleMouseMove}>
      {/* VERA Orb Container */}
      <div 
        ref={orbRef}
        className="relative w-full h-full flex items-center justify-center" 
        style={{ perspective: '1000px' }}
      >
        {useSpline ? (
          <SplineOrb onOrbClick={handleOrbClick} />
        ) : (
          <CSSFallbackOrb 
            onOrbClick={handleOrbClick}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            tiltX={tiltX}
            tiltY={tiltY}
          />
        )}
      </div>

      {/* Click to talk text */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4">
        <p className="text-xs text-gray-400 font-light tracking-wide text-center">
          Click orb to talk to VERA
        </p>
      </div>

      {/* VERA Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl h-[80vh] max-h-[800px] m-4">
            <VERAChatWidget
              enterpriseId={currentEnterprise?.id}
              onClose={handleChatClose}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
