import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInviteData } from "@/hooks/useInviteContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Upload, Shield, Eye, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { routes } from '@/lib/routes';
import PolicyModal from '@/components/PolicyModal';
import { toast } from 'sonner';

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

const SubmissionPage = () => {
  const navigate = useNavigate();
  const { inviteData, isInviteSession } = useInviteData();
  const [currentStep, setCurrentStep] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(5);

  // Validation temporarily disabled for development

  const steps: Step[] = [
    {
      id: 'tool-identification',
      title: 'Tool Identification',
      description: 'Basic tool information and categorization',
      completed: currentStep > 0,
      current: currentStep === 0
    },
    {
      id: 'business-context',
      title: 'Business Context',
      description: 'Business justification and requirements',
      completed: currentStep > 1,
      current: currentStep === 1
    },
    {
      id: 'use-cases',
      title: 'Use Cases',
      description: 'Detailed use case scenarios',
      completed: currentStep > 2,
      current: currentStep === 2
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      description: 'Data handling and privacy requirements',
      completed: currentStep > 3,
      current: currentStep === 3
    },
    {
      id: 'evidence-upload',
      title: 'Evidence Upload',
      description: 'Supporting documentation and evidence',
      completed: currentStep > 4,
      current: currentStep === 4
    },
    {
      id: 'technical-requirements',
      title: 'Technical Requirements',
      description: 'Technical specifications and integrations',
      completed: currentStep > 5,
      current: currentStep === 5
    },
    {
      id: 'risk-compliance',
      title: 'Risk & Compliance',
      description: 'Risk assessment and compliance mapping',
      completed: currentStep > 6,
      current: currentStep === 6
    },
    {
      id: 'vendor-assessment',
      title: 'Vendor Assessment',
      description: 'Vendor evaluation and due diligence',
      completed: currentStep > 7,
      current: currentStep === 7
    },
    {
      id: 'approval-chain',
      title: 'Approval Chain',
      description: 'Approval workflow and stakeholders',
      completed: currentStep > 8,
      current: currentStep === 8
    },
    {
      id: 'review-submit',
      title: 'Review & Submit',
      description: 'Final review and submission',
      completed: false,
      current: currentStep === 9
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletionPercentage(Math.min(95, completionPercentage + 10));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully');
  };

  const handleSubmit = () => {
    toast.success('Submission sent for review');
    navigate(routes.submissionConfirmation);
  };

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Invitation Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To access the submission form, you need to enter through an invitation link.
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => navigate(routes.agency.dashboard)}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // Demo context for testing
                  const demoContext = {
                    workspaceId: 'demo-workspace',
                    enterpriseName: 'Demo Enterprise',
                    workspaceName: 'Demo Workspace',
                    policyScope: 'MLR Required for Patient Content',
                    policyName: 'Demo Policy',
                    role: 'Compliance Manager',
                    email: 'demo@example.com',
                    inviteId: 'demo-invite'
                  };
                  localStorage.setItem('inviteContext', JSON.stringify(demoContext));
                  window.location.reload();
                }}
              >
                Load Demo Context
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Demo context warning */}
        {!isInviteSession && (
          <div className="p-4 bg-brand-orange/10 border border-brand-orange/20 rounded-lg">
            <div className="flex items-center gap-2 text-brand-orange">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-sm text-brand-orange/80 mt-1">
              You're viewing the submission wizard in demo mode. In production, this would be accessed through an invitation link.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step sidebar placeholder */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Submission Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={completionPercentage} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  {completionPercentage}% complete
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main form area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Tool Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tool-name">Tool Name *</Label>
                    <Input 
                      id="tool-name" 
                      placeholder="e.g., ChatGPT, Notion AI, GitHub Copilot"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="vendor">Vendor/Provider *</Label>
                    <Input 
                      id="vendor" 
                      placeholder="e.g., OpenAI, Notion Labs, GitHub"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      placeholder="Describe the AI tool's functionality and use cases..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveDraft} variant="outline">
                      Save Draft
                    </Button>
                    <Button onClick={handleSubmit}>
                      Submit for Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-teal mb-2">68%</div>
                  <p className="text-sm text-muted-foreground">
                    Based on policy alignment
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SubmissionPage;