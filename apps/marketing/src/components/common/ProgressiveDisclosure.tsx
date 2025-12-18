import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressiveDisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  level?: 'basic' | 'advanced' | 'expert';
  className?: string;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  title,
  children,
  defaultOpen = false,
  level = 'basic',
  className
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const levelColors = {
    basic: 'border-l-blue-500 bg-blue-50/50',
    advanced: 'border-l-orange-500 bg-orange-50/50',
    expert: 'border-l-red-500 bg-red-50/50'
  };

  const levelLabels = {
    basic: 'Basic',
    advanced: 'Advanced',
    expert: 'Expert'
  };

  return (
    <div className={cn('border-l-4 rounded-lg p-4', levelColors[level], className)}>
      <Button
        variant="ghost"
        className="w-full justify-between p-0 h-auto font-medium text-left hover:bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <span>{title}</span>
          <span className="text-xs px-2 py-1 bg-background rounded-full border">
            {levelLabels[level]}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};