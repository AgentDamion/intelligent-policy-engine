import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Archive, CheckCircle, Send, Loader2, FileSpreadsheet } from 'lucide-react';
import { PolicyDistributionModal } from '@/components/policy/PolicyDistributionModal';
import { routes } from '@/lib/routes';

interface Policy {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  aiTools: string[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

interface PolicyManagerProps {
  policies: Policy[];
  onCreatePolicy: (policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'enterpriseId'>) => Promise<Policy>;
  onUpdatePolicy?: (id: number, updates: Partial<Policy>) => Promise<void>;
  onArchivePolicy?: (id: number) => Promise<void>;
  onDistributePolicy?: (id: number) => Promise<void>;
}

const PolicyManager: React.FC<PolicyManagerProps> = ({ 
  policies, 
  onCreatePolicy,
  onUpdatePolicy,
  onArchivePolicy,
  onDistributePolicy
}) => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [rfpModalOpen, setRfpModalOpen] = useState(false);
  const [selectedPolicyForRFP, setSelectedPolicyForRFP] = useState<Policy | null>(null);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'draft':
        return <Edit className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleArchivePolicy = async (policyId: number) => {
    if (!onArchivePolicy) return;
    
    setLoading(policyId);
    try {
      await onArchivePolicy(policyId);
      toast({
        title: "Success",
        description: "Policy archived successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to archive policy"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDistributePolicy = async (policyId: number) => {
    if (!onDistributePolicy) return;
    
    setLoading(policyId);
    try {
      await onDistributePolicy(policyId);
      toast({
        title: "Success",
        description: "Policy distributed to agency partners"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to distribute policy"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDistributeAsRFP = (policy: Policy) => {
    setSelectedPolicyForRFP(policy);
    setRfpModalOpen(true);
  };

  const handleCreateFromTemplate = async (templateType: string) => {
    const templates: Record<string, Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'enterpriseId'>> = {
      'data-privacy': {
        title: 'Data Privacy Policy',
        description: 'GDPR and CCPA compliance requirements for AI tools',
        requirements: [
          'Data encryption at rest and in transit',
          'User consent management',
          'Right to be forgotten implementation',
          'Data processing records'
        ],
        aiTools: ['ChatGPT Enterprise', 'Claude Pro'],
        status: 'draft'
      },
      'content-generation': {
        title: 'AI Content Generation Policy',
        description: 'Guidelines for AI-generated marketing content',
        requirements: [
          'Disclosure of AI-generated content',
          'Human review before publication',
          'Brand consistency checks',
          'Fact verification'
        ],
        aiTools: ['Jasper', 'Copy.ai', 'ChatGPT'],
        status: 'draft'
      },
      'healthcare': {
        title: 'Healthcare AI Policy',
        description: 'HIPAA-compliant AI usage in healthcare marketing',
        requirements: [
          'PHI data protection',
          'HIPAA compliance verification',
          'Secure data handling',
          'Audit trail maintenance'
        ],
        aiTools: ['Healthcare-specific AI tools only'],
        status: 'draft'
      }
    };

    const template = templates[templateType];
    if (!template) return;

    try {
      await onCreatePolicy(template);
      toast({
        title: "Success",
        description: `${template.title} created from template`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create policy from template"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>AI Usage Policies</CardTitle>
              <CardDescription>
                Define compliance requirements and AI tool usage guidelines for your agency partners
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Policy
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Policy List */}
      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{policy.title}</CardTitle>
                    <Badge 
                      className={`flex items-center gap-1 ${getStatusColor(policy.status)}`}
                    >
                      {getStatusIcon(policy.status)}
                      {policy.status}
                    </Badge>
                    {(policy as any).rfp_template_data && (
                      <Badge 
                        variant="outline" 
                        className="bg-primary/10 border-primary/30 text-primary"
                      >
                        RFP-Ready
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{policy.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {policy.status === 'active' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDistributePolicy(policy.id)}
                        disabled={loading === policy.id}
                      >
                        {loading === policy.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Distribute
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDistributeAsRFP(policy)}
                        disabled={loading === policy.id}
                        className="hover:bg-primary/10 hover:border-primary/50"
                        title="Operationalize this policy as an RFP with compliance requirements"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Operationalize as RFP
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(routes.enterprise.policyStudio(policy.id.toString()))}
                    disabled={loading === policy.id}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {policy.status !== 'archived' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleArchivePolicy(policy.id)}
                      disabled={loading === policy.id}
                    >
                      {loading === policy.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4 mr-2" />
                      )}
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Requirements */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Requirements</h4>
                <div className="space-y-1">
                  {policy.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Tools */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Approved AI Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {policy.aiTools.map((tool, index) => (
                    <Badge key={index} variant="outline">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 pt-2 border-t">
                Created on {new Date(policy.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Policy Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Policy Templates</CardTitle>
          <CardDescription>
            Start with pre-built templates for common compliance scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCreateFromTemplate('data-privacy')}
            >
              <h4 className="font-medium text-sm">Data Privacy</h4>
              <p className="text-xs text-gray-600 mt-1">GDPR and CCPA compliance for AI tools</p>
            </div>
            <div 
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCreateFromTemplate('content-generation')}
            >
              <h4 className="font-medium text-sm">Content Generation</h4>
              <p className="text-xs text-gray-600 mt-1">Guidelines for AI-generated marketing content</p>
            </div>
            <div 
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCreateFromTemplate('healthcare')}
            >
              <h4 className="font-medium text-sm">Healthcare Compliance</h4>
              <p className="text-xs text-gray-600 mt-1">HIPAA-compliant AI usage in healthcare marketing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Distribution Modal */}
      {selectedPolicyForRFP && (
        <PolicyDistributionModal
          open={rfpModalOpen}
          onOpenChange={setRfpModalOpen}
          policyId={selectedPolicyForRFP.id.toString()}
          policyVersionId={selectedPolicyForRFP.id.toString()}
          policyTitle={selectedPolicyForRFP.title}
          enterpriseId=""
        />
      )}
    </div>
  );
};

export default PolicyManager;