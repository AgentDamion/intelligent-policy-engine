import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ToolSubmission, PrecheckResult, PolicyHint } from './types';
import { 
  createSubmission, 
  fetchSubmission, 
  saveSubmission, 
  submitSubmission, 
  precheck, 
  policyHints,
  trackSubmissionEvent
} from '@/services/tools.api';

export function useToolSubmission(initialId?: string) {
  const [id, setId] = useState<string | undefined>(initialId);
  const [data, setData] = useState<ToolSubmission | null>(null);
  const [analysis, setAnalysis] = useState<PrecheckResult | null>(null);
  const [hints, setHints] = useState<PolicyHint[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const draftTimer = useRef<number | undefined>();

  // Initialize submission
  useEffect(() => {
    (async () => {
      try {
        if (!initialId) {
          const { id: newId } = await createSubmission();
          setId(newId);
          const submission = await fetchSubmission(newId);
          setData(submission);
          trackSubmissionEvent('submit_started', { id: newId });
        } else {
          const submission = await fetchSubmission(initialId);
          setData(submission);
          setId(initialId);
        }
      } catch (e: any) { 
        setError(e.message || 'Failed to load submission'); 
      }
    })();
  }, [initialId]);

  // Autosave with debouncing
  const update = useCallback((patch: Partial<ToolSubmission>) => {
    if (!id) return;
    
    setData((currentData) => 
      currentData ? ({ ...currentData, ...patch }) as ToolSubmission : currentData
    );
    
    // Clear existing timer
    window.clearTimeout(draftTimer.current);
    
    // Set up new autosave
    draftTimer.current = window.setTimeout(async () => {
      try {
        setSaving(true);
        await saveSubmission(id, patch);
        setLastSaved(new Date());
        trackSubmissionEvent('draft_saved', { 
          patch: Object.keys(patch),
          id 
        });
      } catch (e: any) { 
        setError(e.message || 'Failed to save changes'); 
      } finally { 
        setSaving(false); 
      }
    }, 500);
  }, [id]);

  // Policy hints (refresh on category change)
  useEffect(() => {
    const category = data?.tool?.category;
    if (!category) { 
      setHints(null); 
      return; 
    }
    
    policyHints(category)
      .then(setHints)
      .catch(() => setHints([]));
  }, [data?.tool?.category]);

  // Meta-Loop pre-analysis
  const runPrecheck = useCallback(async () => {
    if (!data) return;
    
    try {
      setIsAnalyzing(true);
      const result = await precheck(data);
      setAnalysis(result);
      trackSubmissionEvent('precheck_run', { 
        confidence: result.confidence, 
        risks: result.risks.length,
        id 
      });
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [data, id]);

  // Validation and submission readiness
  const canSubmit = useMemo(() => {
    if (!data) return false;
    
    const tool = data.tool;
    const hasRequiredFields = Boolean(
      tool?.name && 
      tool?.vendor && 
      tool?.category
    );
    
    // Additional validation can be added here
    const hasAttestastion = data.attest === true;
    
    return hasRequiredFields && hasAttestastion;
  }, [data]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!data) return 0;
    
    const sections = [
      data.tool?.name && data.tool?.vendor && data.tool?.category, // Tool ID
      data.model?.type || data.model?.description, // Business Context
      data.purpose?.description, // Use Cases
      data.privacy?.dataTypes?.length, // Data Privacy
      data.evidence?.files?.length, // Evidence
      data.tech?.hosting, // Technical
      data.risk?.level, // Risk & Compliance
      data.vendor?.contact, // Vendor Assessment
      data.approval?.reviewers?.length, // Approval Chain
      data.attest, // Review & Submit
    ];
    
    const completed = sections.filter(Boolean).length;
    return Math.round((completed / sections.length) * 100);
  }, [data]);

  // Submit for review
  const submit = useCallback(async () => {
    if (!id || !canSubmit) return;
    
    try {
      await submitSubmission(id);
      trackSubmissionEvent('submit_completed', { id });
      return true;
    } catch (e: any) {
      setError(e.message || 'Submission failed');
      trackSubmissionEvent('submit_failed', { id, error: e.message });
      return false;
    }
  }, [id, canSubmit]);

  // Manual save (for save button)
  const save = useCallback(async () => {
    if (!id || !data) return;
    
    try {
      setSaving(true);
      await saveSubmission(id, data);
      setLastSaved(new Date());
      trackSubmissionEvent('manual_save', { id });
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [id, data]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    id,
    data,
    analysis,
    hints,
    saving,
    error,
    isAnalyzing,
    lastSaved,
    completionPercentage,
    
    // Actions
    update,
    save,
    runPrecheck,
    submit,
    clearError,
    
    // Computed
    canSubmit,
    
    // Setters (for manual control)
    setError,
    setAnalysis,
  };
}
