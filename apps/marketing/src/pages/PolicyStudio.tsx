import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  Send, 
  Settings, 
  FileText, 
  ChevronRight,
  Lightbulb,
  Download,
  ArrowLeft,
  ArrowRight,
  Plus,
  Edit
} from 'lucide-react';

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  compliance: string[];
  recommended?: boolean;
}

const PolicyStudio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewPolicy = id === 'new';
  const isEditMode = !isNewPolicy;
  
  const [isGuidedMode, setIsGuidedMode] = useState(isNewPolicy); // Start with guided for new policies
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [policyName, setPolicyName] = useState('');

  const templates: PolicyTemplate[] = [
    {
      id: 'pharma',
      name: 'Pharmaceutical Compliance',
      description: 'FDA 21 CFR Part 11 compliant policies for drug development...',
      compliance: ['FDA 21 CFR Part 11'],
      recommended: true
    },
    {
      id: 'financial',
      name: 'Financial Services',
      description: 'SOX, PCI DSS, and banking regulation compliance...',
      compliance: ['SOX & PCI DSS']
    },
    {
      id: 'healthcare',
      name: 'Healthcare HIPAA',
      description: 'HIPAA and HITECH Act compliance for patient data...',
      compliance: ['HIPAA & HITECH']
    },
    {
      id: 'insurance',
      name: 'Insurance',
      description: 'NAIC guidelines and state insurance regulation...',
      compliance: ['NAIC Guidelines']
    },
    {
      id: 'custom',
      name: 'Custom Policy',
      description: 'Start with a blank template and build your own policy...',
      compliance: ['Custom Framework']
    }
  ];

  const policyLibrary = [
    { name: 'Data Privacy Standards', status: 'published', version: 'v2.1', lastEdited: '2 days ago' },
    { name: 'AI Model Governance', status: 'draft', version: 'v1.3', lastEdited: '1 day ago' },
    { name: 'Security Compliance', status: 'published', version: 'v3.0', lastEdited: '1 week ago' },
    { name: 'Third-Party Integration', status: 'review', version: 'v1.0', lastEdited: '5 days ago' }
  ];

  const guidedSteps = [
    { number: 1, title: 'Select Template', description: 'Choose a policy template' },
    { number: 2, title: 'Configure Policy', description: 'Set name and basic settings' },
    { number: 3, title: 'Add Rules & Conditions', description: 'Create policy rules' },
    { number: 4, title: 'Assign Distribution', description: 'Select teams and agencies' },
    { number: 5, title: 'Review & Publish', description: 'Final review and publish' }
  ];

  const renderLeftSidebar = () => (
    <div className="w-80 bg-background border-r p-6 space-y-6">
      {/* Policy Library */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Policy Library</h3>
        <div className="space-y-2">
          {policyLibrary.map((policy, index) => (
            <div key={index} className="p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">{policy.name}</h4>
                <Badge variant={policy.status === 'published' ? 'default' : policy.status === 'draft' ? 'secondary' : 'outline'}>
                  {policy.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {policy.version} • Last edited {policy.lastEdited}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Templates</h3>
        <div className="space-y-2">
          {templates.slice(0, 4).map((template) => (
            <div key={template.id} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
              <div className="text-sm text-foreground">{template.name}</div>
              <div className="text-xs text-muted-foreground">{template.compliance.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Version Control */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Version Control</h3>
        <div className="space-y-1">
          <div className="text-sm text-foreground cursor-pointer hover:text-primary">Drafts (3)</div>
          <div className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">Last edited by Sarah Chen</div>
          <div className="text-xs text-muted-foreground">2 hours ago</div>
        </div>
      </div>
    </div>
  );

  const renderRightSidebar = () => (
    <div className="w-80 bg-background border-l p-6 space-y-6">
      {isGuidedMode ? (
        // Guided Mode Sidebar
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Step {currentStep} Insights</h3>
          
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Recommended Templates</h4>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-blue-800">Pharmaceutical Compliance template matches your organization profile and includes FDA-specific governance rules.</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Template Comparison</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground">Pharma</span>
                    <span className="text-sm font-medium text-green-600">95% match</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground">Healthcare</span>
                    <span className="text-sm font-medium text-yellow-600">78% match</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground">Financial</span>
                    <span className="text-sm font-medium text-gray-500">45% match</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Editor Mode Sidebar
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">AI Insights</h3>
          
          {/* Policy Impact Analysis */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Policy Impact Analysis</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Model Registry</span>
                    <span className="text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Data Pipeline</span>
                    <span className="text-muted-foreground">76%</span>
                  </div>
                  <Progress value={76} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Monitoring System</span>
                    <span className="text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Partner APIs</span>
                    <span className="text-muted-foreground">62%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
              </div>
            </div>

            {/* Effectiveness Prediction */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-foreground mb-3">Effectiveness Prediction</h4>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="10" fill="none" className="text-muted" opacity={0.3} />
                  <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="10" fill="none" className="text-green-500" strokeDasharray={`${87 * 3.14} ${(100-87) * 3.14}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">87%</span>
                </div>
              </div>
              <p className="text-sm text-green-600 font-medium mt-2">High Effectiveness</p>
            </div>

            {/* Regulatory Compliance Score */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Regulatory Compliance Score</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">FDA 21 CFR Part 11</span>
                  <span className="text-sm font-medium text-green-600">92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">EU AI Act</span>
                  <span className="text-sm font-medium text-yellow-600">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">HIPAA</span>
                  <span className="text-sm font-medium text-green-600">95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">SOC 2</span>
                  <span className="text-sm font-medium text-green-600">89%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Controls */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Distribution Controls</h4>
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">Select Workspaces</h5>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Engineering Team</Badge>
            <Badge variant="outline">All Workspaces</Badge>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (isGuidedMode) {
      // Guided Creation Mode
      return (
        <div className="flex-1 p-8">
          {/* Step Tracker */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              {guidedSteps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.number === currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.number}
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-sm font-medium text-foreground">{step.title}</div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                  {index < guidedSteps.length - 1 && (
                    <div className="flex-1 h-px bg-border mx-4 mt-5"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Select a Policy Template</h2>
              <p className="text-muted-foreground mb-8">Choose from industry-specific templates designed for compliance with major regulatory frameworks, or start from scratch.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      template.recommended ? 'ring-2 ring-primary' : ''
                    } ${selectedTemplate?.id === template.id ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setPolicyName(template.id === 'custom' ? '' : `${template.name} Policy`);
                    }}
                  >
                    {template.recommended && (
                      <div className="absolute -top-2 left-4">
                        <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                      </div>
                    )}
                    {selectedTemplate?.id === template.id && (
                      <div className="absolute -top-2 right-4">
                        <Badge className="bg-green-500 text-white">Selected</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                      <div className="space-y-2">
                        {template.compliance.map((comp, index) => (
                          <Badge key={index} variant="outline">{comp}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Template Selection Actions */}
              {selectedTemplate && (
                <div className="mt-8 p-6 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {selectedTemplate.name} Selected
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.id === 'custom' 
                          ? 'Start with a blank policy and build your own governance framework'
                          : `Ready to customize this template with ${selectedTemplate.compliance.join(', ')} compliance rules`
                        }
                      </p>
                    </div>
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      className="min-w-[120px]"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* MetaLoop Suggestion */}
              {!selectedTemplate && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900 mb-1">MetaLoop Suggestion</h3>
                      <p className="text-sm text-blue-800 mb-3">
                        Based on your organization's profile, we recommend starting with the <strong>Pharmaceutical Compliance</strong> template. 
                        It includes pre-built AI governance rules aligned with FDA requirements.
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => {
                            const pharmaTemplate = templates.find(t => t.id === 'pharma');
                            if (pharmaTemplate) {
                              setSelectedTemplate(pharmaTemplate);
                              setPolicyName(`${pharmaTemplate.name} Policy`);
                            }
                          }}
                        >
                          Apply
                        </Button>
                        <Button size="sm" variant="outline">Ignore</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Policy Name and Configuration */}
          {currentStep === 2 && selectedTemplate && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Configure Your Policy</h2>
              <p className="text-muted-foreground mb-8">Set up the basic configuration for your new policy document.</p>
              
              <div className="max-w-2xl space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Policy Name *
                  </label>
                  <input
                    type="text"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="Enter a name for your policy"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be the title of your policy document
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Templates
                  </Button>
                  <Button 
                    onClick={() => {
                      // Switch to editor mode to start building the policy
                      setIsGuidedMode(false);
                    }}
                    disabled={!policyName.trim()}
                    className="min-w-[120px]"
                  >
                    Start Building
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Editor Mode - Different content for new vs edit
    if (isNewPolicy && !selectedTemplate) {
      // Show template selection for new policies that haven't selected a template yet
      return (
        <div className="flex-1 p-8">
          <div className="text-center py-12">
            <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Create Your First Policy</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Get started by switching to guided mode to select a template, or create a custom policy from scratch.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setIsGuidedMode(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Use Guided Creation
              </Button>
              <Button variant="outline" onClick={() => {
                const customTemplate = templates.find(t => t.id === 'custom');
                if (customTemplate) {
                  setSelectedTemplate(customTemplate);
                  setPolicyName('New Policy');
                }
              }}>
                Start from Scratch
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Editor Mode
    return (
      <div className="flex-1 p-8">
        {/* MetaLoop Suggestion Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">MetaLoop Suggestion</h3>
              <p className="text-sm text-blue-800 mb-3">
                Based on FDA 21 CFR Part 11, consider adding electronic signature controls and audit trail requirements for AI model approvals.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="default">Apply</Button>
                <Button size="sm" variant="outline">Ignore</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isNewPolicy && selectedTemplate ? policyName || selectedTemplate.name : 'AI Model Governance Policy'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {isNewPolicy ? (
                <>
                  <span>Version 1.0</span>
                  <Badge variant="secondary">Draft</Badge>
                  <span>Created just now</span>
                  {selectedTemplate && (
                    <>
                      <span>•</span>
                      <span>Based on {selectedTemplate.name} template</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span>Version 1.3</span>
                  <Badge variant="secondary">Draft</Badge>
                  <span>Last edited 2 hours ago</span>
                </>
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            {isNewPolicy && selectedTemplate ? (
              // New policy content based on selected template
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Purpose and Scope</h2>
                <p className="text-foreground mb-6">
                  {selectedTemplate.id === 'custom' 
                    ? 'Define the purpose and scope of your custom AI governance policy here.'
                    : selectedTemplate.id === 'pharma'
                    ? 'This policy establishes FDA 21 CFR Part 11 compliant governance requirements for AI/ML models used in pharmaceutical development and manufacturing processes.'
                    : 'This policy establishes governance requirements for artificial intelligence and machine learning models deployed within our organization to ensure compliance with regulatory frameworks and maintain operational integrity.'
                  }
                </p>

                <h2 className="text-xl font-semibold text-foreground mb-4">Policy Statement</h2>
                <p className="text-foreground mb-4">
                  {selectedTemplate.id === 'pharma' 
                    ? 'All AI/ML models used in drug development, clinical trials, and manufacturing must comply with FDA regulations and undergo rigorous validation:'
                    : 'All AI/ML models must undergo comprehensive validation, documentation, and continuous monitoring throughout their lifecycle. This includes:'
                  }
                </p>
                
                {selectedTemplate.id === 'pharma' ? (
                  <ol className="list-decimal list-inside space-y-2 text-foreground">
                    <li><strong>Electronic Records Compliance (21 CFR Part 11)</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Electronic signature requirements for model approvals</li>
                        <li>Audit trail maintenance for all AI decisions</li>
                        <li>System validation and change control procedures</li>
                      </ul>
                    </li>
                    <li><strong>Clinical Trial Data Integrity</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>GCP compliance for AI-assisted clinical data analysis</li>
                        <li>Source data verification protocols</li>
                        <li>Statistical analysis plan documentation</li>
                      </ul>
                    </li>
                    <li><strong>Manufacturing AI Controls</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>GMP compliance for production AI systems</li>
                        <li>Real-time monitoring and deviation handling</li>
                        <li>Batch record integration requirements</li>
                      </ul>
                    </li>
                    <li><strong>Deployment Requirements</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Security assessment and risk evaluation</li>
                        <li>Performance monitoring and alerting systems</li>
                        <li>Rollback procedures and incident response</li>
                      </ul>
                    </li>
                    <li><strong>Ongoing Governance</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Regular model performance reviews</li>
                        <li>Compliance audits and documentation updates</li>
                        <li>Stakeholder communication and training</li>
                      </ul>
                    </li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-2 text-foreground">
                    <li><strong>Model Development Standards</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Documentation of training data sources and quality</li>
                        <li>Validation methodology and performance metrics</li>
                        <li>Bias assessment and mitigation strategies</li>
                      </ul>
                    </li>
                    <li><strong>Deployment Requirements</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Security assessment and risk evaluation</li>
                        <li>Performance monitoring and alerting systems</li>
                        <li>Rollback procedures and incident response</li>
                      </ul>
                    </li>
                    <li><strong>Ongoing Governance</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Regular model performance reviews</li>
                        <li>Compliance audits and documentation updates</li>
                        <li>Stakeholder communication and training</li>
                      </ul>
                    </li>
                  </ol>
                )}
              </div>
            ) : (
              // Existing policy content
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Purpose and Scope</h2>
                <p className="text-foreground mb-6">
                  This policy establishes governance requirements for artificial intelligence and machine learning models deployed within our organization to ensure compliance with regulatory frameworks and maintain operational integrity.
                </p>

                <h2 className="text-xl font-semibold text-foreground mb-4">Policy Statement</h2>
                <p className="text-foreground mb-4">
                  All AI/ML models must undergo comprehensive validation, documentation, and continuous monitoring throughout their lifecycle. This includes:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-foreground">
                  <li><strong>Model Development Standards</strong>
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                      <li>Documentation of training data sources and quality</li>
                      <li>Validation methodology and performance metrics</li>
                      <li>Bias assessment and mitigation strategies</li>
                    </ul>
                  </li>
                  <li><strong>Deployment Requirements</strong>
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                      <li>Security assessment and risk evaluation</li>
                      <li>Performance monitoring and alerting systems</li>
                      <li>Rollback procedures and incident response</li>
                    </ul>
                  </li>
                  <li><strong>Ongoing Governance</strong>
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
                      <li>Regular model performance reviews</li>
                      <li>Compliance audits and documentation updates</li>
                      <li>Stakeholder communication and training</li>
                    </ul>
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Compliance Framework Mapping</h3>
              <p className="text-green-800">
                This policy addresses requirements from FDA 21 CFR Part 11, EU AI Act, and SOC 2 Type II frameworks for comprehensive AI governance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="flex items-center justify-between mb-6 p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/policies')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Policies
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                {isNewPolicy ? (
                  <>
                    <Plus className="h-8 w-8 text-primary" />
                    Create New Policy
                  </>
                ) : (
                  <>
                    <Edit className="h-8 w-8 text-primary" />
                    Edit Policy: AI Model Governance
                  </>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isNewPolicy 
                  ? 'Build a comprehensive AI governance policy from templates or start from scratch'
                  : 'Modify and update your existing policy document'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNewPolicy && (
              <>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <Button 
              variant={isGuidedMode ? "outline" : "default"} 
              size="sm"
              onClick={() => setIsGuidedMode(!isGuidedMode)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isGuidedMode ? 'Switch to Editor' : 'Switch to Guided'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {renderLeftSidebar()}
        {renderMainContent()}
        {renderRightSidebar()}
      </div>

      {/* Footer */}
      <div className="bg-background border-t p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isNewPolicy ? 'Creating new policy' : 'Editing draft'} • Auto-saved 2 minutes ago
          </div>
          <div className="flex items-center gap-2">
            {isGuidedMode ? (
              <>
                <Button variant="outline" disabled={currentStep === 1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button disabled={currentStep === guidedSteps.length}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send for Review
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Policy
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyStudio;
