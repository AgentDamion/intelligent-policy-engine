import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MetricCardProps } from '@/types/live-proof';

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  color = 'primary', 
  animate = false 
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(animate ? 0 : value);
  
  useEffect(() => {
    if (animate && typeof value === 'number') {
      const duration = 1000;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animate]);

  const colorClasses = {
    primary: 'border-l-blue-500 bg-white border border-gray-100',
    success: 'border-l-green-500 bg-white border border-gray-100',
    secondary: 'border-l-purple-500 bg-white border border-gray-100',
    accent: 'border-l-indigo-500 bg-white border border-gray-100'
  };

  return (
    <motion.div 
      className={`p-3 sm:p-4 rounded-lg border-l-4 min-w-0 ${colorClasses[color]} shadow-sm`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {displayValue}
      </div>
      <div className="text-xs sm:text-sm text-gray-600 font-medium">
        {label}
      </div>
    </motion.div>
  );
};

export default MetricCard;