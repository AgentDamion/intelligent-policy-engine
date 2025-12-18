import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RouteSchema = () => {
  return (
    <StandardPageLayout title="Route Schema">
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Route Schema Documentation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete overview of the application's routing structure and navigation flow
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Route Registry
                <Badge variant="secondary">src/lib/routes.ts</Badge>
              </CardTitle>
              <CardDescription>
                Single source of truth for all application routes. All navigation should use this centralized registry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">Public Routes</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Landing pages</li>
                      <li>• Marketing content</li>
                      <li>• Industry pages</li>
                      <li>• Authentication</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-600">Enterprise Dashboard</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Analytics & reporting</li>
                      <li>• Policy management</li>
                      <li>• Workflow orchestration</li>
                      <li>• Partner management</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-600">Agency Platform</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Tool tracking</li>
                      <li>• Compliance monitoring</li>
                      <li>• Submission workflows</li>
                      <li>• Performance metrics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Flow Diagram</CardTitle>
              <CardDescription>
                Visual representation of the complete routing structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <pre className="text-sm bg-muted p-4 rounded-lg">
{`graph TD
    A[Landing /] --> B{Authentication}
    A --> C[Platform /platform]
    A --> D[Industries]
    A --> E[Public Marketplace /marketplace-public]
    A --> F[Proof Center /proof-center]
    A --> G[Premium /premium]
    A --> H[Pricing /pricing]
    
    D --> D1[Pharmaceutical /industries/pharmaceutical]
    D --> D2[Marketing Services /industries/marketing-services]
    
    B --> I{User Role}
    I -->|Enterprise| J[Enterprise Dashboard /dashboard]
    I -->|Agency| K[Agency Dashboard /agency/dashboard]
    
    J --> J1[Analytics /analytics]
    J --> J2[Policies /policies]
    J --> J3[Workflows /workflows]
    J --> J4[Audit Trail /audit-trail]
    J --> J5[Partners /partners]
    J --> J6[Marketplace Dashboard /marketplace-dashboard]
    J --> J7[Tool Intelligence /tool-intelligence]
    J --> J8[Submissions /submissions]
    J --> J9[Decisions /decisions]
    
    K --> K1[Performance /agency/performance]
    K --> K2[Requirements /requirements]
    K --> K3[Compliance /agency/compliance-status]
    K --> K4[AI Readiness /agency/ai-readiness]
    K --> K5[My Tools /agency/my-tools]
    K --> K6[Integrations /agency/integrations]
    K --> K7[Project Setup /agency/project-setup]
    K --> K8[AI Tool Tracking /agency/ai-tool-tracking]
    K --> K9[Agency Submissions /agency/submissions]
    K --> K10[Reviews /agency/reviews]
    K --> K11[Conflicts /agency/conflicts]
    
    style A fill:#e1f5fe
    style J fill:#f3e5f5
    style K fill:#e8f5e8
    style D1 fill:#fff3e0
    style D2 fill:#fff3e0`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Route Categories</CardTitle>
              <CardDescription>
                Detailed breakdown of route types and access patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Public</Badge>
                      <span className="text-sm font-medium">No authentication required</span>
                    </div>
                    <ul className="text-sm space-y-1 pl-4 border-l-2 border-green-200">
                      <li>• Marketing & landing pages</li>
                      <li>• Industry-specific content</li>
                      <li>• Public marketplace</li>
                      <li>• Proof center & testimonials</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Enterprise</Badge>
                      <span className="text-sm font-medium">Admin & management features</span>
                    </div>
                    <ul className="text-sm space-y-1 pl-4 border-l-2 border-blue-200">
                      <li>• Policy management</li>
                      <li>• Analytics & reporting</li>
                      <li>• Partner oversight</li>
                      <li>• Workflow orchestration</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">Agency</Badge>
                      <span className="text-sm font-medium">Partner/client workflows</span>
                    </div>
                    <ul className="text-sm space-y-1 pl-4 border-l-2 border-purple-200">
                      <li>• Tool submission & tracking</li>
                      <li>• Compliance monitoring</li>
                      <li>• Performance dashboards</li>
                      <li>• Review workflows</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800">Shared</Badge>
                      <span className="text-sm font-medium">Cross-platform utilities</span>
                    </div>
                    <ul className="text-sm space-y-1 pl-4 border-l-2 border-orange-200">
                      <li>• Settings & preferences</li>
                      <li>• Notifications</li>
                      <li>• Search functionality</li>
                      <li>• Profile management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default RouteSchema;