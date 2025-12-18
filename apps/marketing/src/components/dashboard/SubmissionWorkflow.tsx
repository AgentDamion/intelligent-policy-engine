import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePolicyInbox } from '@/hooks/usePolicyInbox';
import { supabase } from '@/integrations/supabase/client';

interface SubmissionData {
  title: string;
  description: string;
  type: string;
  aiTools: string[];
  policies: number[];
  content?: string;
}

const SubmissionWorkflow: React.FC = () => {
  const { policyNotifications } = usePolicyInbox();
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    title: '',
    description: '',
    type: 'Marketing Campaign',
    aiTools: [],
    policies: [],
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availableAITools = ['ChatGPT', 'Claude', 'Midjourney', 'DALL-E', 'Jasper', 'Copy.ai'];
  const submissionTypes = ['Marketing Campaign', 'Social Media Content', 'Website Copy', 'Email Campaign', 'Video Script'];

  const activePolicies = policyNotifications
    .filter(notif => notif.policy.status === 'active')
    .map(notif => notif.policy);

  const calculateRiskScore = () => {
    let riskScore = 0;
    
    // Base risk from AI tools used
    riskScore += submissionData.aiTools.length * 0.1;
    
    // Risk reduction from policy compliance
    const applicablePolicies = activePolicies.filter(policy => 
      submissionData.policies.includes(policy.id)
    );
    riskScore -= applicablePolicies.length * 0.15;
    
    // Ensure risk score is between 0 and 1
    return Math.max(0, Math.min(1, riskScore));
  };

  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return 'Low';
    if (score <= 0.6) return 'Medium';
    return 'High';
  };

  const getRiskColor = (score: number) => {
    if (score <= 0.3) return 'text-green-600';
    if (score <= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAIToolToggle = (tool: string) => {
    setSubmissionData(prev => ({
      ...prev,
      aiTools: prev.aiTools.includes(tool)
        ? prev.aiTools.filter(t => t !== tool)
        : [...prev.aiTools, tool]
    }));
  };

  const handlePolicyToggle = (policyId: number) => {
    setSubmissionData(prev => ({
      ...prev,
      policies: prev.policies.includes(policyId)
        ? prev.policies.filter(id => id !== policyId)
        : [...prev.policies, policyId]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's workspace
      const { data: workspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!workspaces?.length) {
        throw new Error('User not associated with any workspace');
      }

      const workspaceId = workspaces[0].workspace_id;

      // Create submission in database
      const { data: submission, error } = await supabase
        .from('submissions')
        .insert({
          title: submissionData.title,
          description: submissionData.description,
          status: 'submitted',
          risk_score: Math.round(calculateRiskScore() * 100),
          workspace_id: workspaceId,
          policy_version_id: null // Will be set based on selected policies
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Submission created:', submission);
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setSubmissionData({
          title: '',
          description: '',
          type: 'Marketing Campaign',
          aiTools: [],
          policies: [],
          content: ''
        });
      }, 3000);
      
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = submissionData.title && submissionData.description && 
                   submissionData.aiTools.length > 0 && submissionData.policies.length > 0;

  const riskScore = calculateRiskScore();

  if (submitted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">Submission Successful!</h3>
          <p className="text-gray-600 mb-4">
            Your work has been submitted for enterprise review. You'll be notified once it's reviewed.
          </p>
          <Badge className="bg-blue-100 text-blue-800">
            Risk Score: {getRiskLevel(riskScore)} ({(riskScore * 100).toFixed(0)}%)
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Work for Review
        </CardTitle>
        <CardDescription>
          Submit your AI-assisted work to enterprise for compliance review
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Title *</label>
            <Input
              value={submissionData.title}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter project title"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Project Type *</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={submissionData.type}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, type: e.target.value }))}
            >
              {submissionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              value={submissionData.description}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project and how AI was used"
              rows={3}
            />
          </div>
        </div>

        {/* AI Tools Used */}
        <div>
          <label className="text-sm font-medium mb-3 block">AI Tools Used *</label>
          <div className="grid grid-cols-2 gap-2">
            {availableAITools.map(tool => (
              <div key={tool} className="flex items-center space-x-2">
                <Checkbox
                  checked={submissionData.aiTools.includes(tool)}
                  onCheckedChange={() => handleAIToolToggle(tool)}
                />
                <label className="text-sm">{tool}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Compliance */}
        <div>
          <label className="text-sm font-medium mb-3 block">Applicable Policies *</label>
          <div className="space-y-2">
            {activePolicies.map(policy => (
              <div key={policy.id} className="flex items-start space-x-2 p-3 border rounded-lg">
                <Checkbox
                  checked={submissionData.policies.includes(policy.id)}
                  onCheckedChange={() => handlePolicyToggle(policy.id)}
                />
                <div className="flex-1">
                  <label className="text-sm font-medium">{policy.title}</label>
                  <p className="text-xs text-gray-600 mt-1">{policy.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {policy.requirements.slice(0, 2).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        {canSubmit && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Risk Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Risk Level:</span>
              <span className={`font-medium ${getRiskColor(riskScore)}`}>
                {getRiskLevel(riskScore)} ({(riskScore * 100).toFixed(0)}%)
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Based on AI tools used and policy compliance
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit for Review
            </>
          )}
        </Button>

        {!canSubmit && (
          <p className="text-xs text-gray-500 text-center">
            Please fill in all required fields to submit
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SubmissionWorkflow;