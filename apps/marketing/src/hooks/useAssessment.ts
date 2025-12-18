import { useState } from 'react';
import { useUnifiedAPI } from './useUnifiedAPI';
import { toast } from 'sonner';

export interface AssessmentProgress {
  email: string;
  current_step: number;
  answers: Record<string, number>;
  evidence: Record<string, string>;
  organization_data: {
    organizationName: string;
    organizationSize: string;
    userType: 'enterprise' | 'agency';
  };
}

export function useAssessment() {
  const { makeRequest } = useUnifiedAPI();
  const [loading, setLoading] = useState(false);

  const saveProgress = async (progressData: AssessmentProgress) => {
    setLoading(true);
    try {
      const result = await makeRequest('/api/assessments/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });
      
      toast.success('Progress saved! Check your email for the resume link.');
      return result;
    } catch (error) {
      toast.error('Failed to save progress. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (token: string) => {
    try {
      return await makeRequest(`/api/assessments/progress/${token}`);
    } catch (error) {
      toast.error('Failed to load saved progress');
      throw error;
    }
  };

  const submitAssessment = async (assessmentData: any) => {
    setLoading(true);
    try {
      return await makeRequest('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
      });
    } catch (error) {
      toast.error('Failed to submit assessment. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveProgress,
    loadProgress,
    submitAssessment,
    loading
  };
}