import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Decision Token details for partner confirmation
 */
interface DecisionTokenDetails {
  dt_id: string;
  enterprise_id: string;
  tool_name: string;
  tool_version: string;
  vendor_name: string;
  usage_grant: {
    purpose?: string;
    action_type?: string;
    data_handling?: string;
    jurisdictions?: string[];
    required_controls?: string[];
  };
  decision: {
    status: string;
    reason?: string;
    risk_score?: number;
  };
  eps_id: string;
  issued_at: string;
  expires_at: string;
}

interface PartnerConfirmationProps {
  /** Decision Token ID to confirm */
  dtId: string;
  /** Callback when confirmation is submitted */
  onConfirm?: (result: { success: boolean; pc_id?: string; error?: string }) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** API base URL */
  apiUrl?: string;
  /** Auth token for API calls */
  authToken?: string;
  /** Custom class name */
  className?: string;
}

/**
 * PartnerConfirmation
 * 
 * Minimal UI component for the partner confirmation flow.
 * Partners use this to acknowledge and consent to governed AI tool usage.
 * 
 * This implements the "Shared Compliance Shield" principle:
 * Both enterprises and partners benefit from governed usage.
 */
export const PartnerConfirmation: React.FC<PartnerConfirmationProps> = ({
  dtId,
  onConfirm,
  onCancel,
  apiUrl = '/api/boundary',
  authToken,
  className
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dtDetails, setDtDetails] = useState<DecisionTokenDetails | null>(null);
  const [confirmationStatement, setConfirmationStatement] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [controlsAccepted, setControlsAccepted] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);

  // Fetch Decision Token details
  useEffect(() => {
    const fetchDT = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${apiUrl}/decision-token/${dtId}`, {
          method: 'GET',
          headers
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || data.reason || 'Failed to fetch Decision Token');
        }

        setDtDetails(data.data.decision_token);
        setConfirmationStatement(data.data.confirmation_statement);
        setAlreadyConfirmed(data.data.already_confirmed);
        
        // Pre-select all required controls
        if (data.data.decision_token?.usage_grant?.required_controls) {
          setControlsAccepted(data.data.decision_token.usage_grant.required_controls);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (dtId) {
      fetchDT();
    }
  }, [dtId, apiUrl, authToken]);

  // Handle confirmation submission
  const handleSubmit = async () => {
    if (!acknowledged) {
      setError('Please acknowledge the confirmation statement');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiUrl}/partner-confirm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dtId,
          confirmationStatement,
          acceptedControls: controlsAccepted
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit confirmation');
      }

      onConfirm?.({ success: true, pc_id: data.data.pc_id });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onConfirm?.({ success: false, error: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn(
        'bg-slate-900 border border-slate-700 rounded-lg p-6',
        'flex items-center justify-center min-h-[300px]',
        className
      )}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading authorization details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dtDetails) {
    return (
      <div className={cn(
        'bg-slate-900 border border-red-500/50 rounded-lg p-6',
        className
      )}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">Unable to Load Authorization</h3>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Already confirmed state
  if (alreadyConfirmed) {
    return (
      <div className={cn(
        'bg-slate-900 border border-green-500/50 rounded-lg p-6',
        className
      )}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">Already Confirmed</h3>
            <p className="text-slate-400 text-sm mt-1">
              You have already confirmed this authorization.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-slate-900 border border-slate-700 rounded-lg overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-slate-800 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold">Shared Compliance Shield</h2>
            <p className="text-slate-400 text-sm">Confirm governed AI tool usage</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Tool Details */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Authorized Tool</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Tool</span>
              <span className="text-white font-mono text-sm">{dtDetails?.tool_name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Version</span>
              <span className="text-white font-mono text-sm">{dtDetails?.tool_version}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Vendor</span>
              <span className="text-white text-sm">{dtDetails?.vendor_name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Decision</span>
              <span className={cn(
                'text-sm font-medium',
                dtDetails?.decision.status === 'Approved' ? 'text-green-400' : 'text-yellow-400'
              )}>
                {dtDetails?.decision.status}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Grant */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Authorized Usage</h3>
          <div className="space-y-3">
            {dtDetails?.usage_grant.purpose && (
              <div>
                <span className="text-xs text-slate-500 block">Purpose</span>
                <span className="text-white text-sm">{dtDetails.usage_grant.purpose}</span>
              </div>
            )}
            {dtDetails?.usage_grant.data_handling && (
              <div>
                <span className="text-xs text-slate-500 block">Data Handling</span>
                <span className="text-white text-sm font-mono">{dtDetails.usage_grant.data_handling}</span>
              </div>
            )}
            {dtDetails?.usage_grant.required_controls && dtDetails.usage_grant.required_controls.length > 0 && (
              <div>
                <span className="text-xs text-slate-500 block mb-1">Required Controls</span>
                <div className="flex flex-wrap gap-2">
                  {dtDetails.usage_grant.required_controls.map((control, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded border border-cyan-500/30"
                    >
                      {control}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validity */}
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-slate-500">Issued:</span>
            <span className="text-slate-300 ml-2">{formatDate(dtDetails?.issued_at || '')}</span>
          </div>
          <div>
            <span className="text-slate-500">Expires:</span>
            <span className="text-slate-300 ml-2">{formatDate(dtDetails?.expires_at || '')}</span>
          </div>
        </div>

        {/* Confirmation Statement */}
        <div className="bg-slate-800 rounded-lg p-4 border-2 border-cyan-500/30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-300 leading-relaxed">
              {confirmationStatement || 
                "I acknowledge that I will use the authorized tool/version under the bound policy snapshot for the stated purpose, and I understand this usage is governed and recorded."}
            </span>
          </label>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !acknowledged}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all',
              acknowledged
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed',
              submitting && 'opacity-75'
            )}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirming...
              </span>
            ) : (
              'Confirm Authorization'
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800/30 px-6 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          This confirmation is cryptographically signed and recorded for compliance verification.
          <br />
          <span className="text-cyan-500/70">Boundary Governed • AI tool usage with proof</span>
        </p>
      </div>
    </div>
  );
};

export default PartnerConfirmation;

