import type { SpineData, SpineDecision, SpineDecisionResult } from '@/types/spine';

class SpineService {
  private readonly MOCK_MODE = true; // Toggle when backend ready
  
  /**
   * Fetch narrative data for a specific thread
   * SEAM: Will call GET /api/v1/threads/:threadId/spine
   */
  async fetchNarrative(threadId: string): Promise<SpineData> {
    if (this.MOCK_MODE) {
      return this.getMockNarrative(threadId);
    }
    
    // Future: const { data } = await supabase.functions.invoke('spine-fetch-narrative', { body: { threadId } });
    throw new Error('Backend integration pending');
  }
  
  /**
   * Submit a decision and generate proof bundle
   * SEAM: Will call POST /api/v1/spine/decisions
   */
  async submitDecision(decision: SpineDecision): Promise<SpineDecisionResult> {
    if (this.MOCK_MODE) {
      return this.mockSubmitDecision(decision);
    }
    
    // Future: const { data } = await supabase.functions.invoke('spine-submit-decision', { body: decision });
    throw new Error('Backend integration pending');
  }
  
  /**
   * Fetch proof bundle metadata (no content)
   * SEAM: Will call GET /api/v1/proof-bundles/:bundleId
   */
  async fetchProofBundle(bundleId: string): Promise<any> {
    if (this.MOCK_MODE) {
      return this.getMockProofBundle(bundleId);
    }
    
    throw new Error('Backend integration pending');
  }
  
  private getMockNarrative(threadId: string): SpineData {
    // Check if this is the GlobalMed ONCAVEX scenario
    if (threadId.includes('globalmed-oncavex') || threadId.includes('oncavex')) {
      return this.getGlobalMedOncavexNarrative(threadId);
    }

    // Default: Midjourney watermark compliance case
    return {
      facts: {
        threadId,
        policySnapshotId: 'eps-1.3',
        tool: { id: 'mj-001', name: 'Midjourney', version: 'v6.1' },
        region: 'US',
        owner: 'compliance@enterprise.com',
        state: 'Canary planned',
        caseTitle: 'Midjourney Watermark Compliance Gap'
      },
      narrative: {
        setup: {
          actors: ['Brand Team', 'Legal', 'Marketing Ops'],
          toolsInScope: ['Midjourney v6.1', 'DALL-E 3', 'Stable Diffusion XL'],
          context: [
            'Social media campaign using AI-generated imagery',
            'FTC disclosure requirements active',
            'Internal brand guidelines require AI watermarks'
          ],
          complianceRequirement: 'All AI-generated content must be clearly watermarked per FTC guidelines',
          policyAtoms: ['AI Transparency', 'FTC Compliance', 'Brand Safety']
        },
        challenge: {
          statement: 'Current Midjourney configuration does not enforce watermarking by default, creating a 71% compliance gap across 847 generated images. Manual watermarking introduces consistency issues and slows creative workflow by 2.3 days per campaign.',
          riskLevel: 'High',
          affectedSystems: ['Social Media Publishing', 'Asset Library', 'Campaign Management']
        },
        proof: {
          source: 'EvidenceAgent',
          provenance: 'EvidenceAgent·14:33 UTC',
          toolComparisons: [
            { label: 'Midjourney', percent: 23, status: 'fail' },
            { label: 'DALL-E 3', percent: 94, status: 'pass' },
            { label: 'Stable Diffusion', percent: 67, status: 'warning' }
          ],
          complianceGap: 71,
          totalChecks: 847,
          passedChecks: 245
        },
        resolution: {
          recommendation: 'Enable default watermark parameter (--watermark true) in Midjourney API configuration. Deploy via canary to Design Team cohort for validation.',
          canaryPlan: {
            cohortPercent: 15,
            durationDays: 7,
            successCriteria: [
              'Zero watermark violations detected',
              'Creative workflow delay < 0.5 days',
              'Designer satisfaction score > 4.0/5.0'
            ],
            monitoringMetrics: ['Watermark detection rate', 'Image generation latency', 'Designer feedback']
          },
          impact: {
            riskReduction: 'High',
            userDisruption: 'Low',
            autoFixAvailable: true,
            estimatedEffort: '2 hours engineering + 1 week monitoring'
          }
        },
        explainability: {
          features: [
            { id: 'f1', label: 'Default watermark=false', weight: 0.95, description: 'Primary risk driver' },
            { id: 'f2', label: 'Compliance gap percentage', weight: 0.88, description: 'Scale of issue' },
            { id: 'f3', label: 'Auto-fix availability', weight: 0.76, description: 'Remediation ease' },
            { id: 'f4', label: 'User workflow impact', weight: 0.62, description: 'Change management' }
          ],
          confidence: 0.92,
          decisionPath: [
            'Analyzed 847 Midjourney outputs',
            'Detected 71% missing watermarks',
            'Compared with DALL-E baseline (94% compliant)',
            'Validated auto-fix configuration available'
          ],
          modelVersion: 'PolicyAgent v2.1'
        }
      },
      timestamp: new Date().toISOString(),
      proofBundleId: undefined
    };
  }
  
  private async mockSubmitDecision(decision: SpineDecision): Promise<SpineDecisionResult> {
    // Simulate 800ms backend processing
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const bundleId = `bundle-${Date.now()}`;
    const attestationId = `attest-${Date.now()}`;
    
    // Emit telemetry
    this.emitTelemetry('ui_spine_decision_submitted', {
      thread_id: decision.threadId,
      policy_snapshot_id: decision.policySnapshotId,
      decision_kind: decision.kind,
      bundle_id: bundleId
    });
    
    return {
      success: true,
      proofBundleId: bundleId,
      attestationId,
      timestamp: new Date().toISOString()
    };
  }
  
