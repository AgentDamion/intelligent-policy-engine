import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Send, ArrowLeft, FileText, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Question {
  id: string;
  section: string;
  question_number: number;
  question_text: string;
  question_type: string;
  required_evidence: string[];
  is_mandatory: boolean;
}

interface Answer {
  question_id: string;
  answer: string;
  evidence: Array<{
    type: string;
    description: string;
    file_url?: string;
  }>;
}

export default function RFPResponseEditorPage() {
  const { distributionId } = useParams<{ distributionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const [distribution, setDistribution] = useState<any>(null);

  useEffect(() => {
    loadRFPData();
  }, [distributionId]);

  // Autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        handleSaveDraft(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [answers, draftVersion]);

  const loadRFPData = async () => {
    try {
      setLoading(true);

      // Load distribution details
      const { data: distData, error: distError } = await supabase
        .from('policy_distributions')
        .select('*, policy_versions(*, policies(*))')
        .eq('id', distributionId)
        .single();

      if (distError) throw distError;
      setDistribution(distData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('rfp_question_library')
        .select('*')
        .eq('distribution_id', distributionId)
        .order('section', { ascending: true })
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Load or create submission
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: workspaceData } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (!workspaceData) throw new Error('No workspace found');

      // Check for existing submission
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('*')
        .eq('policy_version_id', distData.policy_version_id)
        .eq('workspace_id', workspaceData.workspace_id)
        .eq('submission_type', 'rfp_response')
        .maybeSingle();

      if (existingSubmission) {
        setSubmissionId(existingSubmission.id);
        const rfpData = existingSubmission.rfp_response_data as any;
        const savedAnswers = rfpData?.answers || [];
        const answersMap: Record<string, Answer> = {};
        savedAnswers.forEach((ans: Answer) => {
          answersMap[ans.question_id] = ans;
        });
        setAnswers(answersMap);
        setDraftVersion(rfpData?.draft_version || 0);
      } else {
        // Create new submission
        const { data: newSubmission, error: subError } = await supabase
          .from('submissions')
          .insert([{
            policy_version_id: distData.policy_version_id,
            workspace_id: workspaceData.workspace_id,
            title: `RFP Response - ${(distData as any).metadata?.source_file || 'Document'}`,
            submission_type: 'rfp_response',
            status: 'draft',
            rfp_response_data: {
              answers: [],
              draft_version: 0,
              total_questions: questionsData?.length || 0
            } as any
          }])
          .select()
          .single();

        if (subError) throw subError;
        setSubmissionId(newSubmission.id);
      }
    } catch (error: any) {
      console.error('Error loading RFP data:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        answer,
        evidence: prev[questionId]?.evidence || []
      }
    }));
  };

  const handleSaveDraft = async (isAutosave = false) => {
    if (!submissionId) return;

    try {
      setSaving(true);

      const answersArray = Object.values(answers);
      const responseData = {
        answers: answersArray,
        total_questions: questions.length,
        metadata: {
          last_saved: new Date().toISOString(),
          progress: Math.round((answersArray.length / questions.length) * 100)
        }
      };

      const { data, error } = await supabase.rpc('bump_draft_version', {
        p_submission_id: submissionId,
        p_expected_version: draftVersion,
        p_new_data: responseData as any
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        if (result.conflict_detected) {
          toast({
            title: "Conflict Detected",
            description: "Someone else modified this response. Please refresh.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(result.message);
      }

      setDraftVersion(result.new_version);

      if (!isAutosave) {
        toast({
          title: "Draft Saved",
          description: "Your progress has been saved successfully"
        });
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      if (!isAutosave) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionId) return;

    try {
      setSaving(true);

      // First save the draft
      await handleSaveDraft();

      // Then update submission status
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Response Submitted",
        description: "Your RFP response has been submitted successfully"
      });

      navigate('/agency/rfp-inbox');
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  const progress = Math.round((Object.keys(answers).length / questions.length) * 100) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/agency/rfp-inbox')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RFP Response</h1>
            <p className="text-muted-foreground mt-1">
              {(distribution as any)?.metadata?.source_file || 'RFP Document'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-2xl font-bold">{progress}%</div>
            </div>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {Object.keys(answers).length} / {questions.length} answered
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => handleSaveDraft()}
          disabled={saving}
          variant="outline"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || progress < 100}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Response
        </Button>
        {saving && (
          <span className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Autosaving...
          </span>
        )}
      </div>

      {/* Questions by Section */}
      <Tabs defaultValue={Object.keys(groupedQuestions)[0]} className="w-full">
        <TabsList className="mb-6">
          {Object.keys(groupedQuestions).map(section => (
            <TabsTrigger key={section} value={section}>
              {section}
              <Badge variant="secondary" className="ml-2">
                {groupedQuestions[section].filter(q => answers[q.id]?.answer).length} / {groupedQuestions[section].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
          <TabsContent key={section} value={section} className="space-y-6">
            {sectionQuestions.map((question) => (
              <Card key={question.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Question {question.question_number}
                        </span>
                        {question.is_mandatory && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <Label className="text-base font-semibold">
                        {question.question_text}
                      </Label>
                    </div>
                  </div>

                  {question.required_evidence.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Required Evidence:</strong> {question.required_evidence.join(', ')}
                    </div>
                  )}

                  <Textarea
                    value={answers[question.id]?.answer || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Enter your response here..."
                    className="min-h-[150px]"
                  />

                  <div className="text-xs text-muted-foreground">
                    {answers[question.id]?.answer?.length || 0} characters
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
