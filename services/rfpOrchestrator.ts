// services/rfpOrchestrator.ts (UI-side thin wrapper)
export async function orchestrateRfpAnswer({ question, workspaceId, enterpriseId }) {
  // Your existing agent-coordinator endpoint
  const res = await fetch("/api/agent-coordinator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "rfp_answer",
      payload: { question, workspaceId, enterpriseId }
    })
  });
  if (!res.ok) throw new Error("Coordinator error");
  return await res.json(); // { draft, evidenceRefs, eval: { score, gaps, breakdown }, suggestions }
}

// Enhanced orchestration with agent-specific calls
export async function useRFPAgentOrchestration({ question, workspaceId, enterpriseId, policyVersionId }) {
  try {
    // 1. Context Agent: classify the incoming distribution
    const contextResult = await fetch("/api/agent-coordinator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "context_analysis",
        payload: { 
          type: 'rfp_question', 
          policyVersionId, 
          questionId: question.id,
          content: question.question_text
        }
      })
    });
    const context = await contextResult.json();

    // 2. Knowledge Agent: retrieve relevant evidence
    const knowledgeResult = await fetch("/api/agent-coordinator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "knowledge_retrieval",
        payload: {
          questionId: question.id,
          workspaceId,
          clientScope: true,
          kbFilters: ['model_cards', 'attestations']
        }
      })
    });
    const knowledge = await knowledgeResult.json();

    // 3. Document Agent: generate answer draft
    const draftResult = await fetch("/api/agent-coordinator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "document_generation",
        payload: {
          question: question.question_text,
          context: knowledge.evidenceRefs,
          policyVersionId
        }
      })
    });
    const draft = await draftResult.json();

    // 4. Compliance Scoring Agent: evaluate the answer
    const scoringResult = await fetch("/api/agent-coordinator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "compliance_scoring",
        payload: {
          policyVersionId,
          answer: draft.content,
          evidence: knowledge.evidenceRefs
        }
      })
    });
    const evaluation = await scoringResult.json();

    // 5. Negotiation Agent: propose mitigations if gaps exist
    let suggestions = null;
    if (evaluation.hasCriticalGap) {
      const negotiationResult = await fetch("/api/agent-coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "negotiation_suggest",
          payload: {
            gap: evaluation.topGap,
            policyVersionId,
            currentAnswer: draft.content
          }
        })
      });
      suggestions = await negotiationResult.json();
    }

    // 6. Audit Agent: log the process
    await fetch("/api/agent-coordinator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "audit_log",
        payload: {
          event: 'rfp.answer.drafted',
          questionId: question.id,
          score: evaluation.score,
          workspaceId
        }
      })
    });

    return {
      draft: draft.content,
      evidenceRefs: knowledge.evidenceRefs,
      evaluation: {
        score: evaluation.score,
        gaps: evaluation.gaps,
        breakdown: evaluation.breakdown
      },
      suggestions,
      context: context.analysis
    };

  } catch (error) {
    console.error("RFP Orchestration error:", error);
    throw new Error(`Agent orchestration failed: ${error.message}`);
  }
}

// Client-side helper for parsing uploaded RFI documents
export async function parseRFIDocument(file, workspaceId, distributionId = null) {
  const file_b64 = await toBase64(file); // read as base64
  
  const { data, error } = await supabase.functions.invoke('rfi_document_parser', {
    body: { 
      file_b64, 
      file_mime: file.type, 
      workspace_id: workspaceId, 
      distribution_id: distributionId 
    }
  });

  if (error) throw error;
  return data;
}

// Client-side helper for scoring RFP responses
export async function scoreRFPResponse(submissionId) {
  const { data, error } = await supabase.functions.invoke('rfp_score_response', {
    body: { submission_id: submissionId }
  });

  if (error) throw error;
  return data;
}

// Client-side helper for urgency badges
export async function getRFPBadges(workspaceId) {
  const { data, error } = await supabase.rpc('rpc_get_rfp_badges', { 
    workspace: workspaceId 
  });

  if (error) throw error;
  return data[0]; // RPC returns array, we want the first (and only) result
}

// Client-side helper for autosave with versioning
export async function saveRFPResponseDraft(submissionId, payload, currentVersion) {
  const { data, error } = await supabase.rpc('bump_draft_version', {
    submission_id: submissionId,
    new_payload: payload,
    if_match_version: currentVersion
  });

  if (error) {
    if (error.message.includes('version_conflict')) {
      throw new Error('VERSION_CONFLICT');
    }
    throw error;
  }
  return data;
}

// Utility function to convert file to base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:type;base64, prefix
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}