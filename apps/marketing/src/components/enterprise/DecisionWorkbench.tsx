import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Brain, 
  User, 
  Calendar,
  MessageSquare,
  Download,
  Send
} from 'lucide-react';

interface DecisionItem {
  id: string;
  title: string;
  description: string;
  ai_tools: string[];
  risk_score: number;
  ai_recommendation: {
    outcome: 'approved' | 'rejected' | 'conditional';
    confidence: number;
    reasoning: string;
    conditions?: string[];
  };
  evidence_files: string[];
  submitted_at: string;
}

interface DecisionWorkbenchProps {
  submissionId: string;
  item: DecisionItem;
  onDecision: (decision: any) => void;
}

export const DecisionWorkbench = ({ submissionId, item, onDecision }: DecisionWorkbenchProps) => {
  const [activeTab, setActiveTab] = useState('review');
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'conditional' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [conditions, setConditions] = useState('');
  const [expiryDays, setExpiryDays] = useState('90');

  const handleSubmitDecision = () => {
    if (!decision) return;

    const decisionData = {
      submissionId,
      itemId: item.id,
      outcome: decision,
      feedback,
      conditions: decision === 'conditional' ? conditions : undefined,
      expiryDays: decision === 'approved' ? parseInt(expiryDays) : undefined,
      decidedAt: new Date().toISOString()
    };

    onDecision(decisionData);
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'bg-destructive text-destructive-foreground';
    if (score >= 4) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const getRecommendationIcon = (outcome: string) => {
    switch (outcome) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'conditional': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{item.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{item.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getRiskColor(item.risk_score)}>
                Risk: {item.risk_score}/10
              </Badge>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(item.submitted_at).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="decision">Decision</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Tools Submitted</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.ai_tools.map((tool, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="p-2 bg-primary/10 rounded">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{tool}</p>
                      <p className="text-sm text-muted-foreground">
                        Risk assessment required
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submission Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Submission Type</Label>
                  <p className="text-sm text-muted-foreground">New Tool Implementation</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Business Justification</Label>
                  <p className="text-sm text-muted-foreground">
                    Enhancing customer service automation and reducing response times by 60%
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data Classification</Label>
                  <Badge variant="outline">Confidential</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Compliance Frameworks</Label>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">GDPR</Badge>
                    <Badge variant="secondary">SOX</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border">
                {getRecommendationIcon(item.ai_recommendation.outcome)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize">{item.ai_recommendation.outcome}</span>
                    <Badge variant="outline">
                      {item.ai_recommendation.confidence}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.ai_recommendation.reasoning}
                  </p>
                </div>
              </div>

              {item.ai_recommendation.conditions && (
                <div>
                  <Label className="text-sm font-medium">Recommended Conditions</Label>
                  <ul className="mt-2 space-y-1">
                    {item.ai_recommendation.conditions.map((condition, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {item.ai_recommendation.confidence}%
                  </div>
                  <div className="text-xs text-muted-foreground">AI Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {item.risk_score}/10
                  </div>
                  <div className="text-xs text-muted-foreground">Risk Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {item.ai_tools.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Tools</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Supporting Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.evidence_files.length > 0 ? (
                <div className="space-y-3">
                  {item.evidence_files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(item.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Evidence Files</h3>
                  <p className="text-muted-foreground">
                    No supporting documentation was provided with this submission.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Make Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Decision Options */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Decision Outcome</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant={decision === 'approved' ? 'default' : 'outline'}
                    onClick={() => setDecision('approved')}
                    className="h-auto p-4"
                  >
                    <div className="text-center">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Approve</div>
                      <div className="text-xs text-muted-foreground">
                        Allow implementation
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={decision === 'conditional' ? 'default' : 'outline'}
                    onClick={() => setDecision('conditional')}
                    className="h-auto p-4"
                  >
                    <div className="text-center">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Conditional</div>
                      <div className="text-xs text-muted-foreground">
                        Approve with conditions
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={decision === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setDecision('rejected')}
                    className="h-auto p-4"
                  >
                    <div className="text-center">
                      <XCircle className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Reject</div>
                      <div className="text-xs text-muted-foreground">
                        Deny implementation
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Decision Details */}
              {decision && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="feedback" className="text-sm font-medium">
                      Decision Feedback <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="feedback"
                      placeholder="Provide detailed feedback for your decision..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  {decision === 'conditional' && (
                    <div>
                      <Label htmlFor="conditions" className="text-sm font-medium">
                        Implementation Conditions <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="conditions"
                        placeholder="List specific conditions that must be met..."
                        value={conditions}
                        onChange={(e) => setConditions(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                  )}

                  {decision === 'approved' && (
                    <div>
                      <Label htmlFor="expiry" className="text-sm font-medium">
                        Approval Validity (days)
                      </Label>
                      <Select value={expiryDays} onValueChange={setExpiryDays}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Decision */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDecision(null)}>
                  Reset
                </Button>
                <Button
                  onClick={handleSubmitDecision}
                  disabled={!decision || !feedback || (decision === 'conditional' && !conditions)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Decision
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};