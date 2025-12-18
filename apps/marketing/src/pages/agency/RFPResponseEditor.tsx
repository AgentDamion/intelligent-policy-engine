import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRFPAgentOrchestration } from '@/hooks/useRFPAgentOrchestration';
import { RFPSubmissionManager } from '@/services/rfpSubmissionManager';
import { AgentActivityCard } from '@/components/agency/AgentActivityCard';
import { EvidenceManager } from '@/components/agency/EvidenceManager';
import { RFPBreadcrumb } from '@/components/agency/RFPBreadcrumb';
import { KeyboardShortcutsHelp } from '@/components/agency/KeyboardShortcutsHelp';
import { Sparkles, Save, Send, ChevronLeft, ChevronRight, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { telemetry } from '@/utils/telemetry';
import { routes } from '@/lib/routes';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyWorkspace } from '@/hooks/useAgencyWorkspace';

// Debounce utility
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

const RFPResponseEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspace } = useAgencyWorkspace();

  const [submission, setSubmission] = useState<any>(null);
  const [policyVersion, setPolicyVersion] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const {
    agentActivities,
    currentAnswer,
    complianceScore,
    complianceBreakdown,
    evidenceSuggestions,
    complianceGaps,
    improvements,
    isGenerating,
    generateAnswer,
    setCurrentAnswer,
  } = useRFPAgentOrchestration();

  const [localAnswer, setLocalAnswer] = useState('');
  const [localEvidence, setLocalEvidence] = useState<any[]>([]);

  // Access control check
  const { data: accessCheck, isLoading: accessLoading } = useQuery({
    queryKey: ['rfp-access', id, workspace?.id],
    queryFn: async () => {
      if (!workspace?.id || !id || id === 'new') return true;
      
      // Verify access to this submission
      const { data, error } = await supabase
        .from('submissions')
        .select('id, workspace_id')
        .eq('id', id)
        .eq('workspace_id', workspace.id)
        .single();
        
      if (error || !data) return false;
      return true;
    },
    enabled: !!workspace?.id && !!id,
  });

  // Debounced auto-save
  const saveDraft = useDebouncedCallback(async (payload: any) => {
    if (!submission?.id) return;
    
    try {
      // Save to localStorage first for instant restore
      localStorage.setItem(`rfp-draft:${submission.id}`, JSON.stringify({
        ...payload,
        timestamp: Date.now(),
        questionIndex: currentQuestionIndex
      }));
      
      // Save to server
      await RFPSubmissionManager.saveDraftPayload(submission.id, payload);
      
      console.log('✅ Draft saved (local + server)');
    } catch (error) {
      console.error('❌ Draft save failed:', error);
      toast({
        title: 'Auto-save failed',
        description: 'Your draft is saved locally but not synced to server',
        variant: 'destructive'
      });
    }
  }, 800);

  // Restore draft on mount
  useEffect(() => {
    if (!submission?.id) return;
    
    const localDraft = localStorage.getItem(`rfp-draft:${submission.id}`);
    if (localDraft) {
      const parsed = JSON.parse(localDraft);
      const age = Date.now() - parsed.timestamp;
      
      if (age < 24 * 60 * 60 * 1000) { // Less than 24 hours old
        const currentQ = questions[parsed.questionIndex];
        if (currentQ) {
          const savedAnswer = parsed.answers?.find(
            (a: any) => a.question_id === currentQ.id
          );
          if (savedAnswer) {
            setLocalAnswer(savedAnswer.answer || '');
            setLocalEvidence(savedAnswer.evidence || []);
            setCurrentQuestionIndex(parsed.questionIndex || 0);
            
            toast({
              title: 'Draft restored',
              description: 'Your last session was recovered'
            });
          }
        }
      }
    }
  }, [submission?.id, questions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsHelp(true);
        return;
      }
      
      // Actions with modifier key
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            handlePrevQuestion();
            if (workspace?.id) {
              telemetry.rfpKeyboardShortcut('ctrl_arrow_left', currentQuestionIndex, workspace.id);
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            handleNextQuestion();
            if (workspace?.id) {
              telemetry.rfpKeyboardShortcut('ctrl_arrow_right', currentQuestionIndex, workspace.id);
            }
            break;
          case 's':
            e.preventDefault();
            handleSaveAnswer();
            if (workspace?.id) {
              telemetry.rfpKeyboardShortcut('ctrl_s', currentQuestionIndex, workspace.id);
            }
            break;
          case 'g':
            e.preventDefault();
            handleGenerateAnswer();
            if (workspace?.id) {
              telemetry.rfpKeyboardShortcut('ctrl_g', currentQuestionIndex, workspace.id);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, workspace?.id]);

  useEffect(() => {
    loadSubmission();
  }, [id]);

  useEffect(() => {
    if (currentAnswer) {
      setLocalAnswer(currentAnswer);
    }
  }, [currentAnswer]);

  useEffect(() => {
    if (evidenceSuggestions.length > 0) {
      setLocalEvidence(evidenceSuggestions);
    }
  }, [evidenceSuggestions]);

  const loadSubmission = async () => {
    try {
      setLoading(true);

      if (id === 'new') {
        const policyVersionId = searchParams.get('policy_version_id');
        if (!policyVersionId) {
          throw new Error('Missing policy version ID');
        }

        const workspaceId = 'YOUR_WORKSPACE_ID'; // TODO: Get from context
        const { submission: newSubmission, policyVersion: pv } = await RFPSubmissionManager.createDraftSubmission({
          policyVersionId,
          workspaceId,
        });

        setSubmission(newSubmission);
        setPolicyVersion(pv);
        const questions = pv.rfp_template_data?.questions || [];
        setQuestions(questions);
        navigate(`/agency/rfp-response/${newSubmission.id}`, { replace: true });
      } else {
        const data = await RFPSubmissionManager.loadDraftSubmission(id!);
        setSubmission(data);
        setPolicyVersion(data.policy_versions);
        const questions = data.policy_versions?.rfp_template_data?.questions || [];
        setQuestions(questions);

        // Load current answer if exists
        const currentQ = questions[currentQuestionIndex];
        if (currentQ) {
          const rfpData = typeof data.rfp_response_data === 'string'
            ? JSON.parse(data.rfp_response_data)
            : data.rfp_response_data;
          const savedAnswer = rfpData?.answers?.find(
            (a: any) => a.question_id === currentQ.id
          );
          if (savedAnswer) {
            setLocalAnswer(savedAnswer.answer || '');
            setLocalEvidence(savedAnswer.evidence || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to load RFP response',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnswer = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !workspace?.id) return;

    const startTime = Date.now();
    await generateAnswer({
      question: currentQ,
      partnerProfile: {},
      knowledgeBaseIds: [],
      workspaceId: submission.workspace_id,
      enterpriseId: policyVersion.policies.enterprise_id,
    });
    
    const duration = Date.now() - startTime;
    telemetry.rfpGenerateAnswer(currentQ.id, currentQuestionIndex, duration, workspace.id);
  };

  const handleSaveAnswer = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !workspace?.id) return;

    try {
      setSaving(true);
      await RFPSubmissionManager.saveAnswer(submission.id, currentQ.id, {
        answer: localAnswer,
        evidence: localEvidence,
        self_assessment_score: complianceScore,
        agent_metadata: {
          compliance_score: complianceScore,
          compliance_breakdown: complianceBreakdown,
          gaps: complianceGaps,
        },
      });

      telemetry.rfpSave(currentQ.id, localAnswer.length, localEvidence.length > 0, workspace.id);

      toast({
        title: 'Saved',
        description: 'Answer saved successfully',
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save answer',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!workspace?.id) return;
    
    try {
      setSubmitting(true);
      await RFPSubmissionManager.submitResponse(submission.id);
      
      const rfpData = typeof submission.rfp_response_data === 'string'
        ? JSON.parse(submission.rfp_response_data)
        : submission.rfp_response_data;
      const answeredCount = rfpData?.questions_answered || 0;
      const avgScore = complianceScore;
      
      telemetry.rfpSubmit(questions.length, answeredCount, avgScore, workspace.id);
      
      toast({
        title: 'Submitted',
        description: 'RFP response submitted successfully',
      });
      navigate(routes.agency.submissions);
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit response',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    handleSaveAnswer();
    setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevQuestion = () => {
    handleSaveAnswer();
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  };

  if (accessLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading RFP response editor...</div>
      </div>
    );
  }

  if (accessCheck === false) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have permission to view this RFP response.
            </p>
            <Button onClick={() => navigate(routes.agency.policyRequests)}>
              Back to Policy Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const questionsAnswered = submission?.rfp_response_data?.questions_answered || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b p-4 bg-background">
        <RFPBreadcrumb 
          clientName={policyVersion?.policies?.enterprises?.name || 'Unknown'}
          policyName={policyVersion?.policies?.title || 'Untitled'}
          policyVersion={policyVersion?.version_number?.toString() || '1'}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{policyVersion?.policies?.title}</h1>
            <p className="text-muted-foreground">
              From: {policyVersion?.policies?.enterprises?.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-2xl font-bold">
              {questionsAnswered} / {questions.length}
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Question Display */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge>{currentQ?.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
              <CardTitle className="text-lg mt-2">{currentQ?.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Requirement</h4>
                <p className="text-sm text-muted-foreground">{currentQ?.requirement}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Scoring Rubric</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Excellent:</span>
                    <span className="text-success">≥{currentQ?.scoring?.excellent?.threshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Good:</span>
                    <span>≥{currentQ?.scoring?.good?.threshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acceptable:</span>
                    <span>≥{currentQ?.scoring?.acceptable?.threshold}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Evidence Types</h4>
                <div className="flex flex-wrap gap-1">
                  {currentQ?.evidence_types?.map((type: string) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Weight:</span>
                <Badge variant="outline">{currentQ?.weight}%</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Agent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {agentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity yet. Click "Generate Answer" to start.
                </p>
              ) : (
                agentActivities.map(activity => (
                  <AgentActivityCard
                    key={activity.id}
                    agentName={activity.agent}
                    action={activity.action}
                    status={activity.status}
                    confidence={activity.confidence}
                    reasoning={activity.reasoning}
                    metadata={activity.metadata}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel: Answer Editor */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Answer</CardTitle>
                <Button
                  onClick={handleGenerateAnswer}
                  disabled={isGenerating}
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Answer'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={localAnswer}
                onChange={(e) => setLocalAnswer(e.target.value)}
                placeholder="Type your answer or generate one using AI..."
                className="min-h-[300px] resize-none"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {localAnswer.length} characters
                </span>
                <Button
                  onClick={handleSaveAnswer}
                  disabled={saving || !localAnswer.trim()}
                  size="sm"
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <EvidenceManager
            evidence={localEvidence}
            onChange={setLocalEvidence}
            suggestedTypes={currentQ?.evidence_types || []}
            workspaceId={workspace?.id || ''}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || questionsAnswered < questions.length}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="flex-1">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel: Compliance Feedback */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {complianceScore > 0 ? (
                <>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {complianceScore}%
                    </div>
                    <Badge
                      variant={complianceScore >= 80 ? 'default' : complianceScore >= 60 ? 'outline' : 'destructive'}
                    >
                      {complianceScore >= 80 ? 'Excellent' : complianceScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>

                  {complianceBreakdown && Object.keys(complianceBreakdown).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Category Breakdown</h4>
                      {Object.entries(complianceBreakdown).map(([category, score]) => (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span className="font-medium">{score as number}%</span>
                          </div>
                          <Progress value={score as number} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Generate an answer to see compliance score
                </p>
              )}
            </CardContent>
          </Card>

          {complianceGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gap Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {complianceGaps.map((gap, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">{gap.category}</div>
                        <div className="text-sm">{gap.missing_element}</div>
                        <div className="text-xs text-muted-foreground">{gap.suggestion}</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {improvements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp 
        open={showShortcutsHelp}
        onOpenChange={setShowShortcutsHelp}
      />
    </div>
  );
};

export default RFPResponseEditor;
