import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Bot, Shield, CheckCircle, AlertTriangle, XCircle, Clock, Users, Building } from 'lucide-react';
import { toast } from 'sonner';

interface ToolRequest {
  id: string;
  toolName: string;
  vendor: string;
  requestedBy: string;
  useCase: string;
  riskLevel: 'low' | 'medium' | 'high';
  complianceStatus: 'approved' | 'under_review' | 'rejected';
  fdaClassification: string;
  approvalTime: number;
}

export const AIToolApprovalDemo: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [useCase, setUseCase] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>('');
  const [results, setResults] = useState<ToolRequest[]>([]);

  const availableTools = [
    { id: 'claude-3', name: 'Anthropic Claude 3.5', vendor: 'Anthropic', category: 'LLM' },
    { id: 'chatgpt-enterprise', name: 'ChatGPT Enterprise', vendor: 'OpenAI', category: 'LLM' },
    { id: 'midjourney', name: 'Midjourney', vendor: 'Midjourney Inc.', category: 'Image Generation' },
    { id: 'github-copilot', name: 'GitHub Copilot', vendor: 'Microsoft', category: 'Code Generation' },
    { id: 'jasper-ai', name: 'Jasper AI', vendor: 'Jasper AI Inc.', category: 'Content Creation' },
    { id: 'veeva-vault', name: 'Veeva Vault PromoMats', vendor: 'Veeva Systems', category: 'Content Management' }
  ];

  const useCases = [
    'Clinical Protocol Writing',
    'Regulatory Submission Documents',
    'Medical Writing Support',
    'Clinical Data Analysis',
    'Marketing Material Creation',
    'Pharmacovigilance Reports',
    'Statistical Analysis',
    'Literature Review Assistance'
  ];

  const simulateApprovalProcess = async () => {
    if (!selectedTool || !useCase || !requestedBy) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const selectedToolData = availableTools.find(t => t.id === selectedTool);
    if (!selectedToolData) return;

    try {
      const phases = [
        { phase: 'Scanning vendor security certifications...', progress: 15 },
        { phase: 'Checking FDA classification requirements...', progress: 30 },
        { phase: 'Analyzing 21 CFR Part 11 compliance...', progress: 50 },
        { phase: 'Reviewing existing approved tools...', progress: 70 },
        { phase: 'Generating compliance recommendation...', progress: 85 },
        { phase: 'Creating audit trail entry...', progress: 100 }
      ];

      for (const { phase, progress } of phases) {
        setCurrentPhase(phase);
        setProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Generate realistic approval results
      const mockResult = generateToolApprovalResult(selectedToolData, useCase, requestedBy);
      setResults([mockResult]);
      
      setCurrentPhase('Complete');
      toast.success('Tool approval analysis complete!');

    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateToolApprovalResult = (tool: any, useCase: string, requestedBy: string): ToolRequest => {
    // Determine risk level based on tool type and use case
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let complianceStatus: 'approved' | 'under_review' | 'rejected' = 'approved';
    let fdaClassification = 'Non-SaMD AI Tool';
    let approvalTime = 18; // days

    // Risk assessment logic
    if (tool.category === 'LLM' && useCase.includes('Clinical')) {
      riskLevel = 'high';
      fdaClassification = 'Class II Software as Medical Device';
      approvalTime = 25;
    } else if (tool.category === 'Image Generation') {
      riskLevel = 'medium';
      approvalTime = 15;
    } else if (tool.vendor === 'OpenAI' || tool.vendor === 'Anthropic') {
      riskLevel = useCase.includes('Regulatory') ? 'high' : 'medium';
      approvalTime = riskLevel === 'high' ? 22 : 12;
    }

    // Some tools might need review
    if (riskLevel === 'high' && !tool.id.includes('enterprise')) {
      complianceStatus = 'under_review';
      approvalTime = 35;
    }

    return {
      id: `approval-${Date.now()}`,
      toolName: tool.name,
      vendor: tool.vendor,
      requestedBy,
      useCase,
      riskLevel,
      complianceStatus,
      fdaClassification,
      approvalTime
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>AI Tool Approval Workflow Demo</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Live Processing
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">Submit a tool request to see real-time compliance analysis</p>
              <p className="text-sm text-muted-foreground">
                Experience how pharmaceutical teams get AI tools approved in minutes, not weeks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Tool Request</label>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTools.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4" />
                          <span>{tool.name}</span>
                          <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Intended Use Case</label>
                <Select value={useCase} onValueChange={setUseCase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select use case" />
                  </SelectTrigger>
                  <SelectContent>
                    {useCases.map((useCase) => (
                      <SelectItem key={useCase} value={useCase}>
                        {useCase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Requested By</label>
                <Input
                  placeholder="Team member name"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={simulateApprovalProcess}
              disabled={isProcessing || !selectedTool || !useCase || !requestedBy}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Analyzing Compliance...' : 'Submit Tool Request'}
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
                  Running automated FDA compliance checks...
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tool Approval Decision</h3>
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bot className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{result.toolName}</div>
                        <div className="text-sm text-muted-foreground">by {result.vendor}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.complianceStatus)}
                      <Badge variant="outline" className={getRiskColor(result.riskLevel)}>
                        {result.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Use Case</div>
                      <div className="text-sm text-muted-foreground">{result.useCase}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">FDA Classification</div>
                      <div className="text-sm text-muted-foreground">{result.fdaClassification}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Approval Timeline</div>
                      <div className="text-sm text-muted-foreground">{result.approvalTime} days</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="font-medium">Compliance Analysis:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">21 CFR Part 11 Compatible</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">SOC 2 Type II Certified</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">HIPAA Compliant</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm">Requires Usage Monitoring</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-900">Next Steps:</div>
                        <div className="text-sm text-blue-700 mt-1">
                          {result.complianceStatus === 'approved' ? (
                            <>
                              ✅ Tool approved for {result.useCase}<br/>
                              📋 Usage policy created and distributed<br/>
                              🔍 Monitoring dashboard activated
                            </>
                          ) : (
                            <>
                              ⏳ Additional security review required<br/>
                              📑 Vendor assessment in progress<br/>
                              📞 Risk committee meeting scheduled
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      View Policy
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Building className="w-4 h-4 mr-2" />
                      Add to Portfolio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="font-medium text-primary">Live AI Tool Governance Demo</div>
            <div className="text-sm text-muted-foreground mt-1">
              This demonstrates our real-time AI tool approval workflow. In production, this integrates 
              with your existing approval processes and provides complete vendor risk management 
              across your entire AI tool portfolio.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};