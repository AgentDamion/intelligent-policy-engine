import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { AssessmentStepper } from './AssessmentStepper';
import { LikertScale } from './LikertScale';
import { SaveResumeModal } from './SaveResumeModal';
import { useUnifiedAPI } from '@/hooks/useUnifiedAPI';
import { toast } from 'sonner';

interface AssessmentWizardProps {
  onComplete: (results: any) => void;
  onUserTypeSelect: (type: 'enterprise' | 'agency') => void;
  resumeToken?: string;
}

// Import from authoritative config
import { ASSESSMENT_CONFIG_V1 } from '@/config/assessment-config';
import { assessmentScoring, type AssessmentAnswer } from '@/services/assessment-scoring';

const assessmentDomains = ASSESSMENT_CONFIG_V1.domains;

export function AssessmentWizard({ onComplete, onUserTypeSelect, resumeToken }: AssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<'enterprise' | 'agency' | null>(null);
  const [orgInfo, setOrgInfo] = useState({
    organizationName: '',
    organizationSize: ''
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { makeRequest } = useUnifiedAPI();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Load saved progress on mount if resumeToken provided
  useEffect(() => {
    if (resumeToken) {
      loadProgress(resumeToken);
    }
  }, [resumeToken]);

  const loadProgress = async (token: string) => {
    try {
      const response = await fetch(`/api/assessments/progress/${token}`);
      if (response.ok) {
        const progressData = await response.json();
        setCurrentStep(progressData.current_step);
        setAnswers(progressData.answers || {});
        setEvidence(progressData.evidence || {});
        setOrgInfo(progressData.organization_data || {});
        if (progressData.organization_data?.userType) {
          setUserType(progressData.organization_data.userType);
          onUserTypeSelect(progressData.organization_data.userType);
        }
        toast.success('Progress loaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to load saved progress');
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUserTypeSelect = (type: 'enterprise' | 'agency') => {
    setUserType(type);
    onUserTypeSelect(type);
    handleNext();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Prepare assessment data for API
      const assessmentAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
        evidence: evidence[questionId] || ''
      }));

      const assessmentData = {
        answers: assessmentAnswers,
        organizationType: userType,
        organizationSize: orgInfo.organizationSize,
        organizationName: orgInfo.organizationName
      };

      // Submit to real API endpoint
      const result = await makeRequest('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData)
      });

      onComplete(result);
    } catch (error) {
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProgress = async (email: string) => {
    try {
      const progressData = {
        email,
        current_step: currentStep,
        answers,
        evidence,
        organization_data: {
          ...orgInfo,
          userType
        }
      };

      await makeRequest('/api/assessments/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      });
      
      toast.success('Progress saved! Check your email for the resume link.');
    } catch (error) {
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                What best describes your organization?
              </h3>
              <p className="text-muted-foreground">
                This helps us tailor the assessment and recommendations to your needs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
                onClick={() => handleUserTypeSelect('enterprise')}
              >
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">I'm an Enterprise</h4>
                  <p className="text-muted-foreground mb-4">
                    Looking for oversight and acceleration of internal AI initiatives
                  </p>
                  <Badge variant="outline">Governance & Compliance</Badge>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
                onClick={() => handleUserTypeSelect('agency')}
              >
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">I'm an Agency/Partner</h4>
                  <p className="text-muted-foreground mb-4">
                    Need to win RFPs and build trust with prospective clients
                  </p>
                  <Badge variant="outline">Trust & Credibility</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Tell us about your organization</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Organization Name</label>
                <input 
                  type="text" 
                  value={orgInfo.organizationName}
                  onChange={(e) => setOrgInfo(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-lg bg-background"
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Organization Size</label>
                <select 
                  value={orgInfo.organizationSize}
                  onChange={(e) => setOrgInfo(prev => ({ ...prev, organizationSize: e.target.value }))}
                  className="w-full p-3 border border-input rounded-lg bg-background"
                >
                  <option value="">Select organization size</option>
                  <option value="1-50">1-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Assessment Questions</h3>
              <p className="text-muted-foreground mb-6">
                Rate each statement based on your organization's current capabilities (0 = Not at all, 5 = Fully operational with evidence)
              </p>
            </div>
            
            {assessmentDomains.map((domain, domainIndex) => (
              <Card key={domainIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{domain.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {domain.questions.map((question, questionIndex) => {
                    const questionId = `${domainIndex}-${questionIndex}`;
                    return (
                      <LikertScale
                        key={questionId}
                        question={question.text}
                        helpText={question.helpText}
                        value={answers[questionId] || 0}
                        onChange={(value) => setAnswers(prev => ({ ...prev, [questionId]: value }))}
                        onEvidenceChange={(evidence) => setEvidence(prev => ({ ...prev, [questionId]: evidence }))}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Review & Submit</h3>
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Organization Type</h4>
                    <Badge variant="outline">{userType === 'enterprise' ? 'Enterprise' : 'Agency/Partner'}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Completion</h4>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round((Object.keys(answers).length / 12) * 100)}%
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Evidence Attached</h4>
                    <p className="text-2xl font-bold text-secondary">
                      {Object.keys(evidence).length}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <label className="flex items-start space-x-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-sm text-muted-foreground">
                      I understand that uploaded links should be redacted and non-sensitive.
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left Column - Stepper */}
        <div className="lg:col-span-1">
          <AssessmentStepper currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>AI Acceleration Assessment</CardTitle>
                <Badge variant="outline">{currentStep + 1} of {totalSteps}</Badge>
              </div>
              <Progress value={progress} className="mt-2" />
            </CardHeader>
            
            <CardContent className="min-h-[400px]">
              {renderStepContent()}
            </CardContent>
            
            <div className="px-6 py-4 border-t border-border flex justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                {currentStep > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowSaveModal(true)}
                    className="border-dashed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Progress
                  </Button>
                )}
              </div>
              
              <Button 
                onClick={handleNext}
                disabled={(currentStep === 0 && !userType) || isLoading}
                className="bg-brand-teal hover:bg-brand-teal/90"
              >
                {isLoading ? 'Processing...' : currentStep === totalSteps - 1 ? 'Submit Assessment' : 'Continue'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <SaveResumeModal 
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveProgress}
        answers={Object.values(answers)}
        currentStep={currentStep}
      />
    </div>
  );
}