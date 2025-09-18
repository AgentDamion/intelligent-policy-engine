import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Badge, Alert } from '@/components/ui';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Clock,
  Users,
  Zap
} from 'lucide-react';

interface ComplianceScore {
  overall: number;
  categories: {
    dataSecurity: number;
    regulatoryCompliance: number;
    aiGovernance: number;
    auditTrail: number;
    riskManagement: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
  trends: {
    dataSecurity: 'up' | 'down' | 'stable';
    regulatoryCompliance: 'up' | 'down' | 'stable';
    aiGovernance: 'up' | 'down' | 'stable';
    auditTrail: 'up' | 'down' | 'stable';
    riskManagement: 'up' | 'down' | 'stable';
  };
}

interface ComplianceScoringProps {
  submissionId?: string;
  onScoreUpdate?: (score: ComplianceScore) => void;
  className?: string;
}

export function ComplianceScoring({ 
  submissionId, 
  onScoreUpdate,
  className = '' 
}: ComplianceScoringProps) {
  const [score, setScore] = useState<ComplianceScore>({
    overall: 0,
    categories: {
      dataSecurity: 0,
      regulatoryCompliance: 0,
      aiGovernance: 0,
      auditTrail: 0,
      riskManagement: 0
    },
    riskLevel: 'low',
    lastUpdated: new Date(),
    trends: {
      dataSecurity: 'stable',
      regulatoryCompliance: 'stable',
      aiGovernance: 'stable',
      auditTrail: 'stable',
      riskManagement: 'stable'
    }
  });
  const [isCalculating, setIsCalculating] = useState(false);

  const categories = [
    {
      id: 'dataSecurity',
      name: 'Data Security',
      description: 'Encryption, access controls, and data protection',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'regulatoryCompliance',
      name: 'Regulatory Compliance',
      description: 'FDA 21 CFR Part 11, HIPAA, GDPR alignment',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'aiGovernance',
      name: 'AI Governance',
      description: 'AI model validation and governance controls',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'auditTrail',
      name: 'Audit Trail',
      description: 'Complete audit logging and traceability',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'riskManagement',
      name: 'Risk Management',
      description: 'Risk assessment and mitigation controls',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  // Simulate compliance score calculation
  useEffect(() => {
    const calculateComplianceScore = async () => {
      setIsCalculating(true);
      
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockScore: ComplianceScore = {
        overall: Math.floor(Math.random() * 30) + 70, // 70-100
        categories: {
          dataSecurity: Math.floor(Math.random() * 20) + 80,
          regulatoryCompliance: Math.floor(Math.random() * 25) + 75,
          aiGovernance: Math.floor(Math.random() * 30) + 70,
          auditTrail: Math.floor(Math.random() * 15) + 85,
          riskManagement: Math.floor(Math.random() * 35) + 65
        },
        riskLevel: 'low',
        lastUpdated: new Date(),
        trends: {
          dataSecurity: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          regulatoryCompliance: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          aiGovernance: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          auditTrail: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          riskManagement: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any
        }
      };

      // Calculate overall score as weighted average
      const weights = {
        dataSecurity: 0.25,
        regulatoryCompliance: 0.25,
        aiGovernance: 0.20,
        auditTrail: 0.15,
        riskManagement: 0.15
      };

      mockScore.overall = Math.round(
        mockScore.categories.dataSecurity * weights.dataSecurity +
        mockScore.categories.regulatoryCompliance * weights.regulatoryCompliance +
        mockScore.categories.aiGovernance * weights.aiGovernance +
        mockScore.categories.auditTrail * weights.auditTrail +
        mockScore.categories.riskManagement * weights.riskManagement
      );

      // Determine risk level
      if (mockScore.overall >= 90) mockScore.riskLevel = 'low';
      else if (mockScore.overall >= 75) mockScore.riskLevel = 'medium';
      else if (mockScore.overall >= 60) mockScore.riskLevel = 'high';
      else mockScore.riskLevel = 'critical';

      setScore(mockScore);
      onScoreUpdate?.(mockScore);
      setIsCalculating(false);
    };

    calculateComplianceScore();
  }, [submissionId, onScoreUpdate]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Compliance Score</h3>
            <p className="text-sm text-gray-600">
              Last updated: {score.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getRiskColor(score.riskLevel)}>
              {score.riskLevel.toUpperCase()} RISK
            </Badge>
            <Button
              onClick={() => window.location.reload()}
              disabled={isCalculating}
              variant="outline"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculating...' : 'Recalculate'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(score.overall)} mb-2`}>
              {score.overall}
            </div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <Progress value={score.overall} className="h-2 mt-2" />
          </div>

          {/* Risk Level */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {score.riskLevel === 'low' ? '✓' : 
               score.riskLevel === 'medium' ? '⚠' : 
               score.riskLevel === 'high' ? '⚠' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Risk Level</div>
            <div className={`text-xs font-medium mt-1 ${
              score.riskLevel === 'low' ? 'text-green-600' :
              score.riskLevel === 'medium' ? 'text-yellow-600' :
              score.riskLevel === 'high' ? 'text-orange-600' : 'text-red-600'
            }`}>
              {score.riskLevel.toUpperCase()}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {score.overall >= 75 ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Compliance Status</div>
            <div className={`text-xs font-medium mt-1 ${
              score.overall >= 75 ? 'text-green-600' : 'text-red-600'
            }`}>
              {score.overall >= 75 ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </div>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryScore = score.categories[category.id as keyof typeof score.categories];
            const trend = score.trends[category.id as keyof typeof score.trends];
            const Icon = category.icon;
            
            return (
              <div key={category.id} className={`p-4 rounded-lg border ${category.borderColor} ${category.bgColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${category.color}`} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`text-lg font-bold ${getScoreColor(categoryScore)}`}>
                      {categoryScore}
                    </div>
                    {getTrendIcon(trend)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress value={categoryScore} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Score: {categoryScore}/100</span>
                    <span>Trend: {trend}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Compliance Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Recommendations</h3>
        <div className="space-y-3">
          {score.overall < 90 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  Improve Overall Compliance
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Focus on categories with scores below 85 to improve overall compliance rating.
                </p>
              </div>
            </Alert>
          )}
          
          {score.categories.dataSecurity < 85 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  Enhance Data Security
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Implement additional encryption layers and access controls.
                </p>
              </div>
            </Alert>
          )}
          
          {score.categories.regulatoryCompliance < 85 && (
            <Alert className="border-green-200 bg-green-50">
              <FileText className="h-4 w-4 text-green-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800">
                  Strengthen Regulatory Compliance
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Review FDA 21 CFR Part 11 and HIPAA compliance requirements.
                </p>
              </div>
            </Alert>
          )}
          
          {score.riskLevel === 'critical' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  Critical Risk Level
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  Immediate action required to address compliance gaps and reduce risk.
                </p>
              </div>
            </Alert>
          )}
        </div>
      </Card>

      {/* Compliance History */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance History</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  i === 0 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm text-gray-600">
                  {i === 0 ? 'Current' : `${i} day${i > 1 ? 's' : ''} ago`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {score.overall - (i * 2)}
                </span>
                <Badge className={
                  score.overall - (i * 2) >= 75 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-red-600 bg-red-50'
                }>
                  {score.overall - (i * 2) >= 75 ? 'Compliant' : 'Non-compliant'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}