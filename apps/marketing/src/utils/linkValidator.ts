import { routes } from '@/lib/routes';
import { getAllManagedRoutes } from '@/config/routes.config';

// ============================================
// Link Validator - Component-level link scanning
// ============================================

export interface LinkReference {
  file: string;
  line: number;
  linkType: 'Link' | 'navigate' | 'href' | 'NavLink';
  path: string;
  isStatic: boolean;
  isDynamic: boolean;
}

export interface LinkValidationResult {
  path: string;
  status: 'working' | 'temporary' | 'broken' | 'orphaned';
  references: LinkReference[];
  routeExists: boolean;
  componentImplemented?: boolean;
  implementationNotes?: string;
}

export interface LinkInventoryReport {
  timestamp: string;
  summary: {
    totalLinks: number;
    workingLinks: number;
    temporaryLinks: number;
    brokenLinks: number;
    orphanedRoutes: number;
  };
  bySection: {
    enterprise: LinkValidationResult[];
    agency: LinkValidationResult[];
    vendor: LinkValidationResult[];
    public: LinkValidationResult[];
    governance: LinkValidationResult[];
  };
  criticalIssues: LinkValidationResult[];
  allResults: LinkValidationResult[];
}

class LinkValidator {
  private definedRoutes: Set<string>;
  private routeRegistry: Map<string, any>;

  constructor() {
    this.definedRoutes = new Set();
    this.routeRegistry = new Map();
    this.buildRouteRegistry();
  }

