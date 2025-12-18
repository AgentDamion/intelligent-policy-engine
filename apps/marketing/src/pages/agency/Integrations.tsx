import React from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import SpecBadge from '@/components/ui/SpecBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug, Slack, Github, FileText, Lock, Zap, CheckCircle } from 'lucide-react';

const integrationCategories = [
  {
    title: "Communication",
    integrations: [
      { name: "Slack", icon: Slack, status: "available", description: "Real-time compliance notifications and approvals" },
      { name: "Microsoft Teams", icon: FileText, status: "coming_soon", description: "Team collaboration and workflow updates" }
    ]
  },
  {
    title: "Development",
    integrations: [
      { name: "GitHub", icon: Github, status: "available", description: "AI model versioning and compliance tracking" },
      { name: "Jira", icon: FileText, status: "available", description: "Issue tracking and compliance workflow integration" }
    ]
  },
  {
    title: "Security & Identity",
    integrations: [
      { name: "Okta", icon: Lock, status: "available", description: "Single sign-on and identity management" },
      { name: "Azure AD", icon: Lock, status: "coming_soon", description: "Enterprise identity integration" }
    ]
  },
  {
    title: "Storage & Documents",
    integrations: [
      { name: "Google Drive", icon: FileText, status: "available", description: "Automated evidence collection and storage" },
      { name: "SharePoint", icon: FileText, status: "coming_soon", description: "Enterprise document management" }
    ]
  }
];

const Integrations = () => {
  const getStatusBadge = (status: string) => {
    if (status === "available") {
      return <Badge variant="default" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Coming Soon</Badge>;
  };

  const handleConnect = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}`);
    // Here you would typically open the OAuth flow or configuration modal
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-semibold">Integrations</h1>
            <SpecBadge id="L1" />
          </div>
          <p className="text-muted-foreground">Connect with your existing tools to streamline compliance workflows</p>
        </div>
      </div>

      <div className="space-y-8">
        {integrationCategories.map((category, index) => (
          <div key={index}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {category.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {category.integrations.map((integration, idx) => (
                <Card key={idx} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <integration.icon className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          {getStatusBadge(integration.status)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-4">
                      {integration.description}
                    </CardDescription>
                    <Button 
                      variant={integration.status === "available" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleConnect(integration.name)}
                      disabled={integration.status !== "available"}
                      className="w-full"
                    >
                      {integration.status === "available" ? "Connect" : "Notify When Ready"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        <Card className="border-dashed border-2">
          <CardContent className="text-center py-8">
            <Plug className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Need a Custom Integration?</h3>
            <p className="text-muted-foreground mb-4">
              We can build custom integrations for your specific tools and workflows
            </p>
            <Button variant="outline">
              Request Custom Integration
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Integrations;