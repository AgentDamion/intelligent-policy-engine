import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, DollarSign, Clock, ShieldCheck, Users, Target } from 'lucide-react';

interface StatData {
  id: string;
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  icon: React.ComponentType<any>;
  description?: string;
  trend?: number;
  color?: string;
}

const defaultStats: StatData[] = [
  {
    id: 'savings',
    value: 50,
    suffix: 'B',
    prefix: '$',
    label: 'Industry Challenge',
    icon: DollarSign,
    description: 'Annual costs from AI compliance delays',
    color: 'hsl(var(--destructive))'
  },
  {
    id: 'faster',
    value: 73,
    suffix: '%',
    label: 'Faster Approvals',
    icon: Clock,
    description: 'Reduction in compliance review time',
    trend: 15,
    color: 'hsl(var(--success))'
  },
  {
    id: 'success',
    value: 90,
    suffix: '%',
    label: 'Audit Success Rate',
    icon: ShieldCheck,
    description: 'FDA compliance validation rate',
    color: 'hsl(var(--primary))'
  },
  {
    id: 'companies',
    value: 150,
    suffix: '+',
    label: 'Fortune 500 Companies',
    icon: Users,
    description: 'Trust aicomply.io for governance',
    color: 'hsl(var(--secondary))'
  }
];

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  target, 
  duration = 2000, 
  prefix = '', 
  suffix = '' 
}) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOut * target);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration, isInView]);

  return (
    <span ref={ref} className="font-black">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

interface AnimatedStatsCounterProps {
  stats?: StatData[];
  layout?: 'grid' | 'row' | 'compact';
  showTrends?: boolean;
  autoStart?: boolean;
  staggerDelay?: number;
}

const AnimatedStatsCounter: React.FC<AnimatedStatsCounterProps> = ({
  stats = defaultStats,
  layout = 'grid',
  showTrends = true,
  autoStart = true,
  staggerDelay = 0.2
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    row: 'flex flex-wrap justify-center gap-8',
    compact: 'flex flex-col md:flex-row gap-4'
  };

  const cardClasses = {
    grid: 'text-center p-6',
    row: 'text-center p-4 min-w-[200px]',
    compact: 'flex items-center gap-4 p-4'
  };

  return (
    <div ref={ref} className={layoutClasses[layout]}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <motion.div
            key={stat.id}
            className={`bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow ${cardClasses[layout]}`}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ 
              duration: 0.6, 
              delay: autoStart ? index * staggerDelay : 0,
              ease: "easeOut"
            }}
          >
            {layout === 'compact' ? (
              <>
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <IconComponent 
                    className="w-6 h-6" 
                    style={{ color: stat.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-black text-foreground">
                    <AnimatedCounter
                      target={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  {stat.description && (
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      {stat.description}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div 
                    className="p-4 rounded-full"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <IconComponent 
                      className="w-8 h-8" 
                      style={{ color: stat.color }}
                    />
                  </div>
                </div>
                
                <div className="text-4xl md:text-5xl font-black text-foreground mb-2">
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </div>
                
                <div className="text-lg text-muted-foreground font-medium mb-2">
                  {stat.label}
                </div>
                
                {stat.description && (
                  <div className="text-sm text-muted-foreground/70">
                    {stat.description}
                  </div>
                )}
                
                {showTrends && stat.trend && (
                  <motion.div
                    className="flex items-center justify-center gap-1 mt-3 text-success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * staggerDelay + 1 }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">+{stat.trend}% this month</span>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default AnimatedStatsCounter;