  /**
   * Build complete registry of all defined routes
   */
  private buildRouteRegistry() {
    const flattenRoutes = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('/')) {
          this.definedRoutes.add(value);
          this.routeRegistry.set(value, { key, source: 'routes.ts' });
        } else if (typeof value === 'function') {
          // Handle specific dynamic route functions
          if (key === 'policyStudio') {
            this.definedRoutes.add('/policies/new');
            this.definedRoutes.add('/policies/:id');
            this.routeRegistry.set('/policies/new', { key: 'policyStudio', source: 'routes.ts', component: 'implemented' });
            this.routeRegistry.set('/policies/:id', { key: 'policyStudio', source: 'routes.ts', component: 'implemented', dynamic: true });
          } else if (key === 'partnerProfile') {
            this.definedRoutes.add('/partners/:id');
            this.routeRegistry.set('/partners/:id', { key: 'partnerProfile', source: 'routes.ts', component: 'implemented', dynamic: true });
          } else if (key === 'toolDetails') {
            this.definedRoutes.add('/marketplace/tools/:id');
            this.routeRegistry.set('/marketplace/tools/:id', { key: 'toolDetails', source: 'routes.ts', component: 'implemented', dynamic: true });
          } else if (key === 'submission') {
            this.definedRoutes.add('/submissions/:id');
            this.routeRegistry.set('/submissions/:id', { key: 'submission', source: 'routes.ts', component: 'implemented', dynamic: true });
          } else if (key === 'decision') {
            this.definedRoutes.add('/decisions/:id');
            this.routeRegistry.set('/decisions/:id', { key: 'decision', source: 'routes.ts', component: 'implemented', dynamic: true });
          } else {
            // Generic dynamic route - add placeholder
            const placeholder = prefix ? `${prefix}/:id` : '/:id';
            this.definedRoutes.add(placeholder);
            this.routeRegistry.set(placeholder, { key, source: 'routes.ts', dynamic: true });
          }
        } else if (typeof value === 'object' && value !== null) {
          flattenRoutes(value, prefix);
        }
      }
    };

    flattenRoutes(routes);

    // Add routes from route config
    try {
      const managedRoutes = getAllManagedRoutes();
      managedRoutes.forEach(route => {
        this.definedRoutes.add(route.path);
        this.routeRegistry.set(route.path, {
          key: route.title || route.path,
          source: 'routes.config.ts',
          component: 'implemented' // Assume implemented if in config
        });
      });
    } catch (error) {
      console.warn('Could not load managed routes:', error);
    }
  }

  /**
   * Check if a path matches any defined route (including dynamic routes)
   */
  private matchesDefinedRoute(path: string): boolean {
    // Exact match
    if (this.definedRoutes.has(path)) return true;

    // Dynamic route matching (e.g., /partners/:id matches /partners/123)
    for (const definedRoute of this.definedRoutes) {
      if (definedRoute.includes(':')) {
        const pattern = definedRoute.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(path)) return true;
      }
    }

    return false;
  }

  /**
   * Validate a single link reference
   */
  validateLink(path: string, references: LinkReference[]): LinkValidationResult {
    const routeExists = this.matchesDefinedRoute(path);
    const routeInfo = this.routeRegistry.get(path);
    
    let status: 'working' | 'temporary' | 'broken' | 'orphaned' = 'broken';
    let componentImplemented = false;
    let implementationNotes: string | undefined;

    if (routeExists) {
      if (routeInfo?.component === 'implemented') {
        status = 'working';
        componentImplemented = true;
      } else if (routeInfo?.component === 'missing') {
        status = 'temporary';
        componentImplemented = false;
        implementationNotes = 'Route defined but component not implemented';
      } else if (path.startsWith('/governance/') && path !== '/governance/inbox') {
        status = 'temporary';
        implementationNotes = 'Governance tab - redirects to inbox (temporary)';
      } else {
        status = 'working';
        componentImplemented = true;
      }
    } else {
      status = 'broken';
      implementationNotes = 'Route not defined in routes.ts';
    }

    return {
      path,
      status,
      references,
      routeExists,
      componentImplemented,
      implementationNotes,
    };
  }

  /**
   * Scan code for link references (manual parsing simulation)
   * In production, this would use AST parsing or grep
   */
  async scanForLinks(): Promise<Map<string, LinkReference[]>> {
    const linkMap = new Map<string, LinkReference[]>();

    // Known links from manual inspection (in production, use AST parser)
    const knownLinks = this.getKnownLinksFromCodebase();

    knownLinks.forEach(ref => {
      if (!linkMap.has(ref.path)) {
        linkMap.set(ref.path, []);
      }
      linkMap.get(ref.path)!.push(ref);
    });

    return linkMap;
  }

  /**
   * Get known links from codebase (extracted from search results)
   * In production, use proper AST parsing
   */
  private getKnownLinksFromCodebase(): LinkReference[] {
    return [
      // Enterprise Dashboard Navigation
      { file: 'src/components/enterprise/EnterpriseSecondaryNav.tsx', line: 20, linkType: 'NavLink', path: '/dashboard', isStatic: true, isDynamic: false },
      { file: 'src/components/enterprise/EnterpriseSecondaryNav.tsx', line: 21, linkType: 'NavLink', path: '/policies', isStatic: true, isDynamic: false },
      { file: 'src/components/enterprise/EnterpriseSecondaryNav.tsx', line: 22, linkType: 'NavLink', path: '/partners', isStatic: true, isDynamic: false },
      { file: 'src/components/enterprise/EnterpriseSecondaryNav.tsx', line: 23, linkType: 'NavLink', path: '/workflows', isStatic: true, isDynamic: false },
      { file: 'src/components/enterprise/EnterpriseSecondaryNav.tsx', line: 24, linkType: 'NavLink', path: '/audit-trail', isStatic: true, isDynamic: false },
      { file: 'src/components/enterprise/EnterpriseSecondaryNav.tsx', line: 25, linkType: 'NavLink', path: '/analytics', isStatic: true, isDynamic: false },
      { file: 'src/components/enterprise/EnterpriseSecondaryNav.tsx', line: 26, linkType: 'NavLink', path: '/governance/inbox', isStatic: true, isDynamic: false },
      
      // Governance Tabs
      { file: 'src/pages/enterprise/GovernanceInboxPage.tsx', line: 57, linkType: 'navigate', path: '/governance/inbox', isStatic: true, isDynamic: false },
      { file: 'src/pages/enterprise/GovernanceInboxPage.tsx', line: 58, linkType: 'navigate', path: '/governance/policies', isStatic: true, isDynamic: false },
      { file: 'src/pages/enterprise/GovernanceInboxPage.tsx', line: 59, linkType: 'navigate', path: '/governance/audits', isStatic: true, isDynamic: false },
      { file: 'src/pages/enterprise/GovernanceInboxPage.tsx', line: 60, linkType: 'navigate', path: '/governance/tools', isStatic: true, isDynamic: false },
      { file: 'src/pages/enterprise/GovernanceInboxPage.tsx', line: 61, linkType: 'navigate', path: '/governance/analytics', isStatic: true, isDynamic: false },
      
      // Policy Actions
      { file: 'src/pages/PoliciesPage.tsx', line: 26, linkType: 'navigate', path: '/policies/new', isStatic: true, isDynamic: false },
      { file: 'src/pages/enterprise/GovernanceInboxPage.tsx', line: 177, linkType: 'navigate', path: '/policies/new', isStatic: true, isDynamic: false },
      { file: 'src/components/enterprise/PolicyManager.tsx', line: 0, linkType: 'navigate', path: '/policies/:id', isStatic: false, isDynamic: true },
      
      // Partner Actions
      { file: 'src/components/enterprise/AgencyComplianceList.tsx', line: 142, linkType: 'navigate', path: '/partners/:id', isStatic: false, isDynamic: true },
      
      // Agency Routes
      { file: 'src/components/partner/PartnerSecondaryNav.tsx', line: 6, linkType: 'NavLink', path: '/agency/dashboard', isStatic: true, isDynamic: false },
      { file: 'src/components/partner/PartnerSecondaryNav.tsx', line: 7, linkType: 'NavLink', path: '/agency/requirements', isStatic: true, isDynamic: false },
      { file: 'src/components/partner/PartnerSecondaryNav.tsx', line: 8, linkType: 'NavLink', path: '/agency/my-tools', isStatic: true, isDynamic: false },
      { file: 'src/components/partner/PartnerSecondaryNav.tsx', line: 9, linkType: 'NavLink', path: '/agency/submissions', isStatic: true, isDynamic: false },
      { file: 'src/components/partner/PartnerSecondaryNav.tsx', line: 10, linkType: 'NavLink', path: '/agency/trust-center', isStatic: true, isDynamic: false },
      { file: 'src/components/partner/PartnerSecondaryNav.tsx', line: 11, linkType: 'NavLink', path: '/agency/admin/team', isStatic: true, isDynamic: false },
      { file: 'src/components/partner/PartnerSecondaryNav.tsx', line: 12, linkType: 'NavLink', path: '/marketplace-dashboard', isStatic: true, isDynamic: false },
      
      // Vendor Routes
      { file: 'src/components/vendor/VendorSecondaryNav.tsx', line: 8, linkType: 'Link', path: '/vendor/dashboard', isStatic: true, isDynamic: false },
      { file: 'src/components/vendor/VendorSecondaryNav.tsx', line: 9, linkType: 'Link', path: '/vendor/tools', isStatic: true, isDynamic: false },
      { file: 'src/components/vendor/VendorSecondaryNav.tsx', line: 10, linkType: 'Link', path: '/vendor/submissions', isStatic: true, isDynamic: false },
      { file: 'src/components/vendor/VendorSecondaryNav.tsx', line: 11, linkType: 'Link', path: '/vendor/promotions', isStatic: true, isDynamic: false },
      { file: 'src/components/vendor/VendorSecondaryNav.tsx', line: 12, linkType: 'Link', path: '/vendor/analytics', isStatic: true, isDynamic: false },
      { file: 'src/components/vendor/VendorSecondaryNav.tsx', line: 13, linkType: 'Link', path: '/vendor/settings', isStatic: true, isDynamic: false },
      
      // Auth & Public
      { file: 'src/components/Navigation.tsx', line: 76, linkType: 'Link', path: '/', isStatic: true, isDynamic: false },
      { file: 'src/components/Navigation.tsx', line: 194, linkType: 'Link', path: '/auth', isStatic: true, isDynamic: false },
      { file: 'src/pages/Auth.tsx', line: 56, linkType: 'navigate', path: '/dashboard', isStatic: true, isDynamic: false },
      { file: 'src/pages/Auth.tsx', line: 58, linkType: 'navigate', path: '/agency/dashboard', isStatic: true, isDynamic: false },
      { file: 'src/pages/Auth.tsx', line: 60, linkType: 'navigate', path: '/vendor/dashboard', isStatic: true, isDynamic: false },
    ];
  }

  /**
   * Generate comprehensive link inventory report
   */
  async generateReport(): Promise<LinkInventoryReport> {
    const linkMap = await this.scanForLinks();
    const allResults: LinkValidationResult[] = [];

    // Validate all discovered links
    for (const [path, references] of linkMap.entries()) {
      const result = this.validateLink(path, references);
      allResults.push(result);
    }

    // Check for orphaned routes (defined but never referenced)
    const referencedPaths = new Set(allResults.map(r => r.path));
    for (const definedRoute of this.definedRoutes) {
      if (!referencedPaths.has(definedRoute) && !definedRoute.includes(':')) {
        allResults.push({
          path: definedRoute,
          status: 'orphaned',
          references: [],
          routeExists: true,
          componentImplemented: true,
          implementationNotes: 'Route defined but never referenced in codebase',
        });
      }
    }

    // Categorize by section
    const bySection = {
      enterprise: allResults.filter(r => r.path.startsWith('/dashboard') || r.path.startsWith('/policies') || r.path.startsWith('/partners') || r.path.startsWith('/workflows') || r.path.startsWith('/audit-trail') || r.path.startsWith('/analytics')),
      agency: allResults.filter(r => r.path.startsWith('/agency/')),
      vendor: allResults.filter(r => r.path.startsWith('/vendor/')),
      public: allResults.filter(r => r.path === '/' || r.path.startsWith('/auth') || r.path.startsWith('/platform') || r.path.startsWith('/pricing')),
      governance: allResults.filter(r => r.path.startsWith('/governance/')),
    };

    // Calculate summary
    const summary = {
      totalLinks: allResults.length,
      workingLinks: allResults.filter(r => r.status === 'working').length,
      temporaryLinks: allResults.filter(r => r.status === 'temporary').length,
      brokenLinks: allResults.filter(r => r.status === 'broken').length,
      orphanedRoutes: allResults.filter(r => r.status === 'orphaned').length,
    };

    // Identify critical issues
    const criticalIssues = allResults.filter(r => 
      r.status === 'broken' || 
      (r.status === 'temporary' && r.references.length > 3)
    );

    return {
      timestamp: new Date().toISOString(),
      summary,
      bySection,
      criticalIssues,
      allResults,
    };
  }

  /**
   * Export report as markdown
   */
  exportMarkdown(report: LinkInventoryReport): string {
    let md = '# Link Inventory Report\n\n';
    md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    md += '## Summary\n\n';
    md += `- Total Links: ${report.summary.totalLinks}\n`;
    md += `- ✅ Working: ${report.summary.workingLinks}\n`;
    md += `- ⚠️ Temporary: ${report.summary.temporaryLinks}\n`;
    md += `- 🔴 Broken: ${report.summary.brokenLinks}\n`;
    md += `- 🟡 Orphaned Routes: ${report.summary.orphanedRoutes}\n\n`;

    if (report.criticalIssues.length > 0) {
      md += '## 🚨 Critical Issues\n\n';
      report.criticalIssues.forEach(issue => {
        md += `### ${issue.path}\n`;
        md += `- **Status:** ${issue.status}\n`;
        md += `- **Notes:** ${issue.implementationNotes || 'N/A'}\n`;
        md += `- **References:** ${issue.references.length}\n`;
        issue.references.forEach(ref => {
          md += `  - \`${ref.file}:${ref.line}\` (${ref.linkType})\n`;
        });
        md += '\n';
      });
    }

    md += '## Enterprise Dashboard\n\n';
    this.addSectionToMarkdown(md, report.bySection.enterprise);

    md += '\n## Governance\n\n';
    this.addSectionToMarkdown(md, report.bySection.governance);

    md += '\n## Agency Portal\n\n';
    this.addSectionToMarkdown(md, report.bySection.agency);

    md += '\n## Vendor Portal\n\n';
    this.addSectionToMarkdown(md, report.bySection.vendor);

    return md;
  }

  private addSectionToMarkdown(md: string, results: LinkValidationResult[]): string {
    if (results.length === 0) {
      md += '_No links found_\n';
      return md;
    }

    const statusEmoji = {
      working: '✅',
      temporary: '⚠️',
      broken: '🔴',
      orphaned: '🟡',
    };

    results.forEach(result => {
      md += `- ${statusEmoji[result.status]} \`${result.path}\` - ${result.status}`;
      if (result.implementationNotes) {
        md += ` (${result.implementationNotes})`;
      }
      if (result.references.length > 0) {
        md += ` - ${result.references.length} reference(s)`;
      }
      md += '\n';
    });

    return md;
  }

  /**
   * Export navigation map as Mermaid diagram
   */
  exportMermaid(report: LinkInventoryReport): string {
    let mmd = 'graph TD\n';
    mmd += '  Start[App Root]\n\n';
    
    // Enterprise section
    mmd += '  Start --> Enterprise[Enterprise Dashboard]\n';
    report.bySection.enterprise.forEach(r => {
      const status = r.status === 'working' ? '✅' : r.status === 'temporary' ? '⚠️' : '🔴';
      const nodeId = r.path.replace(/[\/\-:]/g, '_').substring(1);
      const label = r.path.split('/').pop() || 'root';
      mmd += `  Enterprise --> ${nodeId}["${status} ${label}"]\n`;
    });
    mmd += '\n';

    // Governance section
    mmd += '  Enterprise --> Governance[Governance]\n';
    report.bySection.governance.forEach(r => {
      const status = r.status === 'working' ? '✅' : r.status === 'temporary' ? '⚠️' : '🔴';
      const nodeId = r.path.replace(/[\/\-:]/g, '_').substring(1);
      const label = r.path.split('/').pop() || 'inbox';
      mmd += `  Governance --> ${nodeId}["${status} ${label}"]\n`;
    });
    mmd += '\n';

    // Agency section
    mmd += '  Start --> Agency[Agency Portal]\n';
    report.bySection.agency.slice(0, 10).forEach(r => {
      const status = r.status === 'working' ? '✅' : r.status === 'temporary' ? '⚠️' : '🔴';
      const nodeId = r.path.replace(/[\/\-:]/g, '_').substring(1);
      const label = r.path.split('/').pop() || 'agency';
      mmd += `  Agency --> ${nodeId}["${status} ${label}"]\n`;
    });
    mmd += '\n';

    // Vendor section
    mmd += '  Start --> Vendor[Vendor Portal]\n';
    report.bySection.vendor.forEach(r => {
      const status = r.status === 'working' ? '✅' : r.status === 'temporary' ? '⚠️' : '🔴';
      const nodeId = r.path.replace(/[\/\-:]/g, '_').substring(1);
      const label = r.path.split('/').pop() || 'vendor';
      mmd += `  Vendor --> ${nodeId}["${status} ${label}"]\n`;
    });

    return mmd;
  }
}

// Export singleton instance
export const linkValidator = new LinkValidator();

// Export convenience functions
export const generateLinkReport = () => linkValidator.generateReport();
export const exportReportMarkdown = (report: LinkInventoryReport) => linkValidator.exportMarkdown(report);
export const exportNavigationMermaid = (report: LinkInventoryReport) => linkValidator.exportMermaid(report);
