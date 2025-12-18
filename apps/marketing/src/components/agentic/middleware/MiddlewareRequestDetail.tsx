import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Shield, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MiddlewareRequest } from './types';

interface MiddlewareRequestDetailProps {
  request: MiddlewareRequest | null;
}

export const MiddlewareRequestDetail = ({ request }: MiddlewareRequestDetailProps) => {
  const { toast } = useToast();

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center p-s6 text-center bg-surface-0">
        <div>
          <Shield className="h-12 w-12 text-ink-300 mx-auto mb-s3" />
          <p className="text-[14px] text-ink-500 mb-s2">No request selected</p>
          <p className="text-[12px] text-ink-400">
            Select a request from the list to view details
          </p>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const downloadProofBundle = () => {
    const blob = new Blob([JSON.stringify(request.proof_bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-bundle-${request.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCost = (cost: number | null) => {
    if (!cost) return '$0.0000';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  return (
    <div className="flex-1 bg-white overflow-hidden flex flex-col">
      <div className="border-b border-ink-100 p-s4">
        <div className="flex items-center justify-between mb-s3">
          <h2 className="text-[16px] font-semibold text-ink-900">Request Details</h2>
          <Badge 
            variant={request.policy_decision === 'allow' ? 'default' : 'destructive'}
            className={request.policy_decision === 'allow' ? 'bg-green-100 text-green-800 border-green-300' : ''}
          >
            {request.policy_decision || 'unknown'}
          </Badge>
        </div>
        <div className="flex items-center gap-s4 text-[12px] text-ink-500 font-mono">
          <span>ID: {request.id.substring(0, 8)}</span>
          <span>•</span>
          <span>{new Date(request.created_at || '').toLocaleString()}</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start border-b rounded-none bg-surface-0 px-s4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policy">Policy Evaluation</TabsTrigger>
          <TabsTrigger value="proof">Proof Bundle</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-s4">
          <TabsContent value="overview" className="mt-0 space-y-s4">
            <Card className="p-s4">
              <h3 className="text-[14px] font-semibold text-ink-900 mb-s3">Request Info</h3>
              <div className="grid grid-cols-2 gap-s3 text-[13px]">
                <div>
                  <span className="text-ink-500">Model:</span>
                  <p className="font-mono text-ink-900">{request.model || 'unknown'}</p>
                </div>
                <div>
                  <span className="text-ink-500">Partner ID:</span>
                  <p className="font-mono text-ink-900">{request.partner_id || 'unknown'}</p>
                </div>
                <div>
                  <span className="text-ink-500">Response Time:</span>
                  <p className="font-mono text-ink-900">{request.response_time_ms || 0}ms</p>
                </div>
                <div>
                  <span className="text-ink-500">Status Code:</span>
                  <p className="font-mono text-ink-900">{request.response_status || 'N/A'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-s4">
              <h3 className="text-[14px] font-semibold text-ink-900 mb-s3">Tokens & Cost</h3>
              <div className="grid grid-cols-2 gap-s3 text-[13px]">
                <div>
                  <span className="text-ink-500">Prompt Tokens:</span>
                  <p className="font-mono text-ink-900">{request.prompt_tokens || 0}</p>
                </div>
                <div>
                  <span className="text-ink-500">Completion Tokens:</span>
                  <p className="font-mono text-ink-900">{request.completion_tokens || 0}</p>
                </div>
                <div>
                  <span className="text-ink-500">Total Tokens:</span>
                  <p className="font-mono text-ink-900">{request.total_tokens || 0}</p>
                </div>
                <div>
                  <span className="text-ink-500">Estimated Cost:</span>
                  <p className="font-mono text-ink-900">{formatCost(request.estimated_cost_usd)}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="policy" className="mt-0">
            <Card className="p-s4">
              <div className="flex items-center justify-between mb-s3">
                <h3 className="text-[14px] font-semibold text-ink-900">Policy Evaluation</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(request.policy_evaluation, null, 2), 'Policy evaluation')
                  }
                >
                  <Copy className="h-3 w-3 mr-s1" />
                  Copy
                </Button>
              </div>
              <pre className="bg-surface-50 p-s3 rounded-r1 text-[12px] font-mono overflow-x-auto">
                {JSON.stringify(request.policy_evaluation, null, 2)}
              </pre>
            </Card>
          </TabsContent>

          <TabsContent value="proof" className="mt-0">
            <Card className="p-s4">
              <div className="flex items-center justify-between mb-s3">
                <h3 className="text-[14px] font-semibold text-ink-900">Cryptographic Proof Bundle</h3>
                <Button size="sm" variant="outline" onClick={downloadProofBundle}>
                  <Download className="h-3 w-3 mr-s1" />
                  Download
                </Button>
              </div>
              <div className="space-y-s3">
                <div className="bg-green-50 border border-green-200 p-s3 rounded-r1 flex items-center gap-s2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-[13px] text-green-800">Proof bundle verified</span>
                </div>
                <pre className="bg-surface-50 p-s3 rounded-r1 text-[12px] font-mono overflow-x-auto max-h-[400px]">
                  {JSON.stringify(request.proof_bundle, null, 2)}
                </pre>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <Card className="p-s4">
              <h3 className="text-[14px] font-semibold text-ink-900 mb-s3">Request Body</h3>
              <pre className="bg-surface-50 p-s3 rounded-r1 text-[12px] font-mono overflow-x-auto">
                {JSON.stringify(request.body, null, 2)}
              </pre>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
