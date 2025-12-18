import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Target, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'none';
  highlightPadding?: number;
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  storageKey?: string;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  storageKey = 'guided-tour-completed'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; actualPosition: string }>({
    top: 0,
    left: 0,
    actualPosition: 'bottom'
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Enhanced position calculation with viewport boundary detection
  const calculateOptimalPosition = (rect: DOMRect, preferredPosition: string) => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return { top: 0, left: 0, actualPosition: 'bottom' };

    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Responsive tooltip width for mobile
    const tooltipWidth = isMobile ? Math.min(tooltipRect.width, viewport.width - 32) : tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Calculate available space in each direction
    const spaceAbove = rect.top;
    const spaceBelow = viewport.height - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewport.width - rect.right;

    // Determine the best position based on available space
    const positions = [
      {
        name: 'top',
        available: spaceAbove >= tooltipHeight + padding,
        top: rect.top - tooltipHeight - padding,
        left: Math.max(padding, Math.min(
          rect.left + (rect.width - tooltipWidth) / 2,
          viewport.width - tooltipWidth - padding
        ))
      },
      {
        name: 'bottom',
        available: spaceBelow >= tooltipHeight + padding,
        top: rect.bottom + padding,
        left: Math.max(padding, Math.min(
          rect.left + (rect.width - tooltipWidth) / 2,
          viewport.width - tooltipWidth - padding
        ))
      },
      {
        name: 'left',
        available: spaceLeft >= tooltipWidth + padding,
        top: Math.max(padding, Math.min(
          rect.top + (rect.height - tooltipHeight) / 2,
          viewport.height - tooltipHeight - padding
        )),
        left: rect.left - tooltipWidth - padding
      },
      {
        name: 'right',
        available: spaceRight >= tooltipWidth + padding,
        top: Math.max(padding, Math.min(
          rect.top + (rect.height - tooltipHeight) / 2,
          viewport.height - tooltipHeight - padding
        )),
        left: rect.right + padding
      }
    ];

    // Try preferred position first if it has space
    const preferredPos = positions.find(pos => pos.name === preferredPosition);
    if (preferredPos?.available) {
      return {
        top: preferredPos.top,
        left: preferredPos.left,
        actualPosition: preferredPos.name
      };
    }

    // Find the position with the most space
    const bestPosition = positions
      .filter(pos => pos.available)
      .sort((a, b) => {
        if (a.name === 'top' || a.name === 'bottom') return spaceBelow + spaceAbove;
        return spaceLeft + spaceRight;
      })[0];

    if (bestPosition) {
      return {
        top: bestPosition.top,
        left: bestPosition.left,
        actualPosition: bestPosition.name
      };
    }

    // Fallback: center on screen if no position works
    return {
      top: Math.max(padding, (viewport.height - tooltipHeight) / 2),
      left: Math.max(padding, (viewport.width - tooltipWidth) / 2),
      actualPosition: 'center'
    };
  };

  // Use layoutEffect for synchronous DOM measurements with enhanced positioning
  useLayoutEffect(() => {
    if (isActive && currentStep < steps.length && tooltipRef.current) {
      const step = steps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        // Enhanced positioning with scroll delay for mid-page elements
        const positionTooltip = () => {
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);
          
          // Calculate optimal position after tooltip is rendered
          const position = calculateOptimalPosition(rect, step.position);
          
          // Validate position is within viewport bounds
          const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
          };
          
          const finalTop = Math.max(10, Math.min(position.top, viewport.height - 200));
          const finalLeft = Math.max(10, Math.min(position.left, viewport.width - 320));
          
          setTooltipPosition({
            ...position,
            top: finalTop,
            left: finalLeft
          });
          setOverlayVisible(true);
        };

        // Scroll element into view first
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
        
        // Add delay for better scroll settling, especially for mid-page elements
        setTimeout(positionTooltip, 300);
      }
    } else {
      setOverlayVisible(false);
    }
  }, [currentStep, steps, isActive, isMobile]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setOverlayVisible(false);
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    onComplete();
  };

  const skipTour = () => {
    setOverlayVisible(false);
    if (storageKey) {
      localStorage.setItem(storageKey, 'skipped');
    }
    onSkip();
  };

  if (!isActive || !overlayVisible || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Overlay with highlight cutout */}
        <div className="absolute inset-0 bg-black/50">
          {highlightRect && (
            <div
              className="absolute bg-transparent border-2 border-primary rounded-lg pointer-events-auto"
              style={{
                top: highlightRect.top - (step.highlightPadding || 4),
                left: highlightRect.left - (step.highlightPadding || 4),
                width: highlightRect.width + (step.highlightPadding || 4) * 2,
                height: highlightRect.height + (step.highlightPadding || 4) * 2,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`
              }}
            />
          )}
        </div>

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute pointer-events-auto z-50"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : '320px'
          }}
        >
          <Card className="shadow-xl border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="text-xs">
                      {currentStep + 1} of {steps.length}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={skipTour}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <CardTitle className="text-base flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span>{step.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{step.description}</p>
              
              {step.action && step.action !== 'none' && (
                <div className="p-2 bg-blue-50 rounded border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Try it:</strong> {step.action === 'click' ? 'Click' : 'Hover over'} the highlighted element
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Back</span>
                </Button>

                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={skipTour}>
                    Skip Tour
                  </Button>
                  <Button size="sm" onClick={nextStep} className="flex items-center space-x-1">
                    <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};