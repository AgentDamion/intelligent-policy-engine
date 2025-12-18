import React from 'react';
import { motion } from 'framer-motion';

interface GeometricBackgroundProps {
  variant?: 'subtle' | 'prominent';
  className?: string;
}

const GeometricBackground: React.FC<GeometricBackgroundProps> = ({ 
  variant = 'subtle', 
  className = '' 
}) => {
  const isProminent = variant === 'prominent';

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Refined floating shapes - much more subtle */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 opacity-5"
        animate={{
          rotate: [0, 15, 0],
          scale: [1, 1.05, 1],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-teal-500/10 to-transparent"
             style={{ 
               clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
               filter: 'blur(1px)'
             }} />
      </motion.div>

      <motion.div
        className="absolute top-1/3 right-1/4 w-24 h-24 opacity-8"
        animate={{
          rotate: [45, 60, 45],
          scale: [1, 1.1, 1],
          x: [0, 5, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-coral-400/8 to-transparent"
             style={{ 
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
               filter: 'blur(0.5px)'
             }} />
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 left-10 w-16 h-16 opacity-6"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.08, 1],
          y: [0, -8, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
          delay: 10
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-teal-400/6 to-transparent transform rotate-45"
             style={{ filter: 'blur(0.8px)' }} />
      </motion.div>

      {/* Subtle geometric accents - premium minimalism */}
      <div className={`absolute inset-0 ${isProminent ? 'opacity-5' : 'opacity-3'} backdrop-blur-sm`}>
        <div className="geometric-accent top-20 left-10" style={{ animationDelay: '0s' }} />
        <div className="geometric-accent top-40 right-20" style={{ animationDelay: '7s' }} />
        <div className="geometric-accent bottom-32 left-1/4" style={{ animationDelay: '14s' }} />
      </div>
    </div>
  );
};

export default GeometricBackground;