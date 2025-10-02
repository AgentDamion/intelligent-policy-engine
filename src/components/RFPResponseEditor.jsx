/**
 * RFP Response Editor Component
 * 
 * Demonstrates the agentic RFP/RFI integration with the existing agent layer.
 * This component shows how to use the orchestration hook for RFP processing.
 */

import React, { useState, useEffect } from 'react';
import useRFPAgentOrchestration from '../hooks/useRFPAgentOrchestration';

const RFPResponseEditor = ({ 
  distributionId, 
  workspaceId, 
  enterpriseId, 
  policyVersionId 
}) => {
  const {
    loading,
    error,
    orchestrateRfpAnswer,
    saveDraft,
    getSubmissionProgress,
    clearError
  } = useRFPAgentOrchestration();

  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentVersion, setCurrentVersion] = useState(0);
  const [progress, setProgress] = useState(null);

  // Load questions and progress on mount
  useEffect(() => {
    loadQuestions();
    loadProgress();
  }, [distributionId]);

  const loadQuestions = async () => {
    try {
      // This would load questions from rfp_question_library
      // For demo purposes, using mock data
      setQuestions([
        {
          id: 'q1',
          section: 'Governance',
          question_number: 1,
          question_text: 'Describe your audit trail for AI operations.',
          question_type: 'free_text',
          required_evidence: [{ type: 'document', hint: 'Audit trail sample' }],
          is_mandatory: true
        },
        {
          id: 'q2',
          section: 'Security',
          question_number: 2,
          question_text: 'Provide SOC 2 (latest report).',
          question_type: 'free_text',
          required_evidence: [{ type: 'attachment', hint: 'SOC2 Type II PDF' }],
          is_mandatory: true
        }
      ]);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const loadProgress = async () => {
    try {
      const progressData = await getSubmissionProgress({ distributionId });
      setProgress(progressData);
      setCurrentVersion(progressData?.draft_version || 0);
      
      // Load existing responses if any
      if (progressData?.submission_id) {
        // This would load existing responses from the submission
        // For demo purposes, using empty state
        setResponses({});
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  const generateAnswer = async (question) => {
    try {
      clearError();
      
      const result = await orchestrateRfpAnswer({
        question,
        workspaceId,
        enterpriseId,
        policyVersionId
      });

      // Update the response with the generated answer
      setResponses(prev => ({
        ...prev,
        [question.id]: {
          answer: result.draft,
          evidenceRefs: result.evidenceRefs,
          evaluation: result.eval,
          suggestions: result.suggestions,
          lastGenerated: new Date().toISOString()
        }
      }));

      // Auto-save the updated response
      await saveResponse();

    } catch (err) {
      console.error('Failed to generate answer:', err);
    }
  };

  const saveResponse = async () => {
    try {
      const payload = {
        responses,
        metadata: {
          lastSaved: new Date().toISOString(),
          version: currentVersion + 1
        }
      };

      await saveDraft({
        submissionId: progress?.submission_id,
        payload,
        currentVersion
      });

      setCurrentVersion(prev => prev + 1);
      
    } catch (err) {
      if (err.message === 'VERSION_CONFLICT') {
        // Handle version conflict - prompt user to merge changes
        alert('Another user has made changes. Please refresh and try again.');
        loadProgress(); // Reload to get latest version
      } else {
        console.error('Failed to save response:', err);
      }
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer: value,
        lastModified: new Date().toISOString()
      }
    }));
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading RFP questions...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">RFP Response Editor</h1>
        {progress && (
          <div className="mt-2 text-sm text-gray-600">
            Progress: {progress.questions_answered || 0} of {progress.questions_total || 0} questions answered
            {progress.compliance_score && (
              <span className="ml-4">
                Compliance Score: <span className="font-semibold">{progress.compliance_score}%</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question) => {
          const response = responses[question.id];
          
          return (
            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      {question.section} - Question {question.question_number}
                    </span>
                    {question.is_mandatory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-lg font-medium text-gray-900">
                    {question.question_text}
                  </h3>
                </div>
                
                {/* Generate Answer Button */}
                <button
                  onClick={() => generateAnswer(question)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Answer
                    </>
                  )}
                </button>
              </div>

              {/* Response Textarea */}
              <textarea
                value={response?.answer || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                placeholder="Your response will appear here after clicking 'Generate Answer' or you can type your own response..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Evidence References */}
              {response?.evidenceRefs && response.evidenceRefs.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Evidence References:</h4>
                  <div className="space-y-2">
                    {response.evidenceRefs.map((ref, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{ref.title}</span>
                        <span className="text-gray-400">({ref.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Results */}
              {response?.evaluation && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Compliance Evaluation</h4>
                    <span className={`text-sm font-semibold ${
                      response.evaluation.score >= 80 ? 'text-green-600' : 
                      response.evaluation.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {response.evaluation.score}%
                    </span>
                  </div>
                  
                  {response.evaluation.gaps && response.evaluation.gaps.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-xs font-medium text-gray-600 mb-1">Gaps Identified:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {response.evaluation.gaps.map((gap, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-red-500">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {response.suggestions && (
                    <div className="mt-2">
                      <h5 className="text-xs font-medium text-gray-600 mb-1">Suggestions:</h5>
                      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                        {response.suggestions}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Generated Timestamp */}
              {response?.lastGenerated && (
                <div className="mt-2 text-xs text-gray-400">
                  Generated: {new Date(response.lastGenerated).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={saveResponse}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Draft
        </button>
      </div>
    </div>
  );
};

export default RFPResponseEditor;