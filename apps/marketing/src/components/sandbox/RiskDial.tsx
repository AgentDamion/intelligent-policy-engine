import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { RiskLevel, RiskFactor } from './types/risk';
import { RiskBreakdown } from './RiskBreakdown';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RiskDialProps {
  riskScore: number; // 0-1 scale
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  isLive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeMap = {
  sm: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-xl' },
  md: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  lg: { width: 200, height: 200, strokeWidth: 12, fontSize: 'text-4xl' }
};

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'low': return 'hsl(var(--success))';
    case 'medium': return 'hsl(var(--warning))';
    case 'high': return 'hsl(var(--destructive-muted))';
    case 'critical': return 'hsl(var(--destructive))';
  }
};

export const RiskDial = ({ 
  riskScore, 
  riskLevel, 
  factors, 
  isLive = false,
  size = 'md',
  showLabel = true
}: RiskDialProps) => {
  const [open, setOpen] = useState(false);
  const { width, height, strokeWidth, fontSize } = sizeMap[size];
  const radius = (width - strokeWidth * 2) / 2;
  const circumference = radius * Math.PI; // 180° arc
  const offset = circumference - (riskScore * circumference);
  const color = getRiskColor(riskLevel);

  const dialVariants = {
    idle: { scale: 1 },
    pulse: { 
      scale: [1, 1.08, 1],
      transition: { repeat: Infinity, duration: 1.5 }
    },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <motion.button
            variants={dialVariants}
            initial="idle"
            animate={riskLevel === 'critical' ? 'pulse' : 'idle'}
            whileHover="hover"
            className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            aria-label={`Risk level: ${riskLevel} at ${Math.round(riskScore * 100)}%`}
          >
            <svg width={width} height={height} className="transform -rotate-90">
              {/* Background arc */}
              <path
                d={`M ${strokeWidth} ${height / 2} A ${radius} ${radius} 0 0 1 ${width - strokeWidth} ${height / 2}`}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              
              {/* Progress arc */}
              <motion.path
                d={`M ${strokeWidth} ${height / 2} A ${radius} ${radius} 0 0 1 ${width - strokeWidth} ${height / 2}`}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className={`${fontSize} font-bold`}
                style={{ color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {Math.round(riskScore * 100)}%
              </motion.span>
              {isLive && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live
                </motion.div>
              )}
            </div>
          </motion.button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96" align="center">
          <RiskBreakdown
            riskScore={riskScore}
            riskLevel={riskLevel}
            factors={factors}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>

      {showLabel && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {riskLevel === 'low' && <TrendingDown className="w-4 h-4 text-success" />}
            {(riskLevel === 'high' || riskLevel === 'critical') && <TrendingUp className="w-4 h-4 text-destructive" />}
            {riskLevel === 'medium' && <AlertTriangle className="w-4 h-4 text-warning" />}
            <span className="text-sm font-medium capitalize">{riskLevel} Risk</span>
          </div>
        </div>
      )}
    </div>
  );
};
