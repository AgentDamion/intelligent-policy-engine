import { getAllManagedRoutes } from '@/config/routes.config';
import { monitoring } from '@/utils/monitoring';

export interface RouteValidationResult {
  route: string;
  status: 'valid' | 'invalid' | 'missing-component' | 'protection-error';
  message?: string;
  error?: Error;
  responseTime?: number;
  statusCode?: number;
  componentFound?: boolean;
  protectionLevel?: string;
}

export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  missingComponents: number;
  protectionErrors: number;
  results: RouteValidationResult[];
}

class RouteValidator {
  private baseUrl: string;

  constructor(baseUrl: string = window.location.origin) {
    this.baseUrl = baseUrl;
  }

  async validateRoute(route: string, options: {
    timeout?: number;
    checkProtection?: boolean;
    testAuth?: boolean;
  } = {}): Promise<RouteValidationResult> {
    const { timeout = 5000, checkProtection = true, testAuth = false } = options;
    const startTime = performance.now();

    try {
      // Test basic route accessibility
      const response = await fetch(`${this.baseUrl}${route}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(timeout)
      });

      const responseTime = performance.now() - startTime;
      const statusCode = response.status;

      // Check if route is accessible
      if (statusCode >= 400) {
        return {
          route,
          status: 'invalid',
          message: `HTTP ${statusCode} error`,
          responseTime,
          statusCode
        };
      }

      // If auth testing is enabled, test with/without auth
      if (testAuth && checkProtection) {
        const authResult = await this.testRouteProtection(route);
        if (!authResult.valid) {
          return {
            route,
            status: 'protection-error',
            message: authResult.message,
            responseTime,
            statusCode,
            protectionLevel: authResult.protectionLevel
          };
        }
      }

      return {
        route,
        status: 'valid',
        message: 'Route accessible',
        responseTime,
        statusCode,
        componentFound: true
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        route,
        status: 'invalid',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error(String(error)),
        responseTime
      };
    }
  }

  private async testRouteProtection(route: string): Promise<{
    valid: boolean;
    message?: string;
    protectionLevel?: string;
  }> {
    try {
      // Test route without authentication
      const unauthedResponse = await fetch(`${this.baseUrl}${route}`, {
        method: 'HEAD',
        credentials: 'omit'
      });

      // Protected routes should redirect or return 401/403
      if (route.startsWith('/dashboard') || route.startsWith('/agency/') || route.startsWith('/admin')) {
        if (unauthedResponse.status === 200) {
          return {
            valid: false,
            message: 'Protected route accessible without authentication',
            protectionLevel: 'protected'
          };
        }
      }

      return { valid: true, protectionLevel: 'appropriate' };
    } catch (error) {
      return {
        valid: false,
        message: `Protection test failed: ${error}`,
        protectionLevel: 'unknown'
      };
    }
  }

  async validateAllRoutes(options: {
    parallel?: boolean;
    batchSize?: number;
    progressCallback?: (completed: number, total: number) => void;
  } = {}): Promise<ValidationSummary> {
    const { parallel = true, batchSize = 5, progressCallback } = options;
    const routes = getAllManagedRoutes().map(r => r.path);
    const results: RouteValidationResult[] = [];

    if (parallel) {
      // Process routes in batches for better performance
      for (let i = 0; i < routes.length; i += batchSize) {
        const batch = routes.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(route => this.validateRoute(route))
        );
        results.push(...batchResults);
        
        if (progressCallback) {
          progressCallback(Math.min(i + batchSize, routes.length), routes.length);
        }
      }
    } else {
      // Process routes sequentially
      for (let i = 0; i < routes.length; i++) {
        const result = await this.validateRoute(routes[i]);
        results.push(result);
        
        if (progressCallback) {
          progressCallback(i + 1, routes.length);
        }
      }
    }

    // Generate summary
    const summary: ValidationSummary = {
      total: results.length,
      valid: results.filter(r => r.status === 'valid').length,
      invalid: results.filter(r => r.status === 'invalid').length,
      missingComponents: results.filter(r => r.status === 'missing-component').length,
      protectionErrors: results.filter(r => r.status === 'protection-error').length,
      results
    };

    // Log results for monitoring
    monitoring.logEvent('route_validation_completed', {
      summary,
      timestamp: new Date().toISOString()
    });

    return summary;
  }

  async testCriticalUserFlows(): Promise<{
    flows: Array<{
      name: string;
      routes: string[];
      status: 'passed' | 'failed';
      failedStep?: string;
      message?: string;
    }>;
  }> {
    const flows = [
      {
        name: 'Enterprise Onboarding',
        routes: ['/', '/auth', '/dashboard', '/policies']
      },
      {
        name: 'Agency Workflow',
        routes: ['/', '/auth', '/agency/dashboard', '/agency/my-tools']
      },
      {
        name: 'Invitation Flow',
        routes: ['/invite/test-token', '/submission', '/submission-confirmation']
      },
      {
        name: 'Public Navigation',
        routes: ['/', '/platform', '/pricing', '/contact']
      }
    ];

    const results = [];

    for (const flow of flows) {
      let status: 'passed' | 'failed' = 'passed';
      let failedStep: string | undefined;
      let message: string | undefined;

      for (const route of flow.routes) {
        const result = await this.validateRoute(route, { checkProtection: false });
        if (result.status !== 'valid') {
          status = 'failed';
          failedStep = route;
          message = result.message;
          break;
        }
      }

      results.push({
        name: flow.name,
        routes: flow.routes,
        status,
        failedStep,
        message
      });
    }

    return { flows: results };
  }
}

export const routeValidator = new RouteValidator();

// Export validation functions
export const validateRoute = (route: string, options?: Parameters<RouteValidator['validateRoute']>[1]) =>
  routeValidator.validateRoute(route, options);

export const validateAllRoutes = (options?: Parameters<RouteValidator['validateAllRoutes']>[0]) =>
  routeValidator.validateAllRoutes(options);

export const testCriticalUserFlows = () =>
  routeValidator.testCriticalUserFlows();