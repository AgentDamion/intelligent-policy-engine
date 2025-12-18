import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Shield, ExternalLink, FileText, Users, CheckCircle } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';
import { routes } from '@/lib/routes';

const ToolDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mode } = useMode();

  // Mock tool data
  const tool = {
    id: id,
    name: "MedLens AI Diagnostic Assistant",
    vendor: "MedTech Solutions",
    version: "2.1.4",
    category: "Medical Imaging",
    riskLevel: "Medium",
    complianceScore: 87,
    description: "Advanced AI-powered diagnostic assistant for medical imaging analysis with FDA pre-market approval.",
    features: [
      "Real-time image analysis",
      "FDA 510(k) cleared",
      "HIPAA compliant",
      "Cloud and on-premise deployment"
    ],
    policyAlignment: [
      { policy: "Medical Device AI Policy", status: "Compliant", score: 92 },
      { policy: "Data Privacy Policy", status: "Compliant", score: 89 },
      { policy: "Security Framework", status: "Review Required", score: 78 }
    ]
  };

  const handleStartSubmission = () => {
    // In a real app, this would pre-fill the submission wizard with tool data
    navigate(routes.submissionWizard, { state: { prefilledTool: tool } });
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-brand-green text-white';
      case 'medium': return 'bg-brand-orange text-white';
      case 'high': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant': return 'text-brand-green';
      case 'review required': return 'text-brand-orange';
      case 'non-compliant': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{tool.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>by {tool.vendor}</span>
              <span>Version {tool.version}</span>
              <Badge variant="outline">{tool.category}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getRiskColor(tool.riskLevel)}>
                {tool.riskLevel} Risk
              </Badge>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-brand-teal" />
                <span className="text-sm font-medium">Compliance Score: {tool.complianceScore}/100</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleStartSubmission}
            className={mode === 'enterprise' ? 'bg-brand-teal hover:bg-brand-teal/90' : 'bg-brand-coral hover:bg-brand-coral/90'}
          >
            Start Submission
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tool.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-brand-green" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Policy Alignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Policy Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tool.policyAlignment.map((policy, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{policy.policy}</p>
                        <p className={`text-sm ${getStatusColor(policy.status)}`}>
                          {policy.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{policy.score}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Vendor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{tool.vendor}</p>
                  <p className="text-sm text-muted-foreground">Healthcare Technology Provider</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Vendor Profile
                </Button>
              </CardContent>
            </Card>

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">v2.1.4</span>
                    <Badge variant="outline">Current</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>v2.1.3</span>
                    <span>2024-01-10</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>v2.1.2</span>
                    <span>2023-12-15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleStartSubmission}
                >
                  Request Access
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Vendor
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetails;