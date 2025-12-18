import { supabase } from '@/integrations/supabase/client';

interface TelemetryMetadata {
  [key: string]: any;
}

export const trackRFPEvent = async (
  event: string,
  metadata: TelemetryMetadata
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('audit_events').insert({
      event_type: `rfp_${event}`,
      user_id: user.id,
      workspace_id: metadata.workspace_id || null,
      enterprise_id: metadata.enterprise_id || null,
      details: {
        ...metadata,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
      },
    });
  } catch (error) {
    console.error('Telemetry tracking error:', error);
  }
};

// Convenience functions
export const telemetry = {
  rfpInboxOpen: (workspaceId: string) =>
    trackRFPEvent('inbox_open', { workspace_id: workspaceId }),
    
  rfpStartResponse: (distributionId: string, clientName: string, workspaceId: string) =>
    trackRFPEvent('start_response', { distribution_id: distributionId, client_name: clientName, workspace_id: workspaceId }),
    
  rfpGenerateAnswer: (questionId: string, questionIndex: number, durationMs: number, workspaceId: string) =>
    trackRFPEvent('generate_answer', { question_id: questionId, question_index: questionIndex, duration_ms: durationMs, workspace_id: workspaceId }),
    
  rfpSave: (questionId: string, answerLength: number, hasEvidence: boolean, workspaceId: string) =>
    trackRFPEvent('save', { question_id: questionId, answer_length: answerLength, has_evidence: hasEvidence, workspace_id: workspaceId }),
    
  rfpSubmit: (totalQuestions: number, answeredCount: number, avgScore: number, workspaceId: string) =>
    trackRFPEvent('submit', { total_questions: totalQuestions, answered_count: answeredCount, avg_score: avgScore, workspace_id: workspaceId }),
    
  rfpKeyboardShortcut: (shortcut: string, questionIndex: number, workspaceId: string) =>
    trackRFPEvent('keyboard_shortcut_used', { shortcut, question_index: questionIndex, workspace_id: workspaceId }),
};
