import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle, 
  FileText,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ASSESSMENT_CONFIG_V1 } from '@/config/assessment-config';

interface AssessmentAnswer {
  questionId: string;
  value: number;
  evidence?: string;
}

interface AssessmentQuestionnaireProps {
  onComplete: (answers: AssessmentAnswer[]) => void;
  className?: string;
}

const answerOptions = [
  { value: 0, label: 'Not Implemented', description: 'No current capability or process' },
  { value: 1, label: 'Basic', description: 'Initial or informal processes in place' },
  { value: 2, label: 'Developing', description: 'Structured processes with some gaps' },
  { value: 3, label: 'Advanced', description: 'Comprehensive implementation with monitoring' },
  { value: 4, label: 'Optimized', description: 'Fully mature with continuous improvement' }
];

export function AssessmentQuestionnaire({ onComplete, className }: AssessmentQuestionnaireProps) {
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [showEvidence, setShowEvidence] = useState<Record<string, boolean>>({});

  const domains = ASSESSMENT_CONFIG_V1.domains;
  const currentDomain = domains[currentDomainIndex];
  const currentQuestion = currentDomain.questions[currentQuestionIndex];
  const allQuestions = domains.flatMap(d => d.questions);
  const totalQuestions = allQuestions.length;
  const overallProgress = Math.round((answers.length / totalQuestions) * 100);

  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  const updateAnswer = (value: number, evidence?: string) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...filtered, { questionId: currentQuestion.id, value, evidence }];
    });
  };

  const toggleEvidence = (questionId: string) => {
    setShowEvidence(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const canProceed = currentAnswer !== undefined;

  const goToNext = () => {
    if (currentQuestionIndex < currentDomain.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentDomainIndex < domains.length - 1) {
      setCurrentDomainIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Assessment complete
      onComplete(answers);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentDomainIndex > 0) {
      setCurrentDomainIndex(prev => prev - 1);
      setCurrentQuestionIndex(domains[currentDomainIndex - 1].questions.length - 1);
    }
  };

  const isLastQuestion = currentDomainIndex === domains.length - 1 && 
                        currentQuestionIndex === currentDomain.questions.length - 1;

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">AI Readiness Assessment</h2>
                <p className="text-sm text-muted-foreground">
                  Domain {currentDomainIndex + 1} of {domains.length}: {currentDomain.name}
                </p>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {answers.length} / {totalQuestions} Complete
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Domain Progress */}
            <div className="flex gap-2">
              {domains.map((domain, index) => {
                const domainAnswers = answers.filter(a => 
                  domain.questions.some(q => q.id === a.questionId)
                );
                const domainProgress = (domainAnswers.length / domain.questions.length) * 100;
                
                return (
                  <div key={domain.id} className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1 truncate">
                      {domain.name}
                    </div>
                    <Progress 
                      value={domainProgress} 
                      className={cn(
                        'h-1.5',
                        index === currentDomainIndex && 'ring-2 ring-primary ring-offset-2'
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">
                  Question {currentQuestionIndex + 1} of {currentDomain.questions.length}
                </CardTitle>
                {currentDomain.isMustPass && (
                  <Badge variant="destructive" className="text-xs">
                    Must Pass
                  </Badge>
                )}
              </div>
              <p className="text-base text-foreground leading-relaxed">
                {currentQuestion.text}
              </p>
              {currentQuestion.helpText && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                  <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.helpText}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Answer Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Select your current state:</h4>
            <RadioGroup 
              value={currentAnswer?.value?.toString() || ''} 
              onValueChange={(value) => updateAnswer(parseInt(value), currentAnswer?.evidence)}
            >
              {answerOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem 
                    value={option.value.toString()} 
                    id={`option-${option.value}`}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={`option-${option.value}`} 
                    className="flex-1 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Evidence Section */}
          {currentAnswer && (
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleEvidence(currentQuestion.id)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {showEvidence[currentQuestion.id] ? 'Hide' : 'Add'} Supporting Evidence
                {currentAnswer.evidence && <CheckCircle className="h-4 w-4 text-success" />}
              </Button>

              {showEvidence[currentQuestion.id] && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Provide evidence or details (optional but improves accuracy):
                  </Label>
                  <Textarea
                    placeholder="Describe your current implementation, tools used, processes in place, or any relevant details..."
                    value={currentAnswer.evidence || ''}
                    onChange={(e) => updateAnswer(currentAnswer.value, e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Providing evidence can improve your assessment accuracy and recommendations.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentDomainIndex === 0 && currentQuestionIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} of {currentDomain.questions.length} in this domain
              </span>
              
              <Button
                onClick={goToNext}
                disabled={!canProceed}
                className="gap-2"
              >
                {isLastQuestion ? (
                  <>
                    Complete Assessment
                    <CheckCircle className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}