  private getMockProofBundle(bundleId: string) {
    return {
      bundleId,
      claim: 'policy_approval',
      scope: {
        policyInstanceId: 'eps-1.3',
        toolVersionId: 'mj-v6.1',
        runIds: ['run-001', 'run-002']
      },
      actors: {
        approvers: ['compliance@enterprise.com'],
        reviewers: ['legal@enterprise.com', 'brand@enterprise.com']
      },
      evidenceManifest: {
        checksRun: 847,
        checksPassed: 245,
        checksWarning: 102,
        checksFailed: 500
      },
      createdAt: new Date().toISOString(),
      signature: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
    };
  }
  
  private emitTelemetry(event: string, payload: Record<string, any>) {
    console.log('[Spine Telemetry]', event, payload);
    // Future: POST to /api/v1/telemetry
  }

  private getGlobalMedOncavexNarrative(threadId: string): SpineData {
    return {
      facts: {
        threadId,
        policySnapshotId: 'EPS-131',
        tool: { id: 'persado-001', name: 'Persado Motivation AI', version: 'v2024.3' },
        region: 'Americas',
        owner: 'Compliance Lead – Americas',
        state: 'Under Review',
        caseTitle: 'Persado audience violation – ONCAVEX HCP campaigns'
      },
      narrative: {
        setup: {
          actors: ['GlobalMed Oncology Brand Team', 'IPG Health (primary)', 'Omnicom Health (secondary)', 'GlobalMed Compliance & Legal – Americas'],
          toolsInScope: ['Persado Motivation AI', 'Email orchestration platform (GlobalMed CRM)'],
          context: [
            'Brand: ONCAVEX™',
            'Audience: HCP',
            'Region: Americas',
            'Time window: Last 90 days',
            'Channel: Email (1:1 and triggered journeys)'
          ],
          complianceRequirement: 'ONCAVEX brand override sets Persado status = Disallowed for all HCP content. Global policy also restricts Persado to patient/caregiver CRM only and requires MLR-approved base copy references.',
          policyAtoms: ['Brand Override', 'Audience Restriction', 'MLR Reference Required']
        },
        challenge: {
          statement: 'Persado was used to optimize subject lines and pre-headers for ONCAVEX™ HCP emails without disclosure or brand-level approval. 17 emails to ~2,400 HCPs carried AI-optimized variants that: (1) Violated the ONCAVEX brand override (Persado: Disallowed), (2) Targeted an audience (HCP) outside the global Persado policy, and (3) Were not traceable to any MLR-approved base copy (mlr_reference_id missing). This creates regulatory exposure in a high-risk oncology indication and undermines GlobalMed\'s commitment to transparent AI usage with its agency partners.',
          riskLevel: 'High',
          affectedSystems: ['Email CRM', 'MLR Review System', 'Brand Policy Enforcement']
        },
        proof: {
          source: 'EvidenceAgent',
          provenance: 'EvidenceAgent·replay·Americas·14:27 UTC',
          toolComparisons: [
            { label: 'ONCAVEX + Persado (HCP)', percent: 0, status: 'fail' },
            { label: 'GLUCOSTABLE + Persado (Patient)', percent: 95, status: 'pass' },
            { label: 'HEARTGUARD + Persado (Patient)', percent: 92, status: 'pass' }
          ],
          complianceGap: 100,
          totalChecks: 51,
          passedChecks: 0
        },
        resolution: {
          recommendation: '1. Enforce Persado block at the boundary for ONCAVEX by publishing an updated brand override to the aicomplyr.io middleware and agency workspace. 2. Require IPG Health and Omnicom Health to route all ONCAVEX HCP content through a declarative AI usage step in their submission templates. 3. Mandate MLR reference IDs for any AI-assisted content on allowed brands (e.g., GLUCOSTABLE®, HEARTGUARD®) to prevent repeat of this gap. 4. Monitor for 30 days using Weave replay on live traffic; auto-escalate if any new ONCAVEX + Persado traces appear.',
          canaryPlan: {
            cohortPercent: 15,
            durationDays: 30,
            successCriteria: [
              '0 Persado traces on ONCAVEX HCP emails',
              '≥ 95% of GLUCOSTABLE/HEARTGUARD Persado runs carry mlr_reference_id',
              'No increase in average MLR cycle time'
            ],
            monitoringMetrics: ['Persado usage by brand', 'MLR reference ID compliance', 'Agency submission audit trail']
          },
          impact: {
            riskReduction: 'High',
            userDisruption: 'Low',
            autoFixAvailable: true,
            estimatedEffort: '2 days policy configuration + 30 days canary monitoring'
          }
        },
        explainability: {
          features: [
            { id: 'f1', label: 'Brand override: Disallowed', weight: 0.98, description: 'Explicit brand-level block' },
            { id: 'f2', label: 'HCP audience mismatch', weight: 0.94, description: 'Policy allows patient/caregiver only' },
            { id: 'f3', label: 'Missing MLR reference', weight: 0.89, description: 'Required proof of base approval' },
            { id: 'f4', label: 'Multi-agency coordination gap', weight: 0.72, description: 'IPG + Omnicom both violated' }
          ],
          confidence: 0.96,
          decisionPath: [
            'Scanned 430 ONCAVEX HCP emails over 90 days',
            'Detected 17 Persado fingerprints',
            'Cross-referenced brand override policy (ONCAVEX: Disallowed)',
            'Validated 0% compliance across 3 requirements'
          ],
          modelVersion: 'PolicyAgent v2.8 + EvidenceAgent v3.1'
        }
      },
      timestamp: new Date().toISOString(),
      proofBundleId: 'PB-ONC-PERS-001'
    };
  }
}

export const spineService = new SpineService();
