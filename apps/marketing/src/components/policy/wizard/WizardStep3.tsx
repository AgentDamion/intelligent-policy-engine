/**
 * Wizard Step 3: Structured Data Validation Interface
 * Interactive editing with confidence indicators
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X,
  Plus,
  Shield,
  Target,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep3Props {
  analysisResult: any;
  validatedData: {
    toolName: string;
    vendor: string;
    approvalStatus: string;
    riskLevel: string;
    useCases: string[];
    restrictions: string[];
    confidence: Record<string, number>;
  };
  onDataValidated: (data: any) => void;
}

// Editable field component with confidence indicator
const EditableField: React.FC<{
  label: string;
  value: string;
  confidence: number;
  onSave: (value: string) => void;
  type?: 'text' | 'select';
  options?: string[];
  multiline?: boolean;
}> = ({ label, value, confidence, onSave, type = 'text', options, multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-brand-green';
    if (confidence >= 0.7) return 'text-brand-orange';
    return 'text-destructive';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-brand-green/10 border-brand-green/20';
    if (confidence >= 0.7) return 'bg-brand-orange/10 border-brand-orange/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  return (
    <div className={cn("p-4 rounded-lg border", getConfidenceBg(confidence))}>
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getConfidenceColor(confidence)}>
            {Math.round(confidence * 100)}% confidence
          </Badge>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {type === 'select' && options ? (
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm">
          {value || <span className="text-muted-foreground italic">No value extracted</span>}
        </div>
      )}
    </div>
  );
};

// Editable array field (for use cases and restrictions)
const EditableArrayField: React.FC<{
  label: string;
  values: string[];
  onSave: (values: string[]) => void;
}> = ({ label, values, onSave }) => {
  const [items, setItems] = useState(values);
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      const updatedItems = [...items, newItem.trim()];
      setItems(updatedItems);
      onSave(updatedItems);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onSave(updatedItems);
  };

  const editItem = (index: number, newValue: string) => {
    const updatedItems = items.map((item, i) => i === index ? newValue : item);
    setItems(updatedItems);
    onSave(updatedItems);
  };

  return (
    <div className="space-y-3">
      <Label className="font-medium">{label}</Label>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-2 rounded border">
          <Input
            value={item}
            onChange={(e) => editItem(index, e.target.value)}
            className="border-0 p-0 h-auto"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(index)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        <Input
          placeholder={`Add new ${label.toLowerCase().slice(0, -1)}...`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
        />
        <Button onClick={addItem} size="sm">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
};

export const WizardStep3: React.FC<WizardStep3Props> = ({
  analysisResult,
  validatedData,
  onDataValidated
}) => {
  const [localData, setLocalData] = useState(validatedData);

  // Initialize data from analysis result (only once)
  useEffect(() => {
    if (analysisResult?.success && analysisResult.data && !validatedData.toolName) {
      const result = analysisResult.data;
      
      // Use structured data from the enhanced AI extraction if available
      const extractedData = result.parsedDocument?.extractedFields ? {
        toolName: result.parsedDocument.extractedFields.toolName || extractToolName(result.parsedDocument?.extractedText || ''),
        vendor: result.parsedDocument.extractedFields.vendor || extractVendor(result.parsedDocument?.extractedText || ''),
        approvalStatus: result.parsedDocument.extractedFields.status || 
                      (result.finalOutcome === 'approved' ? 'approved' : 
                       result.finalOutcome === 'rejected' ? 'denied' : 'pending'),
        riskLevel: result.parsedDocument.extractedFields.risk || result.riskLevel || 'medium',
        useCases: result.parsedDocument.extractedFields.useCases || extractUseCases(result.parsedDocument?.extractedText || ''),
        restrictions: result.parsedDocument.extractedFields.restrictions || extractRestrictions(result.parsedDocument?.extractedText || ''),
        confidence: result.parsedDocument.extractedFields.confidence || {
          toolName: 0.85,
          vendor: 0.75,
          approvalStatus: result.confidence || 0.8,
          riskLevel: 0.9,
          useCases: 0.7,
          restrictions: 0.8,
        },
      } : {
        toolName: extractToolName(result.parsedDocument?.extractedText || ''),
        vendor: extractVendor(result.parsedDocument?.extractedText || ''),
        approvalStatus: result.finalOutcome === 'approved' ? 'approved' : 
                      result.finalOutcome === 'rejected' ? 'denied' : 'pending',
        riskLevel: result.riskLevel || 'medium',
        useCases: extractUseCases(result.parsedDocument?.extractedText || ''),
        restrictions: extractRestrictions(result.parsedDocument?.extractedText || ''),
        confidence: {
          toolName: 0.85,
          vendor: 0.75,
          approvalStatus: result.confidence || 0.8,
          riskLevel: 0.9,
          useCases: 0.7,
          restrictions: 0.8,
        },
      };

      setLocalData(extractedData);
      onDataValidated(extractedData);
    }
  }, [analysisResult]);

  // Simple extraction functions (in real app, these would use more sophisticated AI)
  const extractToolName = (text: string): string => {
    const toolPatterns = [
      /ChatGPT/i, /GitHub Copilot/i, /Cursor/i, /Claude/i, /GPT/i,
      /Bard/i, /DALL-E/i, /Midjourney/i, /Copilot/i
    ];
    
    for (const pattern of toolPatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return '';
  };

  const extractVendor = (text: string): string => {
    const vendorPatterns = [
      /OpenAI/i, /Microsoft/i, /GitHub/i, /Google/i, /Anthropic/i,
      /Meta/i, /Adobe/i, /Stability AI/i
    ];
    
    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return '';
  };

  const extractUseCases = (text: string): string[] => {
    const useCases = [];
    if (text.includes('code') || text.includes('programming')) useCases.push('Code generation and review');
    if (text.includes('content') || text.includes('writing')) useCases.push('Content creation and editing');
    if (text.includes('research') || text.includes('analysis')) useCases.push('Research and analysis');
    if (text.includes('translation')) useCases.push('Language translation');
    return useCases;
  };

  const extractRestrictions = (text: string): string[] => {
    const restrictions = [];
    if (text.includes('confidential') || text.includes('sensitive')) restrictions.push('No confidential data');
    if (text.includes('review') || text.includes('human')) restrictions.push('Human review required');
    if (text.includes('training') || text.includes('approval')) restrictions.push('User training required');
    return restrictions;
  };

  const updateField = (field: keyof typeof localData, value: any) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataValidated(updatedData);
  };

  const overallConfidence = Object.values(localData.confidence).reduce((a, b) => a + b, 0) / 
                           Object.values(localData.confidence).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-brand-teal" />
            Review & Validate Extracted Data
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI has extracted structured information from your policy. Review and edit as needed.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              Overall Confidence: {Math.round(overallConfidence * 100)}%
            </Badge>
            <Badge variant="secondary">
              {Object.values(localData.confidence).filter(c => c >= 0.9).length} high confidence fields
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-purple" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="AI Tool Name"
            value={localData.toolName}
            confidence={localData.confidence.toolName}
            onSave={(value) => updateField('toolName', value)}
          />
          
          <EditableField
            label="Vendor/Provider"
            value={localData.vendor}
            confidence={localData.confidence.vendor}
            onSave={(value) => updateField('vendor', value)}
          />
          
          <EditableField
            label="Approval Status"
            value={localData.approvalStatus}
            confidence={localData.confidence.approvalStatus}
            onSave={(value) => updateField('approvalStatus', value)}
            type="select"
            options={['approved', 'denied', 'pending', 'conditional']}
          />
          
          <EditableField
            label="Risk Level"
            value={localData.riskLevel}
            confidence={localData.confidence.riskLevel}
            onSave={(value) => updateField('riskLevel', value)}
            type="select"
            options={['low', 'medium', 'high']}
          />
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-green" />
            Approved Use Cases
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            What the AI tool can be used for according to this policy
          </p>
        </CardHeader>
        <CardContent>
          <EditableArrayField
            label="Use Cases"
            values={localData.useCases}
            onSave={(values) => updateField('useCases', values)}
          />
        </CardContent>
      </Card>

      {/* Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            Restrictions & Requirements
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Limitations and compliance requirements from the policy
          </p>
        </CardHeader>
        <CardContent>
          <EditableArrayField
            label="Restrictions"
            values={localData.restrictions}
            onSave={(values) => updateField('restrictions', values)}
          />
        </CardContent>
      </Card>

      {/* Validation Tips */}
      <Card className="border-brand-blue/20 bg-brand-blue/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-brand-blue" />
            Validation Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-brand-green mt-0.5" />
            <span><strong>High confidence (90%+)</strong>: AI is very confident in these extractions</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-brand-orange mt-0.5" />
            <span><strong>Medium confidence (70-90%)</strong>: Review and verify these fields</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <span><strong>Low confidence (&lt;70%)</strong>: These fields likely need manual correction</span>
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      <Card className="border-brand-green">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-brand-green">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Data Validation Complete</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Structured policy data is ready for final review and submission
          </p>
        </CardContent>
      </Card>
    </div>
  );
};