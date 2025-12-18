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
import { CheckCircle, AlertTriangle, Clock, Users, Shield, Download, Zap, ArrowRight, Building } from 'lucide-react';
import { unifiedApi } from '@/services/unified-api';
import { toast } from 'sonner';

interface PartnerGovernanceSubmission {
  partnerName: string;
  partnerType: 'cro' | 'vendor' | 'consultant' | 'testing_lab';
  contractId: string;
  partnerToolName: string;
  partnerToolVendor: string;
  partnerUseCase: string;
  dataAccessLevel: 'phi' | 'clinical_trial' | 'regulatory' | 'manufacturing';
  expectedDataVolume: 'small' | 'medium' | 'large';
  crossBorderTransfer: boolean;
  governanceJustification: string;
}

interface GovernanceStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignee?: string;
  estimatedTime: string;
  details?: string;
  governanceFocus: 'contract' | 'audit' | 'access' | 'data_residency' | 'policy';
}

interface PartnerGovernanceResult {
  submissionId: string;
  partnerName: string;
  governanceScore: number;
  governanceStatus: 'compliant' | 'requires_enhancement' | 'non_compliant';
  governanceSteps: GovernanceStep[];
  partnerAssessment: {
    auditTrailMaturity: string;
    accessControlRating: string;
    dataHandlingCompliance: string;
    governanceGaps: string[];
  };
}

