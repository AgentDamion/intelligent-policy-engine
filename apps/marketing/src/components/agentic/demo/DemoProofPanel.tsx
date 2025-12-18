import { DemoProof } from '@/types/intelligenceDemo';
import { CheckCircle, Copy, Download, Hash, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { trackDemoEvent, DemoEvents } from '@/utils/demoTelemetry';
import { Shield, Brain, Database, Puzzle } from 'lucide-react';
import { DemoAgent } from '@/types/intelligenceDemo';

interface DemoProofPanelProps {
  proof: DemoProof;
}

const getAgentIcon = (agent: DemoAgent) => {
  switch (agent) {
    case 'regulatory':
      return Shield;
    case 'ethics':
      return Brain;
    case 'data':
      return Database;
    case 'integration':
      return Puzzle;
  }
};

export const DemoProofPanel = ({ proof }: DemoProofPanelProps) => {
  const handleCopyHash = () => {
    navigator.clipboard.writeText(proof.hash);
    toast({
      title: 'Hash copied',
      description: 'Cryptographic hash copied to clipboard',
    });
    trackDemoEvent(DemoEvents.DEMO_PROOF_HASH_COPIED, {
      hash: proof.hash,
    });
  };

  const handleDownload = () => {
    toast({
      title: 'Download ready',
      description: 'Compliance report would download in production',
    });
  };

  return (
    <div className="p-s6 max-w-4xl mx-auto">
      <div className="space-y-s6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-ink-900 mb-s2">Compliance Proof Generated</h2>
          <p className="text-ink-600">
            Complete audit trail with cryptographic verification, ready for regulatory inspection.
          </p>
        </div>

        {/* Cryptographic Hash */}
        <div className="bg-surface-0 border border-ink-100 rounded-lg p-s5">
          <div className="flex items-center justify-between mb-s3">
            <div className="flex items-center gap-s2">
              <Hash className="h-5 w-5 text-ink-500" />
              <h3 className="font-semibold text-ink-900">Cryptographic Hash</h3>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyHash}>
              <Copy className="h-4 w-4 mr-s2" />
              Copy
            </Button>
          </div>
          <code className="block p-s3 bg-surface-100 rounded font-mono text-xs break-all text-ink-700">
            {proof.hash}
          </code>
          <div className="flex items-center gap-s2 mt-s3 text-xs text-ink-500">
            <Clock className="h-3 w-3" />
            <span>Generated: {new Date(proof.timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-surface-0 border border-ink-100 rounded-lg p-s5">
          <h3 className="font-semibold text-ink-900 mb-s4">Audit Trail</h3>
          <div className="space-y-s2 max-h-80 overflow-y-auto">
            {proof.auditTrail.map((entry, index) => {
              const Icon = getAgentIcon(entry.agent);
              return (
                <div
                  key={index}
                  className="flex items-start gap-s3 p-s3 bg-surface-50 rounded text-sm"
                >
                  <Icon className="h-4 w-4 text-ink-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-ink-500 mb-s1">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-ink-700">{entry.event}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Standards */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-s5">
          <div className="flex items-center gap-s2 mb-s4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Compliance Standards Met</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-s3">
            {proof.compliance.map((standard, index) => (
              <div key={index} className="flex items-center gap-s2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-800">{standard}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-s3">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-s2" />
            Download Compliance Report
          </Button>
        </div>
      </div>
    </div>
  );
};
