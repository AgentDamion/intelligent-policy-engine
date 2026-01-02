import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ShieldCheck, Link2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EdgeCard } from '@/components/ui/edge-card';

// =============================================================================
// Types
// =============================================================================

export interface VerificationAnimationProps {
  hashValid: boolean;
  signatureValid: boolean;
  chainValid: boolean;
  bundleHash: string;
  signatureKeyId: string | null;
  previousEntryHash?: string | null;
  onComplete?: () => void;
}

type StageStatus = 'pending' | 'active' | 'complete' | 'failed';
type StageId = 'hash' | 'signature' | 'chain';

interface Stage {
  id: StageId;
  status: StageStatus;
  label: string;
  detail?: string;
  error?: string;
}

// =============================================================================
// Timing Constants
// =============================================================================

const TIMING = {
  INITIAL_PAUSE: 200,
  HASH_DURATION: 800,
  SIGNATURE_DURATION: 600,
  CHAIN_DURATION: 700,
  INTER_STAGE_GAP: 150,
  FINAL_CONFIRMATION: 300,
} as const;

// =============================================================================
// Main Component
// =============================================================================

export const VerificationAnimation: React.FC<VerificationAnimationProps> = ({
  hashValid,
  signatureValid,
  chainValid,
  bundleHash,
  signatureKeyId,
  previousEntryHash,
  onComplete,
}) => {
  const [stages, setStages] = useState<Stage[]>([
    { id: 'hash', status: 'pending', label: 'Computing hash...' },
    { id: 'signature', status: 'pending', label: 'Verifying signature...' },
    { id: 'chain', status: 'pending', label: 'Checking ledger...' },
  ]);

  const [showFinalBanner, setShowFinalBanner] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Sequential stage execution
  useEffect(() => {
    // Reset state
    setStages([
      { id: 'hash', status: 'pending', label: 'Computing hash...' },
      { id: 'signature', status: 'pending', label: 'Verifying signature...' },
      { id: 'chain', status: 'pending', label: 'Checking ledger...' },
    ]);
    setShowFinalBanner(false);
    setHasError(false);
    
    let timeoutId: NodeJS.Timeout;
    let currentStageIndex = 0;

    const runStage = (stageIndex: number) => {
      if (stageIndex >= 3) { // Three stages: hash, signature, chain
        // All stages complete
        if (hashValid && signatureValid && chainValid) {
          setTimeout(() => {
            setShowFinalBanner(true);
            onComplete?.();
          }, prefersReducedMotion ? 0 : TIMING.FINAL_CONFIRMATION);
        }
        return;
      }

      const stageIds: StageId[] = ['hash', 'signature', 'chain'];
      const stageId = stageIds[stageIndex];
      const isValid = 
        (stageId === 'hash' && hashValid) ||
        (stageId === 'signature' && signatureValid) ||
        (stageId === 'chain' && chainValid);

      // Set stage to active
      setStages(prev => prev.map((s, i) => 
        i === stageIndex ? { ...s, status: 'active' as StageStatus } : s
      ));

      // Determine stage duration
      const duration = 
        stageId === 'hash' ? TIMING.HASH_DURATION :
        stageId === 'signature' ? TIMING.SIGNATURE_DURATION :
        TIMING.CHAIN_DURATION;

      // After duration, mark as complete or failed
      timeoutId = setTimeout(() => {
        if (!isValid) {
          // Stage failed - stop sequence
          setStages(prev => prev.map((s, i) => 
            i === stageIndex 
              ? { 
                  ...s, 
                  status: 'failed' as StageStatus,
                  error: getErrorMessage(stageId, isValid)
                } 
              : s
          ));
          setHasError(true);
          return;
        }

        // Stage succeeded
        setStages(prev => prev.map((s, i) => {
          if (i === stageIndex) {
            const updatedLabel = 
              stageId === 'hash' ? 'Hash verified' :
              stageId === 'signature' ? 'Signature valid' :
              'Chain verified';
            
            return { 
              ...s, 
              status: 'complete' as StageStatus,
              label: updatedLabel,
              detail: getStageDetail(stageId, bundleHash, signatureKeyId)
            };
          }
          return s;
        }));

        // Move to next stage after gap
        setTimeout(() => {
          runStage(stageIndex + 1);
        }, prefersReducedMotion ? 0 : TIMING.INTER_STAGE_GAP);
      }, prefersReducedMotion ? 0 : duration);
    };

    // Initial pause
    timeoutId = setTimeout(() => {
      runStage(0);
    }, prefersReducedMotion ? 0 : TIMING.INITIAL_PAUSE);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hashValid, signatureValid, chainValid, bundleHash, signatureKeyId, onComplete, prefersReducedMotion]);

  const allComplete = stages.every(s => s.status === 'complete');

  return (
    <div role="status" aria-live="polite" className="space-y-4">
      {/* Three Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <VerificationStage
            key={stage.id}
            stage={stage}
            bundleHash={stage.id === 'hash' ? bundleHash : undefined}
            index={index}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      {/* Final Confirmation Banner */}
      <AnimatePresence>
        {showFinalBanner && allComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <EdgeCard className="border-l-status-approved bg-status-approved/5">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-approved flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-aicomplyr-black uppercase tracking-wide">
                      Bundle Integrity Verified
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      Cryptographic verification complete. This bundle is authentic and unmodified.
                    </p>
                  </div>
                </div>
              </div>
            </EdgeCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// Stage Component
// =============================================================================

interface VerificationStageProps {
  stage: Stage;
  bundleHash?: string;
  index: number;
  prefersReducedMotion: boolean;
}

const VerificationStage: React.FC<VerificationStageProps> = ({
  stage,
  bundleHash,
  index,
  prefersReducedMotion,
}) => {
  const getBorderColor = () => {
    switch (stage.status) {
      case 'pending':
        return 'border-l-neutral-200';
      case 'active':
        return 'border-l-aicomplyr-black';
      case 'complete':
        return 'border-l-status-approved';
      case 'failed':
        return 'border-l-status-denied';
      default:
        return 'border-l-neutral-200';
    }
  };

  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5 flex-shrink-0' };
    
    switch (stage.status) {
      case 'complete':
        return <CheckCircle {...iconProps} className={cn(iconProps.className, 'text-status-approved')} />;
      case 'failed':
        return <XCircle {...iconProps} className={cn(iconProps.className, 'text-status-denied')} />;
      case 'active':
        switch (stage.id) {
          case 'hash':
            return <Fingerprint {...iconProps} className={cn(iconProps.className, 'text-aicomplyr-black')} />;
          case 'signature':
            return <ShieldCheck {...iconProps} className={cn(iconProps.className, 'text-aicomplyr-black')} />;
          case 'chain':
            return <Link2 {...iconProps} className={cn(iconProps.className, 'text-aicomplyr-black')} />;
        }
      default:
        switch (stage.id) {
          case 'hash':
            return <Fingerprint {...iconProps} className={cn(iconProps.className, 'text-neutral-400')} />;
          case 'signature':
            return <ShieldCheck {...iconProps} className={cn(iconProps.className, 'text-neutral-400')} />;
          case 'chain':
            return <Link2 {...iconProps} className={cn(iconProps.className, 'text-neutral-400')} />;
        }
    }
  };

  const stageVariants = {
    pending: {
      opacity: 0.6,
      borderColor: '#E5E5E5',
    },
    active: {
      opacity: 1,
      borderColor: '#000000',
      transition: {
        duration: 0.3,
        borderColor: { duration: 0.3 },
      },
    },
    complete: {
      opacity: 1,
      borderColor: '#16A34A',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    failed: {
      opacity: 1,
      borderColor: '#DC2626',
      x: [0, -4, 4, -4, 4, 0],
      transition: {
        duration: 0.4,
        x: { duration: 0.4 },
      },
    },
  };

  return (
    <motion.div
      variants={prefersReducedMotion ? {} : stageVariants}
      initial="pending"
      animate={stage.status}
      className={cn(
        'bg-white border-l-4 p-4 transition-colors',
        getBorderColor()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {stage.status === 'active' && !prefersReducedMotion ? (
            <motion.div
              animate={{ 
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {getIcon()}
            </motion.div>
          ) : (
            getIcon()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={cn(
              'text-sm font-bold',
              stage.status === 'pending' ? 'text-neutral-400' :
              stage.status === 'failed' ? 'text-status-denied' :
              stage.status === 'complete' ? 'text-status-approved' :
              'text-aicomplyr-black'
            )}>
              {stage.label}
            </p>
          </div>
          
          {/* Hash Typewriter Effect for hash stage */}
          {stage.id === 'hash' && bundleHash && stage.status === 'active' && (
            <TypewriterHash hash={bundleHash} prefersReducedMotion={prefersReducedMotion} />
          )}
          
          {/* Stage Detail */}
          {stage.detail && stage.status === 'complete' && (
            <p className="text-xs text-neutral-600 mt-1 font-mono">{stage.detail}</p>
          )}
          
          {/* Error Message */}
          {stage.error && stage.status === 'failed' && (
            <p className="text-xs text-status-denied mt-1">{stage.error}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Typewriter Hash Component
// =============================================================================

interface TypewriterHashProps {
  hash: string;
  prefersReducedMotion: boolean;
}

const TypewriterHash: React.FC<TypewriterHashProps> = ({ hash, prefersReducedMotion }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(hash);
      return;
    }

    const chars = hash.split('');
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < chars.length) {
        setDisplayed(prev => prev + chars[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40); // ~25 chars/second

    return () => clearInterval(interval);
  }, [hash, prefersReducedMotion]);

  return (
    <code className="text-xs font-mono text-neutral-700 mt-1">
      SHA-256: {displayed}
    </code>
  );
};

// =============================================================================
// Helper Functions
// =============================================================================

function getErrorMessage(stageId: StageId, isValid: boolean): string {
  if (isValid) return '';
  
  switch (stageId) {
    case 'hash':
      return 'Content hash does not match. Bundle may have been modified.';
    case 'signature':
      return 'Signature verification failed. Signer authority cannot be confirmed.';
    case 'chain':
      return 'Ledger link not found. Bundle may not exist in governance chain.';
    default:
      return 'Verification failed.';
  }
}

function getStageDetail(stageId: StageId, bundleHash: string, signatureKeyId: string | null): string {
  switch (stageId) {
    case 'hash':
      return bundleHash ? `SHA-256: ${bundleHash.slice(0, 16)}...${bundleHash.slice(-8)}` : '';
    case 'signature':
      return signatureKeyId ? `Signed by: ${signatureKeyId}` : 'Signed by: governance-engine@aicomplyr';
    case 'chain':
      return 'Ledger chain intact';
    default:
      return '';
  }
}

export default VerificationAnimation;

