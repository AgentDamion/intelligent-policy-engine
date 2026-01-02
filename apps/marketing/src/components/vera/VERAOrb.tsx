import { useState, useRef, useCallback } from 'react';

interface VERAOrbProps {
  className?: string;
  onClick?: () => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// CSS-based VERA Orb component for marketing site
function CSSOrb({ 
  onClick, 
  isHovered, 
  setIsHovered,
  tiltX,
  tiltY,
  showLabels = true,
  size = 'md'
}: { 
  onClick?: () => void;
  isHovered: boolean;
  setIsHovered: (h: boolean) => void;
  tiltX: number;
  tiltY: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: { orb: 'w-32 h-32', ring: 'w-[180px] h-[180px]', text: 'text-5xl', label: 'text-xs' },
    md: { orb: 'w-48 h-48', ring: 'w-[280px] h-[280px]', text: 'text-7xl', label: 'text-sm' },
    lg: { orb: 'w-64 h-64', ring: 'w-[360px] h-[360px]', text: 'text-8xl', label: 'text-base' }
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className="relative cursor-pointer transition-transform duration-300"
      style={{
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.05 : 1})`,
        transformStyle: 'preserve-3d'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Glowing Ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`absolute ${sizes.ring} rounded-full border-2 border-primary/30`}
          style={{
            transform: 'rotateX(60deg)',
            boxShadow: '0 0 40px rgba(20, 184, 166, 0.2), inset 0 0 40px rgba(20, 184, 166, 0.1)'
          }}
        >
          {/* Ring Labels */}
          {showLabels && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-light tracking-wider uppercase">
                Meta-loop
              </div>
              <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-light tracking-wider -rotate-90 uppercase">
                Policy
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-[10px] text-muted-foreground font-light tracking-wider uppercase">
                Proof
              </div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 text-[10px] text-muted-foreground font-light tracking-wider rotate-90 uppercase">
                Partners
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nodal Points (4 small teal spheres) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50 animate-pulse"
      />
      <div 
        className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50 animate-pulse"
        style={{ animationDelay: '0.5s' }}
      />
      <div 
        className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50 animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50 animate-pulse"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Main White Orb */}
      <div className={`relative ${sizes.orb}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-gray-50 to-white blur-xl opacity-60" />
        
        <div 
          className="relative w-full h-full rounded-full shadow-2xl"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,1), rgba(245,245,240,0.95), rgba(235,235,230,0.9))',
            boxShadow: `
              inset -10px -10px 30px rgba(0,0,0,0.08),
              inset 10px 10px 30px rgba(255,255,255,0.9),
              0 20px 60px rgba(0,0,0,0.15),
              0 0 80px rgba(255,255,255,0.4)
            `
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className={`${sizes.text} font-bold text-gray-700`}
              style={{
                textShadow: `-2px -2px 0px rgba(255,255,255,0.8), 2px 2px 0px rgba(0,0,0,0.08)`,
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '-0.05em'
              }}
            >
              V
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <div 
              className={`${sizes.label} font-light text-gray-500 tracking-widest`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
              VERA
            </div>
          </div>
        </div>
      </div>

      {/* Orange/Gold Crescent Base */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-56 h-16 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.7) 0%, rgba(245,158,11,0.5) 50%, transparent 100%)',
          filter: 'blur(12px)',
          boxShadow: '0 0 40px rgba(251,191,36,0.5), 0 0 80px rgba(245,158,11,0.3)'
        }}
      />
    </div>
  );
}

export function VERAOrb({ className = '', onClick, showLabels = true, size = 'md' }: VERAOrbProps) {
  const [isHovered, setIsHovered] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse movement for tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!orbRef.current) return;
    
    const rect = orbRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    setMousePosition({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  }, []);

  // Calculate 3D transform based on mouse position
  const tiltX = mousePosition.y * 10;
  const tiltY = mousePosition.x * -10;

  return (
    <div className={`relative ${className}`} onMouseMove={handleMouseMove}>
      <div 
        ref={orbRef}
        className="relative w-full h-full flex items-center justify-center" 
        style={{ perspective: '1000px' }}
      >
        <CSSOrb 
          onClick={onClick}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
          tiltX={tiltX}
          tiltY={tiltY}
          showLabels={showLabels}
          size={size}
        />
      </div>
    </div>
  );
}

export default VERAOrb;














