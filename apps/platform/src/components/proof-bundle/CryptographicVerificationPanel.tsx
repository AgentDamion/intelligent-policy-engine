import React from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '@/components/ui/edge-card';
import { CheckCircle, XCircle, Shield } from 'lucide-react';
import type { ProofBundle } from '@/services/vera/proofBundleService';

interface CryptographicVerificationPanelProps {
  bundle: ProofBundle;
}

export const CryptographicVerificationPanel: React.FC<CryptographicVerificationPanelProps> = ({ bundle }) => {
  const hasHash = !!bundle.contentHash;
  const hasSignature = !!bundle.signatureHash;
  const isVerified = !!bundle.verifiedAt;

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <div className="section-label">Cryptographic Verification</div>
      </EdgeCardHeader>
      <EdgeCardBody className="space-y-3">
        {/* Hash Verification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasHash ? (
              <CheckCircle className="w-4 h-4 text-status-approved" />
            ) : (
              <XCircle className="w-4 h-4 text-status-denied" />
            )}
            <span className="text-sm text-neutral-600">Record integrity</span>
          </div>
          {hasHash && (
            <span className="text-xs mono-id">
              {bundle.contentHash?.substring(0, 8)}...{bundle.contentHash?.substring(bundle.contentHash.length - 8)}
            </span>
          )}
        </div>

        {/* Signature Verification */}
        {hasSignature && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-status-approved" />
              <span className="text-sm text-neutral-600">Digital signature</span>
            </div>
            <span className="text-xs mono-id">
              {bundle.signatureHash?.substring(0, 8)}...{bundle.signatureHash?.substring(bundle.signatureHash.length - 8)}
            </span>
          </div>
        )}

        {/* Verification Status */}
        {isVerified && (
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-approved" />
              <span className="text-sm font-semibold text-status-approved">
                Record integrity verified
              </span>
            </div>
            {bundle.verifiedAt && (
              <div className="text-xs text-neutral-500 ml-6 mt-1">
                Verified at {new Date(bundle.verifiedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </EdgeCardBody>
    </EdgeCard>
  );
};

