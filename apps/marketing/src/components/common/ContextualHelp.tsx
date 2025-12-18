import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpItem {
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'info';
  keyboardShortcut?: string;
}

interface ContextualHelpProps {
  helpItems: HelpItem[];
  trigger?: 'hover' | 'click';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  helpItems,
  trigger = 'hover',
  placement = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getBadgeVariant = (type: HelpItem['type']) => {
    switch (type) {
      case 'tip': return 'default';
      case 'warning': return 'destructive';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  const placementClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleMouseEvents = trigger === 'hover' ? {
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => setIsVisible(false)
  } : {};

  return (
    <div className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        onClick={handleTrigger}
        {...handleMouseEvents}
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-80 ${placementClasses[placement]}`}
          >
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Quick Help</CardTitle>
                  {trigger === 'click' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsVisible(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {helpItems.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={getBadgeVariant(item.type)} className="text-xs">
                        {item.type.toUpperCase()}
                      </Badge>
                      {item.keyboardShortcut && (
                        <kbd className="px-2 py-1 text-xs bg-muted rounded border">
                          {item.keyboardShortcut}
                        </kbd>
                      )}
                    </div>
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};