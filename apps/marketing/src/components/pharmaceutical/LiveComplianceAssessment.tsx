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

export const LiveComplianceAssessment: React.FC = () => {
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
      id: 'ai_tools_count',
      question: 'How many AI tools are currently in your development pipeline?',
      options: [
        { text: '1-5 tools', score: 20 },
        { text: '6-15 tools', score: 40 },
        { text: '16-30 tools', score: 60 },
        { text: '30+ tools', score: 80 }
      ]
    },
    {
      id: 'governance_maturity',
      question: 'What is your current AI governance maturity level?',
      options: [
        { text: 'No formal governance', score: 10 },
        { text: 'Basic policies in place', score: 30 },
        { text: 'Structured governance program', score: 60 },
        { text: 'Advanced AI governance with automation', score: 90 }
      ]
    },
    {
      id: 'regulatory_readiness',
      question: 'How ready are you for FDA AI compliance audits?',
      options: [
        { text: 'Not prepared at all', score: 5 },
        { text: 'Some documentation exists', score: 25 },
        { text: 'Most requirements covered', score: 65 },
        { text: 'Audit-ready with complete documentation', score: 95 }
      ]
    },
    {
      id: 'partner_complexity',
      question: 'How many external partners/vendors use AI in your projects?',
      options: [
        { text: '1-3 partners', score: 15 },
        { text: '4-8 partners', score: 35 },
        { text: '9-15 partners', score: 55 },
        { text: '15+ partners', score: 75 }
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
        user_id: null, // Will be handled by assessment API
        organization_name: assessmentData.organizationName,
        organization_size: assessmentData.organizationSize,
        organization_type: assessmentData.userType,
        composite_score: score,
        confidence: 0.85,
        band: getBand(score),
        answers: assessmentData.answers,
        evidence: {},
        domain_breakdown: [
          { domain: 'AI Governance', score: assessmentData.answers.governance_maturity || 0 },
          { domain: 'Regulatory Readiness', score: assessmentData.answers.regulatory_readiness || 0 },
          { domain: 'Partnership Management', score: assessmentData.answers.partner_complexity || 0 },
          { domain: 'Tool Portfolio', score: assessmentData.answers.ai_tools_count || 0 }
        ],
        must_pass_gates: {
          governance_framework: score > 50,
          audit_readiness: score > 60,
          partner_management: score > 40
        },
        recommendations: generateRecommendations(score),
        metadata: {
          assessment_type: 'live_pharmaceutical_demo',
          source: 'pharmaceutical_industry_page'
        }
      };

      const response = await submitAssessment(assessmentPayload);
      setResult({ ...response, score });
      setCurrentStep(2);
      toast.success('Assessment completed! Your personalized report is ready.');
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
    
    if (score < 60) {
      recommendations.push({
        title: 'Establish AI Governance Framework',
        priority: 'high',
        description: 'Implement formal AI governance policies and procedures'
      });
    }
    
    if (score < 70) {
      recommendations.push({
        title: 'Enhance Regulatory Documentation',
        priority: 'medium',
        description: 'Create comprehensive audit trails and compliance documentation'
      });
    }
    
    recommendations.push({
      title: 'Automate Compliance Monitoring',
      priority: 'low',
      description: 'Implement real-time monitoring and automated compliance checking'
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
        <h3 className="text-2xl font-bold mb-2">Live FDA AI Compliance Assessment</h3>
        <p className="text-muted-foreground">Get your personalized compliance score in 3 minutes</p>
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
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-blue-600';
      if (score >= 40) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getStatusIcon = (score: number) => {
      if (score >= 80) return <CheckCircle className="w-6 h-6 text-green-600" />;
      if (score >= 60) return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
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
            <h3 className="text-2xl font-bold">Your FDA AI Compliance Score</h3>
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
          <span>Live Compliance Assessment</span>
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