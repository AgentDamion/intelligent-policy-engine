import { useState, useEffect } from 'react';
import { runProductionChecks, displayProductionReport, type ProductionCheck } from '@/utils/productionCheck';
import { monitoring } from '@/utils/monitoring';

interface ProductionHealthStatus {
  isHealthy: boolean;
  criticalIssues: number;
  warnings: number;
  lastChecked: Date;
  checks: ProductionCheck[];
  isChecking: boolean;
}

export const useProductionHealth = (autoCheck: boolean = true) => {
  const [health, setHealth] = useState<ProductionHealthStatus>({
    isHealthy: false,
    criticalIssues: 0,
    warnings: 0,
    lastChecked: new Date(),
    checks: [],
    isChecking: true
  });

  const runHealthCheck = async () => {
    setHealth(prev => ({ ...prev, isChecking: true }));
    
    try {
      const checks = await runProductionChecks();
      const report = await displayProductionReport();
      
      const newHealth: ProductionHealthStatus = {
        isHealthy: report.ready,
        criticalIssues: report.critical,
        warnings: report.warnings,
        lastChecked: new Date(),
        checks,
        isChecking: false
      };

      setHealth(newHealth);

      // Log health status
      if (!newHealth.isHealthy) {
        monitoring.warn('Production health check failed', {
          criticalIssues: newHealth.criticalIssues,
          warnings: newHealth.warnings,
          failedChecks: checks.filter(c => c.status === 'fail').map(c => c.name)
        }, 'health-check');
      } else {
        monitoring.info('Production health check passed', {
          totalChecks: checks.length,
          warnings: newHealth.warnings
        }, 'health-check');
      }

      return newHealth;
    } catch (error) {
      monitoring.error('Health check failed', error, 'health-check');
      setHealth(prev => ({ 
        ...prev, 
        isChecking: false,
        isHealthy: false,
        lastChecked: new Date()
      }));
      throw error;
    }
  };

  useEffect(() => {
    if (autoCheck) {
      runHealthCheck();
      
      // Check health every 5 minutes in production
      const interval = setInterval(runHealthCheck, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoCheck]);

  return {
    health,
    runHealthCheck,
    isHealthy: health.isHealthy,
    hasCriticalIssues: health.criticalIssues > 0,
    hasWarnings: health.warnings > 0,
    isChecking: health.isChecking
  };
};

export default useProductionHealth;