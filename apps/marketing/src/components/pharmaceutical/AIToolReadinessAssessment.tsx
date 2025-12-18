import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertTriangle, XCircle, Zap, ArrowRight } from 'lucide-react';
import { useAssessment } from '@/hooks/useAssessment';
import { toast } from 'sonner';

interface AssessmentData {
  email: string;
  organizationName: string;
  organizationSize: string;
  userType: 'enterprise' | 'agency';
  answers: Record<string, number>;
}

export const AIToolReadinessAssessment: React.FC = () => {
  const { submitAssessment, loading } = useAssessment();
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    email: '',
    organizationName: '',
    organizationSize: '',
    userType: 'enterprise',
    answers: {}
  });
  const [result, setResult] = useState<any>(null);

  const questions = [
    {
      id: 'ai_tools_inventory',
      question: 'How many AI tools do you currently track across your organization?',
      options: [
        { text: 'No formal tracking (Shadow AI)', score: 10 },
        { text: '1-10 tools tracked', score: 30 },
        { text: '11-25 tools tracked', score: 60 },
        { text: 'Complete visibility (25+ tools)', score: 90 }
      ]
    },
    {
      id: 'approval_process',
      question: 'How long does your AI tool approval process typically take?',
      options: [
        { text: 'No formal process (teams use freely)', score: 5 },
        { text: '30+ days', score: 25 },
        { text: '10-30 days', score: 60 },
        { text: 'Under 10 days with automated workflow', score: 95 }
      ]
    },
    {
      id: 'vendor_risk_management',
      question: 'How do you assess AI vendor compliance and risk?',
      options: [
        { text: 'Manual review only', score: 15 },
        { text: 'Basic security questionnaires', score: 35 },
        { text: 'Structured risk assessment framework', score: 70 },
        { text: 'Automated vendor intelligence platform', score: 90 }
      ]
    },
    {
      id: 'audit_readiness',
      question: 'If audited today, could you provide complete AI tool usage records?',
      options: [
        { text: 'No audit trail exists', score: 5 },
        { text: 'Partial documentation', score: 30 },
        { text: 'Most usage documented', score: 65 },
        { text: 'Complete audit trail with decisions', score: 95 }
      ]
    }
  ];

  const handleOrgInfoSubmit = () => {
    if (!assessmentData.email || !assessmentData.organizationName || !assessmentData.organizationSize) {
      toast.error('Please fill in all organization details');
      return;
    }
    setCurrentStep(1);
  };

  const handleAnswerSelect = (questionId: string, score: number) => {
    setAssessmentData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: score }
    }));
  };

  const calculateScore = () => {
    const totalScore = Object.values(assessmentData.answers).reduce((sum, score) => sum + score, 0);
    const maxScore = questions.length * 95; // Max possible score
    return Math.round((totalScore / maxScore) * 100);
  };

  const handleSubmitAssessment = async () => {
    try {
      const score = calculateScore();
      const assessmentPayload = {
        user_id: null,
        organization_name: assessmentData.organizationName,
        organization_size: assessmentData.organizationSize,
        organization_type: assessmentData.userType,
        composite_score: score,
        confidence: 0.85,
        band: getBand(score),
        answers: assessmentData.answers,
        evidence: {},
        domain_breakdown: [
          { domain: 'Tool Inventory', score: assessmentData.answers.ai_tools_inventory || 0 },
          { domain: 'Approval Process', score: assessmentData.answers.approval_process || 0 },
          { domain: 'Vendor Risk', score: assessmentData.answers.vendor_risk_management || 0 },
          { domain: 'Audit Readiness', score: assessmentData.answers.audit_readiness || 0 }
        ],
        must_pass_gates: {
          tool_visibility: score > 40,
          approval_efficiency: score > 50,
          vendor_intelligence: score > 60
        },
        recommendations: generateRecommendations(score),
        metadata: {
          assessment_type: 'ai_tool_governance',
          source: 'pharmaceutical_industry_page'
        }
      };

      const response = await submitAssessment(assessmentPayload);
      setResult({ ...response, score });
      setCurrentStep(2);
      toast.success('Assessment completed! Your AI governance readiness report is ready.');
    } catch (error) {
      toast.error('Failed to submit assessment. Please try again.');
    }
  };

  const getBand = (score: number): string => {
    if (score >= 80) return 'Advanced';
    if (score >= 60) return 'Developing';
    if (score >= 40) return 'Basic';
    return 'Foundation';
  };

  const generateRecommendations = (score: number) => {
    const recommendations = [];
    
    if (score < 50) {
      recommendations.push({
        title: 'Implement AI Tool Discovery',
        priority: 'high',
        description: 'Establish comprehensive tracking of all AI tools in use'
      });
    }
    
    if (score < 70) {
      recommendations.push({
        title: 'Automate Approval Workflows',
        priority: 'medium',
        description: 'Streamline tool approval with automated vendor risk assessment'
      });
    }
    
    recommendations.push({
      title: 'Enable Real-time Governance',
      priority: 'low',
      description: 'Implement continuous monitoring and automated compliance checking'
    });

    return recommendations;
  };

  const renderOrgInfo = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">AI Tools Governance Readiness Assessment</h3>
        <p className="text-muted-foreground">Discover your organization's AI governance maturity in 3 minutes</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@company.com"
            value={assessmentData.email}
            onChange={(e) => setAssessmentData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">Organization Name</Label>
          <Input
            id="organization"
            placeholder="Your Organization"
            value={assessmentData.organizationName}
            onChange={(e) => setAssessmentData(prev => ({ ...prev, organizationName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Organization Size</Label>
          <Select
            value={assessmentData.organizationSize}
            onValueChange={(value) => setAssessmentData(prev => ({ ...prev, organizationSize: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select organization size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startup">Startup (1-50 employees)</SelectItem>
              <SelectItem value="small">Small (51-200 employees)</SelectItem>
              <SelectItem value="medium">Medium (201-1000 employees)</SelectItem>
              <SelectItem value="large">Large (1000+ employees)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Organization Type</Label>
          <Select
            value={assessmentData.userType}
            onValueChange={(value: 'enterprise' | 'agency') => setAssessmentData(prev => ({ ...prev, userType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enterprise">Pharmaceutical Company</SelectItem>
              <SelectItem value="agency">CRO / Marketing Agency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleOrgInfoSubmit} className="w-full" size="lg">
        Start Assessment
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );

  const renderQuestions = () => {
    const currentQuestion = questions[currentStep - 1];
    const questionIndex = currentStep - 1;
    const isLastQuestion = questionIndex === questions.length - 1;
    const progress = ((questionIndex + 1) / questions.length) * 100;

    return (
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {questionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, option.score)}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  assessmentData.answers[currentQuestion.id] === option.score
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  {assessmentData.answers[currentQuestion.id] === option.score && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {questionIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            
            <Button
              onClick={() => {
                if (isLastQuestion) {
                  handleSubmitAssessment();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
              disabled={!assessmentData.answers[currentQuestion.id] || loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : isLastQuestion ? 'Get My Score' : 'Next'}
              {!isLastQuestion && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderResults = () => {
    if (!result) return null;

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-emerald-600';
      if (score >= 60) return 'text-blue-600';
      if (score >= 40) return 'text-amber-600';
      return 'text-red-600';
    };

    const getStatusIcon = (score: number) => {
      if (score >= 80) return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      if (score >= 60) return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      return <XCircle className="w-6 h-6 text-red-600" />;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            {getStatusIcon(result.score)}
            <h3 className="text-2xl font-bold">Your AI Governance Readiness Score</h3>
          </div>
          
          <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}%
          </div>
          
          <Badge variant="secondary" className="px-4 py-2">
            {getBand(result.score)} Level
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {result.domain_breakdown?.map((domain: any, index: number) => (
            <div key={index} className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">{domain.domain}</div>
              <div className="text-lg font-bold">{domain.score}%</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Key Recommendations:</h4>
          {result.recommendations?.map((rec: any, index: number) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{rec.title}</span>
                <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => {
              setCurrentStep(0);
              setResult(null);
              setAssessmentData({
                email: '',
                organizationName: '',
                organizationSize: '',
                userType: 'enterprise',
                answers: {}
              });
            }}
            variant="outline"
            className="flex-1"
          >
            Take Again
          </Button>
          <Button className="flex-1">
            <Zap className="w-4 h-4 mr-2" />
            Get Full Report
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-primary" />
          <span>AI Tools Governance Assessment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep === 0 && renderOrgInfo()}
        {currentStep >= 1 && currentStep <= questions.length && renderQuestions()}
        {currentStep > questions.length && renderResults()}
      </CardContent>
    </Card>
  );
};