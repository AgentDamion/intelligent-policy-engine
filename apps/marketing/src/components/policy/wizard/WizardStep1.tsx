/**
 * Wizard Step 1: Enhanced Document Input
 * Supports file upload, paste, and policy templates
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUploadZone } from '@/components/documents/DocumentUploadZone';
import { 
  Upload, 
  FileText, 
  Layout, 
  Clipboard,
  Sparkles,
  CheckCircle 
} from 'lucide-react';

interface WizardStep1Props {
  data: {
    title: string;
    description: string;
    content: string;
    uploadedFiles: File[];
    inputMethod: 'upload' | 'paste' | 'template';
  };
  onDataChange: (data: any) => void;
}

// Policy templates for quick start
const POLICY_TEMPLATES = [
  {
    id: 'chatgpt',
    name: 'ChatGPT Usage Policy',
    description: 'Template for OpenAI ChatGPT usage guidelines',
    content: `AI Tool Usage Policy - ChatGPT

Purpose: This policy governs the use of OpenAI's ChatGPT and related AI language models within our organization.

Approved Use Cases:
• Content drafting and editing assistance
• Code review and programming help
• Research and information gathering
• Meeting summary generation

Restrictions:
• Do not input confidential or proprietary information
• Do not use for final decision-making without human review
• Verify all generated information before use
• Do not share login credentials

Data Handling:
• No PII or sensitive data to be processed
• All interactions subject to OpenAI's data policies
• Regular review of usage patterns required

Compliance Requirements:
• Must comply with GDPR and data protection laws
• Regular security assessments required
• User training mandatory before access`,
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot Policy',
    description: 'Template for GitHub Copilot development guidelines',
    content: `AI Tool Usage Policy - GitHub Copilot

Purpose: This policy establishes guidelines for using GitHub Copilot AI-powered code completion.

Approved Use Cases:
• Code completion and suggestions
• Boilerplate code generation
• Documentation writing assistance
• Test case generation

Restrictions:
• Review all generated code before deployment
• Do not blindly accept suggestions without understanding
• No use with proprietary algorithms or sensitive logic
• Must comply with open source license requirements

Security Requirements:
• Code review mandatory for all Copilot-generated code
• Security scanning required before production deployment
• Regular audits of generated code quality
• Training on secure coding practices required`,
  },
  {
    id: 'general-ai',
    name: 'General AI Tools Policy',
    description: 'Comprehensive template for various AI tools',
    content: `General AI Tools Usage Policy

Purpose: This policy provides guidelines for the use of artificial intelligence tools and services.

Scope: Applies to all AI-powered tools including but not limited to:
• Language models (ChatGPT, Claude, Bard)
• Code generation tools (GitHub Copilot, Cursor)
• Image generation tools (DALL-E, Midjourney)
• Analysis and automation tools

General Principles:
• Human oversight required for all AI-generated content
• Transparency about AI usage in external communications
• Regular evaluation of tool effectiveness and risks
• Compliance with applicable regulations and standards

Risk Management:
• Data privacy impact assessments required
• Regular security reviews of AI tool integrations
• Incident response procedures for AI-related issues
• Monitoring and logging of AI tool usage`,
  },
];

export const WizardStep1: React.FC<WizardStep1Props> = ({
  data,
  onDataChange
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    onDataChange({
      ...data,
      [field]: value,
    });
  };

  const handleMethodChange = (method: 'upload' | 'paste' | 'template') => {
    onDataChange({
      ...data,
      inputMethod: method,
    });
  };

  const handleFilesUploaded = (files: File[]) => {
    onDataChange({
      ...data,
      uploadedFiles: files,
      inputMethod: 'upload',
    });

    // Extract text from first file (simplified - in real app would need proper file parsing)
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onDataChange({
            ...data,
            content,
            title: data.title || file.name.replace(/\.[^/.]+$/, ""),
            uploadedFiles: files,
            inputMethod: 'upload',
          });
        };
        reader.readAsText(file);
      }
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    onDataChange({
      ...data,
      title: template.name,
      description: template.description,
      content: template.content,
      inputMethod: 'template',
    });
  };

  const isDataComplete = data.title && data.content;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-teal" />
            Document Input
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how to provide your policy document for AI analysis
          </p>
        </CardHeader>
      </Card>

      {/* Input Method Selection */}
      <Tabs 
        value={data.inputMethod} 
        onValueChange={(value) => handleMethodChange(value as any)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paste" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Use Template
          </TabsTrigger>
        </TabsList>

        {/* Paste Text Tab */}
        <TabsContent value="paste" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Policy Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., AI Tool Usage Guidelines"
                  value={data.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the policy purpose"
                  value={data.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Policy Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your policy document content here..."
                  value={data.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={12}
                  className="min-h-[300px]"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{data.content.length} characters</span>
                  <span>AI will analyze for compliance patterns</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload File Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upload-title">Policy Title</Label>
                <Input
                  id="upload-title"
                  placeholder="Will be extracted from filename"
                  value={data.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-description">Description (Optional)</Label>
                <Input
                  id="upload-description"
                  placeholder="Brief description"
                  value={data.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </div>

            <DocumentUploadZone
              onFilesUploaded={handleFilesUploaded}
              acceptedFileTypes={['.txt', '.md', '.pdf', '.doc', '.docx']}
              maxFiles={1}
              maxFileSize={10 * 1024 * 1024}
            />

            {data.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-brand-green" />
                    Extracted Content Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {data.content.substring(0, 500)}
                      {data.content.length > 500 && '...'}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {data.content.length} characters extracted
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-purple" />
                Policy Templates
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Quick-start templates for common AI tools and scenarios
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {POLICY_TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate === template.id 
                      ? 'border-brand-teal bg-brand-teal/5' 
                      : 'hover:border-brand-teal/50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium flex items-center gap-2">
                          {template.name}
                          {selectedTemplate === template.id && (
                            <Badge className="bg-brand-green">Selected</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      <Layout className="h-5 w-5 text-brand-purple" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {selectedTemplate && data.content && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-brand-green" />
                  Template Content Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {data.content.substring(0, 500)}
                    {data.content.length > 500 && '...'}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You can edit this template content in the next step
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Completion Status */}
      {isDataComplete && (
        <Card className="border-brand-green">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-brand-green">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Ready for AI Analysis</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your policy document is ready to be analyzed by Cursor AI
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};