export const PartnerGovernanceWorkflow: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [submission, setSubmission] = useState<PartnerGovernanceSubmission>({
    partnerName: '',
    partnerType: 'cro',
    contractId: '',
    partnerToolName: '',
    partnerToolVendor: '',
    partnerUseCase: '',
    dataAccessLevel: 'clinical_trial',
    expectedDataVolume: 'medium',
    crossBorderTransfer: false,
    governanceJustification: ''
  });
  const [result, setResult] = useState<PartnerGovernanceResult | null>(null);

  const handleSubmissionChange = (field: keyof PartnerGovernanceSubmission, value: any) => {
    setSubmission(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (!submission.partnerName || !submission.contractId || !submission.partnerToolName || !submission.partnerUseCase) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Create demo submission
      await unifiedApi.tools.createSubmission({
        title: `Partner Governance Assessment: ${submission.partnerName}`,
        description: submission.governanceJustification,
        policy_version_id: 'demo-partner-governance',
        workspace_id: 'demo-workspace',
        type: 'partner_governance',
        metadata: {
          demo: true,
          source: 'pharmaceutical_partner_governance',
          partner_details: submission
        }
      });

      // Simulate governance assessment phases
      await simulateGovernancePhases();
      
      // Generate realistic results
      const processedResult = await generateGovernanceResult();
      setResult(processedResult);
      
      setCurrentPhase('Complete');
      setProgress(100);
      toast.success('Partner governance assessment complete! View results below.');

    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Assessment failed. In production, this connects to your governance platform.');
    } finally {
      setIsProcessing(false);
    }
  }, [submission]);

  const simulateGovernancePhases = async () => {
    const phases = [
      { phase: 'Validating partnership contract terms...', progress: 12 },
      { phase: 'Analyzing partner audit trail requirements...', progress: 24 },
      { phase: 'Checking partner access control policies...', progress: 36 },
      { phase: 'Reviewing data residency compliance...', progress: 48 },
      { phase: 'Assessing cross-organizational data flows...', progress: 60 },
      { phase: 'Evaluating partner policy alignment...', progress: 72 },
      { phase: 'Generating governance gap analysis...', progress: 84 },
      { phase: 'Creating partnership governance report...', progress: 96 }
    ];

    for (const { phase, progress } of phases) {
      setCurrentPhase(phase);
      setProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  const generateGovernanceResult = async (): Promise<PartnerGovernanceResult> => {
    const isHighRisk = submission.dataAccessLevel === 'phi' || submission.dataAccessLevel === 'clinical_trial';
    const isCRO = submission.partnerType === 'cro';
    
    const governanceScore = isCRO ? 
      (isHighRisk ? 65 + Math.floor(Math.random() * 20) : 75 + Math.floor(Math.random() * 20)) :
      (isHighRisk ? 50 + Math.floor(Math.random() * 25) : 60 + Math.floor(Math.random() * 25));
    
    const governanceStatus: 'compliant' | 'requires_enhancement' | 'non_compliant' = 
      governanceScore >= 75 ? 'compliant' : 
      governanceScore >= 55 ? 'requires_enhancement' : 'non_compliant';

    const governanceSteps: GovernanceStep[] = [
      {
        id: 'contract-validation',
        title: 'Contract Validation',
        description: 'Verify partnership contract includes AI tool governance clauses',
        status: 'completed',
        assignee: 'Legal Team - Partnership Division',
        estimatedTime: '1 day',
        details: 'AI tool usage clauses present, data sharing terms verified',
        governanceFocus: 'contract'
      },
      {
        id: 'audit-trail-assessment',
        title: 'Partner Audit Trail Assessment',
        description: "Evaluate partner's AI tool usage audit trail capabilities",
        status: governanceScore >= 60 ? 'completed' : 'in-progress',
        assignee: 'Data Governance - Compliance Team',
        estimatedTime: '2 days',
        details: governanceScore >= 60 ? 
          'Partner audit logs comprehensive (user, timestamp, action, data accessed)' : 
          'Partner audit retention needs extension: 3 years → 5 years',
        governanceFocus: 'audit'
      },
      {
        id: 'access-control-review',
        title: 'Access Control Policy Review',
        description: "Assess partner's access controls for AI tool users",
        status: governanceScore >= 65 ? 'completed' : 'in-progress',
        assignee: 'IT Security - Partner Access Team',
        estimatedTime: '1.5 days',
        details: governanceScore >= 65 ?
          'Role-based access controls verified, MFA enabled' :
          'Access control policy needs enhancement for tool-specific permissions',
        governanceFocus: 'access'
      },
      {
        id: 'data-boundary-assessment',
        title: 'Data Boundary Assessment',
        description: 'Verify data flows and residency requirements at partnership boundary',
        status: governanceScore >= 70 ? 'completed' : 'pending',
        assignee: 'Data Privacy - Cross-Border Team',
        estimatedTime: '2 days',
        details: submission.crossBorderTransfer ?
          'Standard Contractual Clauses review required' :
          'Domestic data flows only - low complexity',
        governanceFocus: 'data_residency'
      }
    ];

    if (governanceScore < 60) {
      governanceSteps.push({
        id: 'governance-enhancement',
        title: 'Partner Governance Enhancement',
        description: 'Work with partner to enhance governance framework',
        status: 'pending',
        assignee: 'Partnership Governance Office',
        estimatedTime: '14 days',
        details: 'Governance maturity improvement plan required',
        governanceFocus: 'policy'
      });
    }

    const governanceGaps: string[] = [];
    if (governanceScore < 75) {
      if (governanceScore < 60) governanceGaps.push('Audit log retention insufficient (3 years vs 5 years required)');
      if (governanceScore < 65) governanceGaps.push('Access control granularity needs improvement');
      if (submission.crossBorderTransfer && governanceScore < 70) {
        governanceGaps.push('Cross-border data governance framework incomplete');
      }
    }

    return {
      submissionId: `PGA-${Date.now()}`,
      partnerName: submission.partnerName,
      governanceScore,
      governanceStatus,
      governanceSteps,
      partnerAssessment: {
        auditTrailMaturity: governanceScore >= 75 ? 'Mature' : governanceScore >= 60 ? 'Developing' : 'Needs Improvement',
        accessControlRating: governanceScore >= 70 ? 'Strong' : governanceScore >= 55 ? 'Moderate' : 'Weak',
        dataHandlingCompliance: governanceScore >= 65 ? 'Compliant' : 'Requires Enhancement',
        governanceGaps
      }
    };
  };

  const downloadWorkflowReport = () => {
    if (!result) return;

    const report = `
PARTNER AI TOOL GOVERNANCE ASSESSMENT REPORT
Generated: ${new Date().toLocaleString()}
Assessment ID: ${result.submissionId}

PARTNER INFORMATION:
Partner Name: ${submission.partnerName}
Partner Type: ${submission.partnerType.toUpperCase()}
Contract ID: ${submission.contractId}

PARTNER'S AI TOOL DETAILS:
Tool Name: ${submission.partnerToolName}
Tool Vendor: ${submission.partnerToolVendor || 'Partner Internal Tool'}
Partner Use Case: ${submission.partnerUseCase}

DATA BOUNDARY CONFIGURATION:
Data Access Level: ${submission.dataAccessLevel.replace('_', ' ').toUpperCase()}
Expected Volume: ${submission.expectedDataVolume.toUpperCase()}
Cross-Border Transfer: ${submission.crossBorderTransfer ? 'Yes' : 'No'}

GOVERNANCE ASSESSMENT:
Governance Score: ${result.governanceScore}/100
Governance Status: ${result.governanceStatus.toUpperCase().replace('_', ' ')}
Audit Trail Maturity: ${result.partnerAssessment.auditTrailMaturity}
Access Control Rating: ${result.partnerAssessment.accessControlRating}
Data Handling: ${result.partnerAssessment.dataHandlingCompliance}

GOVERNANCE WORKFLOW:
${result.governanceSteps.map(step => 
  `${step.title}: ${step.status.toUpperCase()} (${step.assignee || 'Unassigned'}) - Est. ${step.estimatedTime}
  Focus: ${step.governanceFocus.replace('_', ' ')}
  ${step.details ? 'Details: ' + step.details : ''}`
).join('\n\n')}

GOVERNANCE GAPS:
${result.partnerAssessment.governanceGaps.length > 0 ? 
  result.partnerAssessment.governanceGaps.map(gap => `• ${gap}`).join('\n') : 
  'No significant governance gaps identified'}

NEXT STEPS:
${result.governanceStatus === 'compliant' ? 
  '✅ Partner governance meets requirements - partnership can proceed\n📋 Activate continuous monitoring at data boundary\n🔍 Regular governance audits scheduled' :
  result.governanceStatus === 'requires_enhancement' ?
  '⚠️ Partner governance enhancement required\n📋 Work with partner to address identified gaps\n🔍 Re-assessment in 14-30 days' :
  '❌ Partner governance does not meet minimum requirements\n📋 Major governance framework improvements needed\n🔍 Consider alternative partner or extensive remediation'
}

This report demonstrates aicomply.io's partner AI tool governance assessment at the boundary 
between regulated pharmaceutical operations and external partner systems.
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Partner_Governance_Assessment_${result.submissionId}.txt`;
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
            <span>Partner AI Tool Governance Assessment</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Live Demo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">Assess external partner AI tool governance before data sharing</p>
              <p className="text-sm text-muted-foreground">
                Experience automated partner governance assessment and boundary compliance verification
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partnerName">Partner Organization Name *</Label>
                <Input
                  id="partnerName"
                  placeholder="e.g., GlobalCRO Research Partners"
                  value={submission.partnerName}
                  onChange={(e) => handleSubmissionChange('partnerName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Partner Type *</Label>
                <Select
                  value={submission.partnerType}
                  onValueChange={(value) => handleSubmissionChange('partnerType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cro">Contract Research Organization (CRO)</SelectItem>
                    <SelectItem value="vendor">Technology Vendor</SelectItem>
                    <SelectItem value="consultant">Consulting Firm</SelectItem>
                    <SelectItem value="testing_lab">Testing Laboratory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractId">Partnership Contract ID *</Label>
                <Input
                  id="contractId"
                  placeholder="e.g., CRO-2024-001"
                  value={submission.contractId}
                  onChange={(e) => handleSubmissionChange('contractId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerToolName">Partner's AI Tool Name *</Label>
                <Input
                  id="partnerToolName"
                  placeholder="e.g., Clinical-Data-Analyzer-v3.2"
                  value={submission.partnerToolName}
                  onChange={(e) => handleSubmissionChange('partnerToolName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerToolVendor">Tool Vendor (Optional)</Label>
                <Input
                  id="partnerToolVendor"
                  placeholder="e.g., Partner's internal tool or third-party vendor"
                  value={submission.partnerToolVendor}
                  onChange={(e) => handleSubmissionChange('partnerToolVendor', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Partner's Tool Use Case *</Label>
                <Select
                  value={submission.partnerUseCase}
                  onValueChange={(value) => handleSubmissionChange('partnerUseCase', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How partner uses their AI tool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical-data-analysis">Clinical Trial Data Analysis</SelectItem>
                    <SelectItem value="trial-management">Trial Management & Monitoring</SelectItem>
                    <SelectItem value="safety-reporting">Pharmacovigilance & Safety Reporting</SelectItem>
                    <SelectItem value="document-processing">Regulatory Document Processing</SelectItem>
                    <SelectItem value="quality-control">Quality Control Testing</SelectItem>
                    <SelectItem value="manufacturing-analytics">Manufacturing Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Access Level *</Label>
                <Select
                  value={submission.dataAccessLevel}
                  onValueChange={(value) => handleSubmissionChange('dataAccessLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type of data partner will access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phi">Protected Health Information (PHI)</SelectItem>
                    <SelectItem value="clinical_trial">Clinical Trial Data</SelectItem>
                    <SelectItem value="regulatory">Regulatory Submission Documents</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing Process Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expected Data Volume</Label>
                <Select
                  value={submission.expectedDataVolume}
                  onValueChange={(value) => handleSubmissionChange('expectedDataVolume', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (&lt; 1 GB)</SelectItem>
                    <SelectItem value="medium">Medium (1-10 GB)</SelectItem>
                    <SelectItem value="large">Large (&gt; 10 GB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cross-Border Data Transfer</Label>
                <Select
                  value={submission.crossBorderTransfer ? 'yes' : 'no'}
                  onValueChange={(value) => handleSubmissionChange('crossBorderTransfer', value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Will data cross international borders?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No - Domestic only</SelectItem>
                    <SelectItem value="yes">Yes - International transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="governanceJustification">Partnership Governance Context</Label>
              <Textarea
                id="governanceJustification"
                placeholder="Describe the partnership context, data flows, and any specific governance requirements..."
                value={submission.governanceJustification}
                onChange={(e) => handleSubmissionChange('governanceJustification', e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isProcessing || !submission.partnerName || !submission.contractId || !submission.partnerToolName}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Assessing Partner Governance...' : 'Submit Governance Assessment'}
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
                  Running automated partner governance assessment and boundary compliance checks...
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
                  <Building className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{result.partnerName} - Governance Assessment</div>
                    <div className="text-sm text-muted-foreground">
                      Assessment ID: {result.submissionId} | Contract: {submission.contractId}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={
                  result.governanceStatus === 'compliant' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                  result.governanceStatus === 'requires_enhancement' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                  'text-red-600 bg-red-50 border-red-200'
                }>
                  {result.governanceStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Governance Maturity Score</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Overall Governance</span>
                      <span className="font-medium">{result.governanceScore}/100</span>
                    </div>
                    <Progress value={result.governanceScore} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {result.governanceScore >= 75 ? 'Mature Governance Framework' : 
                       result.governanceScore >= 55 ? 'Developing Governance Capabilities' : 
                       'Governance Enhancement Needed'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Partner Governance Assessment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Audit Trail Maturity</span>
                      <Badge variant="outline">{result.partnerAssessment.auditTrailMaturity}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Access Control Rating</span>
                      <span className="text-right">{result.partnerAssessment.accessControlRating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Handling</span>
                      <span className="text-right">{result.partnerAssessment.dataHandlingCompliance}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Governance Assessment Workflow</h4>
                <div className="space-y-3">
                  {result.governanceSteps.map((step) => (
                    <div key={step.id} className={`p-3 rounded-lg border ${getStatusColor(step.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(step.status)}
                          <span className="font-medium">{step.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {step.governanceFocus.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <Users className="w-3 h-3 inline mr-1" />
                          {step.assignee || 'Unassigned'}
                        </div>
                      </div>
                      <p className="text-sm mb-1">{step.description}</p>
                      <div className="flex justify-between text-xs">
                        <span>Est. Time: {step.estimatedTime}</span>
                        {step.details && <span className="text-muted-foreground">{step.details}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.partnerAssessment.governanceGaps.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Governance Gaps Identified:</h4>
                  <ul className="space-y-1 text-sm text-amber-800">
                    {result.partnerAssessment.governanceGaps.map((gap, index) => (
                      <li key={index}>• {gap}</li>
                    ))}
                  </ul>
                  <div className="mt-3 text-xs text-amber-700">
                    These gaps can be addressed through partnership governance alignment (typically 14-30 days).
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={downloadWorkflowReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Governance Report
                </Button>
                <Button size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Activate Partnership Monitoring
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="font-medium text-primary">Live Partner Governance Assessment Demo</div>
            <div className="text-sm text-muted-foreground mt-1">
              This demonstrates how we assess external partners' AI tool governance at the boundary 
              between your regulated pharmaceutical operations and their systems. We verify their 
              audit trails, access controls, and data handling policies—ensuring compliance before 
              any sensitive data is shared.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
