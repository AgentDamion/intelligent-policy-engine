import { ACPill } from '@/components/agentic/ac/ACPill';
import { ProofBars } from './ProofBars';
import { ExplainabilityStrip } from './ExplainabilityStrip';
import type { SpineNarrative, CanaryPlan } from '@/types/spine';
import { SPINE_LAYOUT } from '@/constants/spine';

interface SpineNarrativeContentProps {
  narrative: SpineNarrative;
  canaryParams: {
    cohortPercent: number;
    durationDays: number;
  };
  editingCanary: boolean;
  onEditCanaryToggle: () => void;
  onCanaryParamsChange: (params: { cohortPercent: number; durationDays: number }) => void;
  onOpenWorkbench: () => void;
}

export const SpineNarrativeContent = ({
  narrative,
  canaryParams,
  editingCanary,
  onEditCanaryToggle,
  onCanaryParamsChange,
  onOpenWorkbench,
}: SpineNarrativeContentProps) => {
  return (
    <div className="flex-1 overflow-y-auto bg-surface-0">
      <div className="mx-auto p-s6 space-y-s6" style={{ maxWidth: `${SPINE_LAYOUT.NARRATIVE_MAX_WIDTH}px` }}>
        {/* Section 1: Setup */}
        <section data-section="setup" aria-labelledby="section-setup">
          <div className="flex items-baseline gap-s2 mb-s3">
            <span className="text-[24px] font-mono text-ink-900">①</span>
            <h2 id="section-setup" role="heading" aria-level={2} className="text-[16px] font-semibold text-ink-900">
              Setup
            </h2>
            <span className="text-[10px] font-mono bg-ink-100 px-s2 py-s1 rounded-r1 text-ink-700">
              CONTEXT
            </span>
          </div>
          
          <div className="space-y-s3 text-[14px]">
            <div>
              <div className="text-ink-500 text-[12px] mb-s1">Actors</div>
              <ul className="list-disc list-inside text-ink-900 space-y-s1">
                {narrative.setup.actors.map((actor, i) => (
                  <li key={i}>{actor}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="text-ink-500 text-[12px] mb-s1">Tools in Scope</div>
              <ul className="list-disc list-inside text-ink-900 space-y-s1">
                {narrative.setup.toolsInScope.map((tool, i) => (
                  <li key={i}>{tool}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="text-ink-500 text-[12px] mb-s1">Context</div>
              <ul className="list-disc list-inside text-ink-900 space-y-s1">
                {narrative.setup.context.map((ctx, i) => (
                  <li key={i}>{ctx}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="text-ink-500 text-[12px] mb-s1">Compliance Requirement</div>
              <p className="text-ink-900">{narrative.setup.complianceRequirement}</p>
            </div>
            
            <div className="flex flex-wrap gap-s2 pt-s2">
              {narrative.setup.policyAtoms.map((atom, i) => (
                <ACPill key={i} label={atom} kind="fact" />
              ))}
            </div>
          </div>
        </section>
        
        <div className="border-t border-ink-100" />
        
        {/* Section 2: Challenge */}
        <section data-section="challenge" aria-labelledby="section-challenge">
          <div className="flex items-baseline gap-s2 mb-s3">
            <span className="text-[24px] font-mono text-ink-900">②</span>
            <h2 id="section-challenge" role="heading" aria-level={2} className="text-[16px] font-semibold text-ink-900">
              Challenge
            </h2>
            <span className="text-[10px] font-mono bg-ink-100 px-s2 py-s1 rounded-r1 text-ink-700">
              RISK
            </span>
          </div>
          
          <div className="space-y-s3">
            <p className="text-[14px] text-ink-900 leading-relaxed">
              {narrative.challenge.statement}
            </p>
            
            <div className="flex items-center gap-s2 text-[12px]">
              <span className="text-ink-500">Risk Level:</span>
              <ACPill
                label={narrative.challenge.riskLevel}
                kind="status"
              />
            </div>
          </div>
        </section>
        
        <div className="border-t border-ink-100" />
        
        {/* Section 3: Proof */}
        <section data-section="proof" aria-labelledby="section-proof">
          <div className="flex items-baseline gap-s2 mb-s3">
            <span className="text-[24px] font-mono text-ink-900">③</span>
            <h2 id="section-proof" role="heading" aria-level={2} className="text-[16px] font-semibold text-ink-900">
              Proof
            </h2>
            <span className="text-[10px] font-mono bg-ink-100 px-s2 py-s1 rounded-r1 text-ink-700">
              EVIDENCE
            </span>
          </div>
          
          <div className="space-y-s4">
            <div className="text-[12px] font-mono space-y-s1">
              <div>
                <span className="text-ink-500">Source:</span>{' '}
                <span className="text-ink-900">{narrative.proof.source}</span>
              </div>
              <div>
                <span className="text-ink-500">Provenance:</span>{' '}
                <span className="text-ink-900">{narrative.proof.provenance}</span>
              </div>
            </div>
            
            <ProofBars bars={narrative.proof.toolComparisons} />
            
            <div className="text-[14px] text-ink-900">
              Compliance gap: <span className="font-semibold">{narrative.proof.complianceGap}%</span> across{' '}
              <span className="font-semibold">{narrative.proof.totalChecks}</span> checks{' '}
              (<span className="text-ink-500">{narrative.proof.passedChecks} passed</span>)
            </div>
          </div>
        </section>
        
        <div className="border-t border-ink-100" />
        
        {/* Section 4: Resolution */}
        <section data-section="resolution" aria-labelledby="section-resolution">
          <div className="flex items-baseline gap-s2 mb-s3">
            <span className="text-[24px] font-mono text-ink-900">④</span>
            <h2 id="section-resolution" role="heading" aria-level={2} className="text-[16px] font-semibold text-ink-900">
              Resolution
            </h2>
            <span className="text-[10px] font-mono bg-ink-100 px-s2 py-s1 rounded-r1 text-ink-700">
              ACTION
            </span>
          </div>
          
          <div className="space-y-s4">
            <div>
              <div className="text-ink-500 text-[12px] mb-s2">Recommendation</div>
              <p className="text-[14px] text-ink-900 leading-relaxed">
                {narrative.resolution.recommendation}
              </p>
            </div>
            
            <button
              onClick={onOpenWorkbench}
              className="text-[12px] text-ink-500 hover:text-ink-900 underline font-mono"
              data-action="open_workbench"
            >
              Edit in Workbench →
            </button>
            
            <div className="border border-ink-200 rounded-r2 p-s4 space-y-s3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold text-ink-900">Canary Deployment Plan</div>
                <button
                  onClick={onEditCanaryToggle}
                  className="text-[10px] text-ink-500 hover:text-ink-900 font-mono underline"
                >
                  {editingCanary ? 'Lock' : 'Edit'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-s3 text-[12px]">
                <div>
                  <div className="text-ink-500">Cohort</div>
                  {editingCanary ? (
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={canaryParams.cohortPercent}
                      onChange={(e) => onCanaryParamsChange({
                        ...canaryParams,
                        cohortPercent: Math.min(100, Math.max(1, Number(e.target.value)))
                      })}
                      className="w-20 font-mono text-ink-900 border border-ink-200 rounded-r1 px-s1 py-s1 text-[12px] focus:outline-none focus:ring-2 focus:ring-ink-900"
                      data-input="canary_cohort"
                    />
                  ) : (
                    <div className="font-mono text-ink-900">
                      {canaryParams.cohortPercent}%
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-ink-500">Duration</div>
                  {editingCanary ? (
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={canaryParams.durationDays}
                      onChange={(e) => onCanaryParamsChange({
                        ...canaryParams,
                        durationDays: Math.min(30, Math.max(1, Number(e.target.value)))
                      })}
                      className="w-20 font-mono text-ink-900 border border-ink-200 rounded-r1 px-s1 py-s1 text-[12px] focus:outline-none focus:ring-2 focus:ring-ink-900"
                      data-input="canary_duration"
                    />
                  ) : (
                    <div className="font-mono text-ink-900">
                      {canaryParams.durationDays} days
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-ink-500 text-[12px] mb-s2">Success Criteria</div>
                <ul className="list-disc list-inside text-ink-900 text-[12px] space-y-s1">
                  {narrative.resolution.canaryPlan.successCriteria.map((criterion, i) => (
                    <li key={i}>{criterion}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <ExplainabilityStrip explainability={narrative.explainability} />
          </div>
        </section>
      </div>
    </div>
  );
};
