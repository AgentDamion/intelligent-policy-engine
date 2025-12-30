import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '@/components/ui/edge-card';
import { AICOMPLYRButton as Button } from '@/components/ui/aicomplyr-button';
import { cn } from '@/lib/utils';
import type { VerificationResult } from '@/services/vera/proofBundleVerifier';

interface VerificationModalProps {
  result: VerificationResult;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <EdgeCard className="max-w-2xl w-full mx-4 border-l-4">
        <EdgeCardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-aicomplyr-black">Cryptographic Verification</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </EdgeCardHeader>
        <EdgeCardBody className="space-y-4">
          {/* Verification Checks */}
          <div className="space-y-3">
            <VerificationCheck
              label="Hash Verification"
              passed={result.checks.hashValid}
              details={result.details.computedHash ? `Computed: ${result.details.computedHash.substring(0, 8)}...` : undefined}
            />
            <VerificationCheck
              label="Signature Verification"
              passed={result.checks.signatureValid}
              details={result.details.signatureAlgorithm ? `Algorithm: ${result.details.signatureAlgorithm}` : undefined}
            />
            {result.details.ledgerEntryId && (
              <VerificationCheck
                label="Ledger Chain Verification"
                passed={result.checks.ledgerValid}
                details={`Entry ID: ${result.details.ledgerEntryId.substring(0, 8)}...`}
              />
            )}
            {result.details.previousEntryHash && (
              <VerificationCheck
                label="Chain Integrity"
                passed={result.checks.chainIntact}
                details={`Previous: ${result.details.previousEntryHash.substring(0, 8)}...`}
              />
            )}
          </div>

          {/* Summary */}
          <div className={cn(
            'pt-4 border-t border-neutral-200',
            result.isValid ? 'bg-status-approved/10' : 'bg-status-denied/10'
          )}>
            <div className="flex items-center gap-2">
              {result.isValid ? (
                <CheckCircle className="w-5 h-5 text-status-approved" />
              ) : (
                <XCircle className="w-5 h-5 text-status-denied" />
              )}
              <span className={cn(
                'font-bold text-sm',
                result.isValid ? 'text-status-approved' : 'text-status-denied'
              )}>
                {result.isValid ? 'All checks passed' : `Verification failed: ${result.errors.join(', ')}`}
              </span>
            </div>
            {result.verifiedAt && (
              <div className="text-xs text-neutral-500 mt-2 ml-7">
                Verified at {new Date(result.verifiedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </div>
  );
};

interface VerificationCheckProps {
  label: string;
  passed: boolean;
  details?: string;
}

const VerificationCheck: React.FC<VerificationCheckProps> = ({ label, passed, details }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0">
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle className="w-4 h-4 text-status-approved" />
        ) : (
          <XCircle className="w-4 h-4 text-status-denied" />
        )}
        <span className="text-sm text-neutral-900">{label}</span>
      </div>
      {details && (
        <span className="text-xs mono-id text-neutral-500">{details}</span>
      )}
    </div>
  );
};

