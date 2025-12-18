import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Shield, CheckCircle, AlertTriangle, Users, Building } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerGovernanceRequest {
  id: string;
  partnerName: string;
  partnerType: 'cro' | 'vendor' | 'consultant' | 'testing_lab';
  partnerToolName: string;
  partnerToolVendor: string;
  dataAccessLevel: 'phi' | 'clinical_trial' | 'regulatory' | 'manufacturing';
  partnerUseCase: string;
  contractId: string;
  governanceStatus: 'compliant' | 'requires_enhancement' | 'non_compliant';
  auditTrailScore: number;
  accessControlScore: number;
  dataResidencyCompliant: boolean;
  approvalTime: number;
}

export const PartnerToolGovernanceDemo: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerType, setPartnerType] = useState<string>('');
  const [contractId, setContractId] = useState<string>('');
  const [partnerToolName, setPartnerToolName] = useState<string>('');
  const [partnerToolVendor, setPartnerToolVendor] = useState<string>('');
  const [dataAccessLevel, setDataAccessLevel] = useState<string>('');
  const [partnerUseCase, setPartnerUseCase] = useState<string>('');
  const [crossBorderTransfer, setCrossBorderTransfer] = useState<boolean>(false);
  const [results, setResults] = useState<PartnerGovernanceRequest[]>([]);

  const partnerTypes = [
    { value: 'cro', label: 'Contract Research Organization (CRO)' },
    { value: 'vendor', label: 'Technology Vendor' },
    { value: 'consultant', label: 'Consulting Firm' },
    { value: 'testing_lab', label: 'Testing Laboratory' }
  ];

  const dataAccessLevels = [
    { value: 'phi', label: 'Protected Health Information (PHI)' },
    { value: 'clinical_trial', label: 'Clinical Trial Data' },
    { value: 'regulatory', label: 'Regulatory Submission Documents' },
    { value: 'manufacturing', label: 'Manufacturing Process Data' }
  ];

  const useCases = [
    'Clinical Trial Data Analysis',
    'Trial Management & Monitoring',
    'Pharmacovigilance & Safety Reporting',
    'Regulatory Document Processing',
    'Quality Control Testing',
    'Manufacturing Analytics'
  ];

  const simulateGovernanceAssessment = async () => {
    if (!partnerName || !partnerType || !contractId || !partnerToolName || !dataAccessLevel || !partnerUseCase) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const phases = [
        { phase: 'Validating partnership contract terms...', progress: 14 },
        { phase: 'Analyzing partner audit trail requirements...', progress: 28 },
        { phase: 'Checking partner access control policies...', progress: 42 },
        { phase: 'Reviewing data residency compliance...', progress: 56 },
        { phase: 'Assessing cross-organizational data flows...', progress: 70 },
        { phase: 'Evaluating partner policy alignment...', progress: 84 },
        { phase: 'Creating partnership governance report...', progress: 100 }
      ];

      for (const { phase, progress } of phases) {
        setCurrentPhase(phase);
        setProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const mockResult = generatePartnerGovernanceResult();
      setResults([mockResult]);
      
      setCurrentPhase('Complete');
      toast.success('Partner governance assessment complete!');

    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Assessment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePartnerGovernanceResult = (): PartnerGovernanceRequest => {
    const isHighRiskData = dataAccessLevel === 'phi' || dataAccessLevel === 'clinical_trial';
    const isCRO = partnerType === 'cro';
    
    let auditTrailScore = isCRO ? 75 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 25);
    let accessControlScore = isCRO ? 70 + Math.floor(Math.random() * 25) : 55 + Math.floor(Math.random() * 30);
    
    if (isHighRiskData) {
      auditTrailScore -= 10;
      accessControlScore -= 10;
    }

    const avgScore = (auditTrailScore + accessControlScore) / 2;
    let governanceStatus: 'compliant' | 'requires_enhancement' | 'non_compliant';
    if (avgScore >= 80) governanceStatus = 'compliant';
    else if (avgScore >= 60) governanceStatus = 'requires_enhancement';
    else governanceStatus = 'non_compliant';

    const approvalTime = governanceStatus === 'compliant' ? 12 : 
                        governanceStatus === 'requires_enhancement' ? 25 : 45;

    return {
      id: `PGR-${Date.now()}`,
      partnerName,
      partnerType: partnerType as any,
      partnerToolName,
      partnerToolVendor: partnerToolVendor || 'Partner Internal Tool',
      dataAccessLevel: dataAccessLevel as any,
      partnerUseCase,
      contractId,
      governanceStatus,
      auditTrailScore,
      accessControlScore,
      dataResidencyCompliant: Math.random() > 0.25,
      approvalTime
    };
  };

  const getGovernanceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'requires_enhancement':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'non_compliant':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <span>Partner AI Tool Governance Assessment</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Live Processing
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">Assess partner AI tool governance at the data boundary</p>
              <p className="text-sm text-muted-foreground">
                See how we verify external partners' AI tool compliance in minutes, not months
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Partner Organization Name *</label>
                <Input
                  placeholder="e.g., GlobalCRO Research Partners"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Partner Type *</label>
                <Select value={partnerType} onValueChange={setPartnerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner type" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Partnership Contract ID *</label>
                <Input
                  placeholder="e.g., CRO-2024-001"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Partner's AI Tool Name *</label>
                <Input
                  placeholder="e.g., Clinical-Data-Analyzer-v3.2"
                  value={partnerToolName}
                  onChange={(e) => setPartnerToolName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tool Vendor (Optional)</label>
                <Input
                  placeholder="e.g., Partner's internal tool or vendor name"
                  value={partnerToolVendor}
                  onChange={(e) => setPartnerToolVendor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Access Level *</label>
                <Select value={dataAccessLevel} onValueChange={setDataAccessLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type of data partner will access" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataAccessLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Partner's Tool Use Case *</label>
                <Select value={partnerUseCase} onValueChange={setPartnerUseCase}>
                  <SelectTrigger>
                    <SelectValue placeholder="How partner uses their AI tool" />
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
                <label className="text-sm font-medium">Cross-Border Data Transfer</label>
                <Select 
                  value={crossBorderTransfer ? 'yes' : 'no'} 
                  onValueChange={(value) => setCrossBorderTransfer(value === 'yes')}
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

            <Button
              onClick={simulateGovernanceAssessment}
              disabled={isProcessing || !partnerName || !partnerType || !contractId || !partnerToolName || !dataAccessLevel || !partnerUseCase}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Analyzing Partner Governance...' : 'Assess Partner Compliance'}
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
                  Running automated partner governance checks at the data boundary...
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Partner Governance Assessment Results</h3>
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
                      <Building className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{result.partnerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.partnerType.toUpperCase()} | Contract: {result.contractId}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getGovernanceStatusColor(result.governanceStatus)}>
                      {result.governanceStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Partner's AI Tool</div>
                      <div className="text-sm text-muted-foreground">{result.partnerToolName}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Data Access Level</div>
                      <div className="text-sm text-muted-foreground">{result.dataAccessLevel.replace('_', ' ').toUpperCase()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Partner Use Case</div>
                      <div className="text-sm text-muted-foreground">{result.partnerUseCase}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="font-medium">Governance Assessment:</div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Partner Audit Trail Maturity</span>
                        <span className="font-medium">{result.auditTrailScore}/100</span>
                      </div>
                      <Progress value={result.auditTrailScore} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Partner Access Control Policies</span>
                        <span className="font-medium">{result.accessControlScore}/100</span>
                      </div>
                      <Progress value={result.accessControlScore} className="h-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      result.auditTrailScore >= 75 ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}>
                      <CheckCircle className={`w-4 h-4 ${
                        result.auditTrailScore >= 75 ? 'text-emerald-600' : 'text-amber-600'
                      }`} />
                      <span className="text-sm">Audit Trail: {result.auditTrailScore >= 75 ? 'Comprehensive' : 'Needs Enhancement'}</span>
                    </div>
                    
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      result.accessControlScore >= 75 ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}>
                      <CheckCircle className={`w-4 h-4 ${
                        result.accessControlScore >= 75 ? 'text-emerald-600' : 'text-amber-600'
                      }`} />
                      <span className="text-sm">Access Controls: {result.accessControlScore >= 75 ? 'Strong' : 'Moderate'}</span>
                    </div>
                    
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      result.dataResidencyCompliant ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      <CheckCircle className={`w-4 h-4 ${
                        result.dataResidencyCompliant ? 'text-emerald-600' : 'text-red-600'
                      }`} />
                      <span className="text-sm">Data Residency: {result.dataResidencyCompliant ? 'Compliant' : 'Non-Compliant'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">FDA 21 CFR Part 11: Ready</span>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${
                    result.governanceStatus === 'compliant' ? 'bg-emerald-50 border-emerald-200' :
                    result.governanceStatus === 'requires_enhancement' ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Shield className={`w-5 h-5 mt-0.5 ${
                        result.governanceStatus === 'compliant' ? 'text-emerald-600' :
                        result.governanceStatus === 'requires_enhancement' ? 'text-amber-600' :
                        'text-red-600'
                      }`} />
                      <div>
                        <div className="font-medium mb-1">Partnership Governance Status:</div>
                        <div className="text-sm">
                          {result.governanceStatus === 'compliant' ? (
                            <>
                              ✅ Partner governance meets requirements<br/>
                              📋 Data sharing agreement ready<br/>
                              🔍 Continuous monitoring activated<br/>
                              ⏱️ Partnership activation: {result.approvalTime} days
                            </>
                          ) : result.governanceStatus === 'requires_enhancement' ? (
                            <>
                              ⚠️ Partner needs to enhance audit trail retention (3 years → 5 years)<br/>
                              📋 Enhanced access control policy required<br/>
                              🔍 Remediation plan: 14 days<br/>
                              ⏱️ Approval after enhancement: {result.approvalTime} days
                            </>
                          ) : (
                            <>
                              ❌ Partner governance does not meet minimum requirements<br/>
                              📋 Comprehensive governance overhaul needed<br/>
                              🔍 Alternative partner assessment recommended<br/>
                              ⏱️ Partnership not recommended
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      View Partnership Agreement
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Shield className="w-4 h-4 mr-2" />
                      Activate Governance Monitoring
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
            <div className="font-medium text-primary">Live Partner Governance Demo</div>
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
