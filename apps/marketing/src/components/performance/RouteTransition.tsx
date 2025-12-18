import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { monitoring } from '@/utils/monitoring';

interface RouteTransitionProps {
  children: React.ReactNode;
  showProgress?: boolean;
  enableTransitions?: boolean;
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({
  children,
  showProgress = true,
  enableTransitions = true
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Start loading state on route change
    setIsLoading(true);
    setProgress(0);
    setLoadingStartTime(Date.now());

    // Simulate progressive loading
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    // Complete loading after a short delay to allow for component mounting
    const loadingTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        
        // Log performance data
        if (loadingStartTime) {
          const loadTime = Date.now() - loadingStartTime;
          
          // Store in session storage for monitoring
          const performanceData = JSON.parse(sessionStorage.getItem('routePerformance') || '[]');
          performanceData.push({
            route: location.pathname,
            loadTime,
            timestamp: Date.now(),
            strategy: 'route-transition'
          });
          
          const recentPerformance = performanceData.slice(-50);
          sessionStorage.setItem('routePerformance', JSON.stringify(recentPerformance));
          
          if (import.meta.env.DEV) {
            monitoring.debug(`Route transition: ${location.pathname} loaded in ${loadTime}ms`);
          }
        }
      }, 300);
    }, 200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(loadingTimer);
    };
  }, [location.pathname]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.3
  };

  return (
    <>
      {/* Progress Bar */}
      {showProgress && isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress 
            value={progress} 
            className="h-1 rounded-none border-none"
          />
        </div>
      )}
      
      {/* Loading Overlay */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading page...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content with Transitions */}
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key={location.pathname}
            initial={enableTransitions ? "initial" : undefined}
            animate={enableTransitions ? "in" : undefined}
            exit={enableTransitions ? "out" : undefined}
            variants={enableTransitions ? pageVariants : undefined}
            transition={enableTransitions ? pageTransition : undefined}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};