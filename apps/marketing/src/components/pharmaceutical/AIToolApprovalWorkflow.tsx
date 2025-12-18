import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertTriangle, Clock, Users, Shield, Download, Zap, Eye, ArrowRight } from 'lucide-react';
import { unifiedApi } from '@/services/unified-api';
import { toast } from 'sonner';

interface ToolSubmission {
  toolName: string;
  vendor: string;
  useCase: string;
  category: string;
  justification: string;
}

interface ApprovalStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignee?: string;
  estimatedTime: string;
  details?: string;
}

interface ProcessedResult {
  submissionId: string;
  toolName: string;
  riskScore: number;
  approvalStatus: 'approved' | 'conditional' | 'rejected';
  approvalSteps: ApprovalStep[];
  vendorAnalysis: {
    securityRating: string;
    complianceStatus: string;
    dataHandling: string;
    riskFactors: string[];
  };
}

export const AIToolApprovalWorkflow: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [submission, setSubmission] = useState<ToolSubmission>({
    toolName: '',
    vendor: '',
    useCase: '',
    category: '',
    justification: ''
  });
  const [result, setResult] = useState<ProcessedResult | null>(null);

  const handleSubmissionChange = (field: keyof ToolSubmission, value: string) => {
    setSubmission(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (!submission.toolName || !submission.vendor || !submission.useCase) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Create demo submission
      const demoSubmission = await unifiedApi.tools.createSubmission({
        title: `AI Tool Request: ${submission.toolName}`,
        description: submission.justification,
        policy_version_id: 'demo-governance-policy',
        workspace_id: 'demo-workspace',
        type: 'ai_tool',
        metadata: {
          demo: true,
          source: 'pharmaceutical_approval_demo',
          tool_details: submission
        }
      });

      // Simulate approval workflow phases
      await simulateApprovalPhases();
      
      // Generate realistic results
      const processedResult = await generateApprovalResult();
      setResult(processedResult);
      
      setCurrentPhase('Complete');
      setProgress(100);
      toast.success('AI tool submission processed! View your approval workflow below.');

    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Submission failed. In production, this connects to your governance platform.');
    } finally {
      setIsProcessing(false);
    }
  }, [submission]);

  const simulateApprovalPhases = async () => {
    const phases = [
      { phase: 'Validating tool information...', progress: 15 },
      { phase: 'Running vendor risk assessment...', progress: 30 },
      { phase: 'Checking security requirements...', progress: 45 },
      { phase: 'Analyzing compliance requirements...', progress: 60 },
      { phase: 'Generating stakeholder review tasks...', progress: 75 },
      { phase: 'Creating approval workflow...', progress: 90 }
    ];

    for (const { phase, progress } of phases) {
      setCurrentPhase(phase);
      setProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  const generateApprovalResult = async (): Promise<ProcessedResult> => {
    const isHighRisk = submission.category === 'generative-ai' || submission.vendor.toLowerCase().includes('openai');
    const riskScore = isHighRisk ? 65 + Math.floor(Math.random() * 15) : 25 + Math.floor(Math.random() * 25);
    
    const approvalStatus: 'approved' | 'conditional' | 'rejected' = 
      riskScore < 40 ? 'approved' : 
      riskScore < 70 ? 'conditional' : 'rejected';

    const approvalSteps: ApprovalStep[] = [
      {
        id: 'security-review',
        title: 'Security Review',
        description: 'IT Security team reviews vendor security posture',
        status: 'completed',
        assignee: 'Sarah Chen (CISO)',
        estimatedTime: '2 days',
        details: 'SOC 2 compliance verified, encryption standards met'
      },
      {
        id: 'compliance-check',
        title: 'Compliance Assessment',
        description: 'Legal team reviews data handling and privacy requirements',
        status: riskScore < 50 ? 'completed' : 'in-progress',
        assignee: 'Michael Torres (Legal)',
        estimatedTime: '1 day',
        details: riskScore < 50 ? 'GDPR compliance confirmed' : 'Reviewing data processing addendum'
      },
      {
        id: 'business-approval',
        title: 'Business Approval',
        description: 'Department head approves business justification',
        status: riskScore < 60 ? 'completed' : 'pending',
        assignee: 'Dr. Jennifer Wang (Head of R&D)',
        estimatedTime: '0.5 days'
      }
    ];

    if (riskScore > 60) {
      approvalSteps.push({
        id: 'executive-review',
        title: 'Executive Review',
        description: 'C-level approval required for high-risk tools',
        status: 'pending',
        assignee: 'CTO Review Board',
        estimatedTime: '3 days'
      });
    }

    return {
      submissionId: `AIR-${Date.now()}`,
      toolName: submission.toolName,
      riskScore,
      approvalStatus,
      approvalSteps,
      vendorAnalysis: {
        securityRating: riskScore < 40 ? 'A' : riskScore < 60 ? 'B' : 'C',
        complianceStatus: riskScore < 50 ? 'Fully Compliant' : 'Requires Review',
        dataHandling: riskScore < 45 ? 'On-Premises Available' : 'Cloud-Only',
        riskFactors: riskScore > 60 ? [
          'Data processing outside EU',
          'Limited audit trail capabilities',
          'Third-party data sharing'
        ] : []
      }
    };
  };

  const downloadWorkflowReport = () => {
    if (!result) return;

    const report = `
AI TOOL APPROVAL WORKFLOW REPORT
Generated: ${new Date().toLocaleString()}
Submission ID: ${result.submissionId}

TOOL DETAILS:
Tool Name: ${submission.toolName}
Vendor: ${submission.vendor}
Use Case: ${submission.useCase}
Category: ${submission.category}

RISK ASSESSMENT:
Risk Score: ${result.riskScore}/100
Approval Status: ${result.approvalStatus.toUpperCase()}
Security Rating: ${result.vendorAnalysis.securityRating}

APPROVAL WORKFLOW:
${result.approvalSteps.map(step => 
  `${step.title}: ${step.status.toUpperCase()} (${step.assignee || 'Unassigned'}) - Est. ${step.estimatedTime}`
).join('\n')}

VENDOR ANALYSIS:
Security Rating: ${result.vendorAnalysis.securityRating}
Compliance Status: ${result.vendorAnalysis.complianceStatus}
Data Handling: ${result.vendorAnalysis.dataHandling}
${result.vendorAnalysis.riskFactors.length > 0 ? 
  `Risk Factors:\n${result.vendorAnalysis.riskFactors.map(f => `• ${f}`).join('\n')}` : 
  'No significant risk factors identified'}

This report demonstrates aicomply.io's automated AI tool governance capabilities.
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Tool_Approval_${result.submissionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'blocked': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>AI Tool Approval Workflow</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Live Demo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">Submit an AI tool request to see our automated approval workflow</p>
              <p className="text-sm text-muted-foreground">
                Experience real-time vendor risk assessment and stakeholder routing
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toolName">Tool Name *</Label>
                <Input
                  id="toolName"
                  placeholder="e.g., ChatGPT Enterprise"
                  value={submission.toolName}
                  onChange={(e) => handleSubmissionChange('toolName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., OpenAI"
                  value={submission.vendor}
                  onChange={(e) => handleSubmissionChange('vendor', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={submission.category}
                  onValueChange={(value) => handleSubmissionChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tool category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generative-ai">Generative AI</SelectItem>
                    <SelectItem value="analytics">Data Analytics</SelectItem>
                    <SelectItem value="automation">Process Automation</SelectItem>
                    <SelectItem value="research">Research Assistant</SelectItem>
                    <SelectItem value="collaboration">Collaboration Tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="useCase">Primary Use Case *</Label>
                <Input
                  id="useCase"
                  placeholder="e.g., Clinical trial protocol drafting"
                  value={submission.useCase}
                  onChange={(e) => handleSubmissionChange('useCase', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Business Justification</Label>
              <Textarea
                id="justification"
                placeholder="Explain why this tool is needed and how it will be used..."
                value={submission.justification}
                onChange={(e) => handleSubmissionChange('justification', e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isProcessing || !submission.toolName || !submission.vendor}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing Request...' : 'Submit for Approval'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentPhase}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Running automated vendor risk assessment and routing to stakeholders...
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{result.toolName} - Approval Workflow</div>
                    <div className="text-sm text-muted-foreground">
                      Submission ID: {result.submissionId}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border ${
                  result.approvalStatus === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                  result.approvalStatus === 'conditional' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                  'text-red-600 bg-red-50 border-red-200'
                }`}>
                  <span className="font-medium">{result.approvalStatus.toUpperCase()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Risk Assessment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Score</span>
                      <span className="font-medium">{result.riskScore}/100</span>
                    </div>
                    <Progress value={result.riskScore} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {result.riskScore < 40 ? 'Low Risk' : result.riskScore < 70 ? 'Medium Risk' : 'High Risk'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Vendor Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Security Rating</span>
                      <Badge variant="outline">{result.vendorAnalysis.securityRating}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance</span>
                      <span className="text-right">{result.vendorAnalysis.complianceStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Handling</span>
                      <span className="text-right">{result.vendorAnalysis.dataHandling}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Approval Steps</h4>
                <div className="space-y-3">
                  {result.approvalSteps.map((step, index) => (
                    <div key={step.id} className={`p-3 rounded-lg border ${getStatusColor(step.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(step.status)}
                          <span className="font-medium">{step.title}</span>
                        </div>
                        <div className="text-sm">
                          <Users className="w-3 h-3 inline mr-1" />
                          {step.assignee || 'Unassigned'}
                        </div>
                      </div>
                      <p className="text-sm mb-1">{step.description}</p>
                      <div className="flex justify-between text-xs">
                        <span>Est. Time: {step.estimatedTime}</span>
                        {step.details && <span>{step.details}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.vendorAnalysis.riskFactors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Risk Factors Identified</h4>
                  <div className="space-y-1">
                    {result.vendorAnalysis.riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={downloadWorkflowReport}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  View in Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium text-blue-900">Live Approval Workflow Demo</div>
            <div className="text-sm text-blue-700">
              This demonstration shows our automated AI tool approval process with real-time vendor risk assessment,
              stakeholder routing, and compliance checking. In production, this integrates with your existing
              approval systems and provides complete audit trails.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};