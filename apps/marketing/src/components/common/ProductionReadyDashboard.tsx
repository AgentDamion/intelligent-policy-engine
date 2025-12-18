import React, { Suspense } from 'react';
import DashboardErrorBoundary from '@/components/common/DashboardErrorBoundary';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import HealthIndicator from '@/components/common/HealthIndicator';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useProductionHealth } from '@/hooks/useProductionHealth';
import { monitoring } from '@/utils/monitoring';
import { supabase } from '@/integrations/supabase/client';

interface ProductionReadyDashboardProps {
  children: React.ReactNode;
  dashboardType: 'enterprise' | 'agency';
  enableRealtime?: boolean;
  showHealthIndicator?: boolean;
}

export const ProductionReadyDashboard: React.FC<ProductionReadyDashboardProps> = ({
  children,
  dashboardType,
  enableRealtime = true,
  showHealthIndicator = true
}) => {
  const { isHealthy } = useProductionHealth();

  // Track dashboard load performance
  React.useEffect(() => {
    const startTime = performance.now();
    
    const trackLoadTime = () => {
      const loadTime = Math.round(performance.now() - startTime);
      
      // Log to monitoring
      monitoring.info(`Dashboard loaded: ${dashboardType}`, {
        loadTimeMs: loadTime,
        userAgent: navigator.userAgent
      }, 'dashboard');

      // Log to database for analytics (async without waiting)
      supabase.rpc('log_dashboard_performance', {
        dashboard_type: dashboardType,
        load_time_ms: loadTime,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
      
      monitoring.debug('Dashboard performance tracked', { loadTime }, 'dashboard');
    };

    // Track when dashboard is fully loaded
    if (document.readyState === 'complete') {
      trackLoadTime();
    } else {
      window.addEventListener('load', trackLoadTime);
      return () => window.removeEventListener('load', trackLoadTime);
    }
  }, [dashboardType]);

  // Enable real-time updates for key tables
  useRealtimeSubscription({
    table: 'ai_agent_decisions',
    enabled: enableRealtime,
    onData: (payload) => {
      monitoring.info('Real-time AI decision update', {
        eventType: payload.eventType,
        recordId: payload.new?.id || payload.old?.id
      }, 'realtime');
    },
    onError: (error) => {
      monitoring.error('Real-time subscription error', error, 'realtime');
    }
  });

  useRealtimeSubscription({
    table: 'agent_activities',
    enabled: enableRealtime,
    onData: (payload) => {
      monitoring.info('Real-time agent activity update', {
        eventType: payload.eventType,
        agent: payload.new?.agent || payload.old?.agent
      }, 'realtime');
    }
  });

  if (dashboardType === 'agency') {
    useRealtimeSubscription({
      table: 'approval_workflows',
      enabled: enableRealtime,
      onData: (payload) => {
        monitoring.info('Real-time workflow update', {
          eventType: payload.eventType,
          workflowName: payload.new?.workflow_name || payload.old?.workflow_name
        }, 'realtime');
      }
    });
  }

  return (
    <DashboardErrorBoundary dashboardType={dashboardType}>
      <Suspense fallback={<DashboardSkeleton type={dashboardType} />}>
        <div className="relative min-h-screen">
          {children}
          {showHealthIndicator && <HealthIndicator position="top-right" />}
        </div>
      </Suspense>
    </DashboardErrorBoundary>
  );
};

export default ProductionReadyDashboard;