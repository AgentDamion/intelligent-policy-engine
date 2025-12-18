/**
 * Test Component for the Deterministic Pipeline
 * Demonstrates the new schema-first, deterministic processing architecture
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface ProcessingResult {
  traceId: string;
  finalOutcome: 'APPROVED' | 'REJECTED' | 'HUMAN_IN_LOOP';
  confidence: number;
  processingTime: number;
}

const DeterministicPipelineTest: React.FC = () => {
  const [documentContent, setDocumentContent] = useState('This is a sample policy document for testing the deterministic pipeline. It contains compliance requirements and procedures.');
  const [documentTitle, setDocumentTitle] = useState('Sample Policy Document');
  const [enterpriseId, setEnterpriseId] = useState('550e8400-e29b-41d4-a716-446655440001');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processDocument = async () => {
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Create a properly formatted document
      const document = {
        id: uuidv4(),
        enterpriseId,
        title: documentTitle,
        content: documentContent,
        mimeType: 'text/plain' as const,
        checksumSha256: crypto.createHash('sha256').update(documentContent).digest('hex'),
        hasPHI: false,
      };

      const response = await fetch('/api/policy/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document,
          enterpriseId,
          options: {
            timeoutMs: 10000,
            forceReprocess: true,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data.data);
      toast.success('Document processed successfully!');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Processing failed: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">✅ Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">❌ Rejected</Badge>;
      case 'HUMAN_IN_LOOP':
        return <Badge variant="secondary">👨‍💼 Human Review</Badge>;
      default:
        return <Badge variant="outline">{outcome}</Badge>;
    }
  };

  const getHealthStatus = async () => {
    try {
      const response = await fetch('/api/policy/process');
      const data = await response.json();
      
      if (data.success) {
        toast.success('Pipeline is healthy! Cache: ' + data.data.stats.cacheStats.size + ' entries');
      } else {
        toast.error('Pipeline health check failed');
      }
    } catch (err) {
      toast.error('Failed to check pipeline health');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚀 Deterministic AI Pipeline Test</CardTitle>
          <CardDescription>
            Test the new schema-first, deterministic processing architecture with circuit breakers and audit trails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Title</label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Enterprise ID</label>
              <Input
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
                placeholder="Enterprise UUID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Document Content</label>
            <Textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Enter policy document content"
              rows={8}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={processDocument} 
              disabled={processing || !documentContent.trim()}
              className="flex-1"
            >
              {processing ? '⏳ Processing...' : '🚀 Process Document'}
            </Button>
            <Button 
              onClick={getHealthStatus} 
              variant="outline"
            >
              🏥 Health Check
            </Button>
          </div>

        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">❌ Processing Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Processing Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Final Outcome</label>
                <div>{getOutcomeBadge(result.finalOutcome)}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Confidence Score</label>
                <div className="text-lg font-semibold">{(result.confidence * 100).toFixed(1)}%</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Processing Time</label>
                <div className="text-lg">{result.processingTime}ms</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Trace ID</label>
                <div className="text-sm font-mono bg-muted p-2 rounded">{result.traceId}</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">🔍 What Happened?</h4>
              <ul className="space-y-1 text-sm">
                <li>✅ <strong>Schema Validation:</strong> Input document validated against strict contracts</li>
                <li>✅ <strong>Deterministic Processing:</strong> Document parsed with failover (AI → Template → Manual)</li>
                <li>✅ <strong>Agent Decision:</strong> AI agent made decision with circuit breaker protection</li>
                <li>✅ <strong>Rule Engine:</strong> Non-AI validation rules applied for final determination</li>
                <li>✅ <strong>Audit Trail:</strong> Complete processing history logged for compliance</li>
              </ul>
            </div>

          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📋 Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => setDocumentContent('This document contains unauthorized access and security violations that need immediate review.')}
            >
              ❌ Test Rejection
            </Button>
            <Button
              variant="outline"
              onClick={() => setDocumentContent('This policy document outlines standard compliance procedures and approved protocols for data handling.')}
            >
              ✅ Test Approval
            </Button>
            <Button
              variant="outline"
              onClick={() => setDocumentContent('This document contains sensitive PHI information and requires special handling protocols.')}
            >
              👨‍💼 Test Human Review
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default DeterministicPipelineTest;