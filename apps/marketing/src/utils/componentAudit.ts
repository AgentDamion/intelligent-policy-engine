import { getAllManagedRoutes } from '@/config/routes.config';
import registry from '@/appRegistry';

export interface ComponentAuditResult {
  route: string;
  hasComponent: boolean;
  componentPath?: string;
  implementation: 'complete' | 'partial' | 'missing' | 'placeholder';
  issues: string[];
  suggestions: string[];
}

export interface ComponentAuditSummary {
  total: number;
  complete: number;
  partial: number;
  missing: number;
  placeholder: number;
  results: ComponentAuditResult[];
  missingComponents: string[];
  placeholderComponents: string[];
}

class ComponentAuditor {
  private knownPlaceholders = [
    'PlaceholderPage',
    'ComingSoon', 
    'NotImplemented',
    'UnderConstruction'
  ];

  private criticalRoutes = [
    '/',
    '/dashboard',
    '/agency/dashboard',
    '/auth',
    '/policies',
    '/platform'
  ];

  async auditRoute(route: string): Promise<ComponentAuditResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check if route exists in registry
    const registryPage = registry.pages.find(p => p.route === route);
    
    if (!registryPage) {
      return {
        route,
        hasComponent: false,
        implementation: 'missing',
        issues: ['Route not found in app registry'],
        suggestions: ['Add route to app registry', 'Create component implementation']
      };
    }

    // Check component implementation status
    let implementation: ComponentAuditResult['implementation'] = 'missing';
    
    if (registryPage.status === 'YES') {
      implementation = 'complete';
    } else if (registryPage.status === 'PART') {
      implementation = 'partial';
      issues.push('Component is partially implemented');
      suggestions.push('Complete remaining functionality');
    } else if (registryPage.status === 'NO') {
      implementation = 'missing';
      issues.push('Component not implemented');
      suggestions.push('Create component implementation');
    }

    // Check if component is a known placeholder
    if (this.knownPlaceholders.some(placeholder => 
      registryPage.component?.includes(placeholder)
    )) {
      implementation = 'placeholder';
      issues.push('Using placeholder component');
      suggestions.push('Replace with actual implementation');
    }

    // Check critical route status
    if (this.criticalRoutes.includes(route) && implementation !== 'complete') {
      issues.push('Critical route is not fully implemented');
      suggestions.push('Prioritize implementation for critical user journey');
    }

    // Check data wiring
    if (!registryPage.dataWired && implementation === 'complete') {
      issues.push('Component lacks proper data integration');
      suggestions.push('Wire up data fetching and state management');
    }

    return {
      route,
      hasComponent: registryPage.component ? true : false,
      componentPath: registryPage.component,
      implementation,
      issues,
      suggestions
    };
  }

  async auditAllComponents(): Promise<ComponentAuditSummary> {
    const routes = getAllManagedRoutes().map(r => r.path);
    const results: ComponentAuditResult[] = [];
    
    for (const route of routes) {
      const result = await this.auditRoute(route);
      results.push(result);
    }

    // Generate summary
    const summary: ComponentAuditSummary = {
      total: results.length,
      complete: results.filter(r => r.implementation === 'complete').length,
      partial: results.filter(r => r.implementation === 'partial').length,
      missing: results.filter(r => r.implementation === 'missing').length,
      placeholder: results.filter(r => r.implementation === 'placeholder').length,
      results,
      missingComponents: results
        .filter(r => r.implementation === 'missing')
        .map(r => r.route),
      placeholderComponents: results
        .filter(r => r.implementation === 'placeholder')
        .map(r => r.route)
    };

    return summary;
  }

  generateImplementationPlan(summary: ComponentAuditSummary): {
    phases: Array<{
      name: string;
      priority: 'high' | 'medium' | 'low';
      routes: string[];
      estimatedEffort: string;
      description: string;
    }>;
  } {
    const criticalMissing = summary.results.filter(r => 
      this.criticalRoutes.includes(r.route) && 
      r.implementation !== 'complete'
    );

    const placeholderReplacements = summary.results.filter(r => 
      r.implementation === 'placeholder'
    );

    const partialCompletions = summary.results.filter(r => 
      r.implementation === 'partial'
    );

    const remainingMissing = summary.results.filter(r => 
      r.implementation === 'missing' && 
      !this.criticalRoutes.includes(r.route)
    );

    return {
      phases: [
        {
          name: 'Critical Route Implementation',
          priority: 'high' as const,
          routes: criticalMissing.map(r => r.route),
          estimatedEffort: '1-2 weeks',
          description: 'Implement missing critical routes for core user journeys'
        },
        {
          name: 'Placeholder Replacement',
          priority: 'medium' as const,
          routes: placeholderReplacements.map(r => r.route),
          estimatedEffort: '1-2 weeks',
          description: 'Replace placeholder components with proper implementations'
        },
        {
          name: 'Partial Component Completion',
          priority: 'medium' as const,
          routes: partialCompletions.map(r => r.route),
          estimatedEffort: '2-3 weeks',
          description: 'Complete partially implemented components'
        },
        {
          name: 'Remaining Route Implementation',
          priority: 'low' as const,
          routes: remainingMissing.map(r => r.route),
          estimatedEffort: '3-4 weeks',
          description: 'Implement remaining missing routes'
        }
      ].filter(phase => phase.routes.length > 0)
    };
  }
}

export const componentAuditor = new ComponentAuditor();

// Export convenience functions
export const auditRoute = (route: string) => componentAuditor.auditRoute(route);
export const auditAllComponents = () => componentAuditor.auditAllComponents();
export const generateImplementationPlan = (summary: ComponentAuditSummary) => 
  componentAuditor.generateImplementationPlan(summary);