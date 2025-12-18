// ================================
// PROOF REQUIREMENTS AGENT
// ================================
// Manages proof requirements profiles and atom states for submissions

import { Agent } from '../cursor-agent-registry.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  ContextProfile,
  RequirementsProfile,
  SubmissionAtomState,
  TransitionCheckResult,
  AtomStatus,
  ProofRequirementsError,
  ProofPack,
  ProofPackAtom,
} from '../shared/proof-requirements-types.ts';
import {
  filterPacksByContext,
  mergePacksToProfile,
} from '../shared/proof-requirements-merge.ts';

interface ProofChecklistResponse {
  submissionId: string;
  profile: {
    id: string;
    profileKey: string;
    sourcePacks: Array<{
      id: string;
      label: string;
      severity: 'regulatory' | 'contractual' | 'advisory';
    }>;
  };
  atoms: Array<{
    id: string;
    label: string;
    description: string | null;
    category: string;
    required: boolean;
    status: 'missing' | 'present' | 'waived' | 'invalid';
    value: any | null;
    sourcePacks: string[];
    notes: string | null;
    updatedAt: string;
    updatedBy: string | null;
  }>;
  summary: {
    totalAtoms: number;
    requiredAtoms: number;
    optionalAtoms: number;
    missingCount: number;
    presentCount: number;
    waivedCount: number;
    invalidCount: number;
    canTransition: boolean;
    missingRequiredAtoms: string[];
    conflicts: string[];
  };
}

export class ProofRequirementsAgent implements Agent {
  private supabase: any;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async process(input: any, context: any): Promise<any> {
    const { action, ...params } = input;

    console.log(`[ProofRequirementsAgent] Processing action: ${action}`, {
      submissionId: params.submissionId || params.context?.submissionId,
      enterpriseId: context.enterprise_id,
    });

    try {
      switch (action) {
        case 'resolveRequirements':
          return await this.resolveRequirementsForSubmission(
            params.context,
            params.packIds
          );

        case 'ensureProfile':
          return await this.ensureProfile(params.context, params.packIds);

        case 'getProfile':
          return await this.getProfileForSubmission(params.submissionId);

        case 'updateAtomState':
          return await this.updateAtomState(params);

        case 'canTransition':
          return await this.canTransition(
            params.submissionId,
            params.targetState
          );

        case 'getProofChecklist':
          return await this.getProofChecklist(params.submissionId);

        default:
          throw new ProofRequirementsError(
            `Unknown action: ${action}`,
            'INVALID_INPUT'
          );
      }
    } catch (error) {
      console.error(`[ProofRequirementsAgent] Error in ${action}:`, error);
      throw error;
    }
  }

  getInfo() {
    return { name: 'proof-requirements', type: 'ProofRequirements' };
  }

  /**
   * Resolve requirements for a submission by merging applicable proof packs
   */
  async resolveRequirementsForSubmission(
    context: ContextProfile,
    packIds: string[]
  ): Promise<RequirementsProfile> {
    console.log(`[ProofRequirementsAgent] Resolving requirements for submission ${context.submissionId}`);

    // Check if profile already exists
    const existingProfile = await this.getProfileForSubmission(context.submissionId);
    if (existingProfile) {
      console.log(`[ProofRequirementsAgent] Profile already exists for submission ${context.submissionId}`);
      return existingProfile;
    }

    // Load proof packs (global + enterprise-scoped)
    // Query global packs (enterprise_id IS NULL) and enterprise-specific packs separately
    const { data: globalPacks, error: globalError } = await this.supabase
      .from('proof_packs')
      .select('*')
      .in('id', packIds)
      .is('enterprise_id', null);

    const { data: enterprisePacks, error: enterpriseError } = await this.supabase
      .from('proof_packs')
      .select('*')
      .in('id', packIds)
      .eq('enterprise_id', context.enterpriseId);

    if (globalError || enterpriseError) {
      throw new ProofRequirementsError(
        `Failed to load proof packs: ${globalError?.message || enterpriseError?.message}`,
        'INVALID_INPUT',
        { globalError, enterpriseError }
      );
    }

    // Combine and sort by priority
    const packs = [...(globalPacks || []), ...(enterprisePacks || [])]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (!packs || packs.length === 0) {
      throw new ProofRequirementsError(
        `No proof packs found for IDs: ${packIds.join(', ')}`,
        'INVALID_INPUT'
      );
    }

    // Filter packs by context
    const filteredPacks = filterPacksByContext(
      packs.map(this.mapDbPackToType),
      context
    );

    if (filteredPacks.length === 0) {
      throw new ProofRequirementsError(
        `No proof packs match the submission context`,
        'INVALID_INPUT',
        { context, packIds }
      );
    }

    // Load pack atoms
    const filteredPackIds = filteredPacks.map(p => p.id);
    const { data: packAtomsData, error: atomsError } = await this.supabase
      .from('proof_pack_atoms')
      .select('*')
      .in('proof_pack_id', filteredPackIds);

    if (atomsError) {
      throw new ProofRequirementsError(
        `Failed to load proof pack atoms: ${atomsError.message}`,
        'INVALID_INPUT',
        { atomsError }
      );
    }

    const packAtoms: ProofPackAtom[] = (packAtomsData || []).map((pa: any) => ({
      proofPackId: pa.proof_pack_id,
      atomId: pa.atom_id,
      required: pa.required,
      constraints: pa.constraints || {},
    }));

    // Merge packs into profile
    const profile = mergePacksToProfile(
      context.enterpriseId,
      context.organizationId,
      context.submissionId,
      filteredPacks,
      packAtoms
    );

    // Insert requirements profile
    const { data: insertedProfile, error: insertError } = await this.supabase
      .from('requirements_profiles')
      .insert({
        id: profile.id,
        enterprise_id: profile.enterpriseId,
        organization_id: profile.organizationId,
        submission_id: profile.submissionId,
        profile_key: profile.profileKey,
        source_packs: profile.sourcePacks,
        required_atoms: profile.requiredAtoms,
        optional_atoms: profile.optionalAtoms,
        constraints: profile.constraints,
        conflicts: profile.conflicts,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt,
      })
      .select()
      .single();

    if (insertError) {
      throw new ProofRequirementsError(
        `Failed to create requirements profile: ${insertError.message}`,
        'INVALID_INPUT',
        { insertError }
      );
    }

    // Initialize atom states for required atoms
    const atomStateInserts = profile.requiredAtoms.map(atomId => ({
      enterprise_id: context.enterpriseId,
      organization_id: context.organizationId,
      submission_id: context.submissionId,
      atom_id: atomId,
      status: 'missing' as AtomStatus,
      source_packs: profile.sourcePacks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (atomStateInserts.length > 0) {
      const { error: statesError } = await this.supabase
        .from('submission_atom_states')
        .insert(atomStateInserts);

      if (statesError) {
        console.error(`[ProofRequirementsAgent] Failed to initialize atom states:`, statesError);
        // Don't throw - profile is created, states can be initialized later
      }
    }

    console.log(`[ProofRequirementsAgent] Created profile ${profile.id} with ${profile.requiredAtoms.length} required atoms`);

    return this.mapDbProfileToType(insertedProfile);
  }

  /**
   * Get existing requirements profile for a submission
   */
  async getProfileForSubmission(
    submissionId: string
  ): Promise<RequirementsProfile | null> {
    const { data, error } = await this.supabase
      .from('requirements_profiles')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new ProofRequirementsError(
        `Failed to get profile: ${error.message}`,
        'INVALID_INPUT',
        { error }
      );
    }

    return data ? this.mapDbProfileToType(data) : null;
  }

  /**
   * Ensure a profile exists (get or create)
   */
  async ensureProfile(
    context: ContextProfile,
    packIds: string[]
  ): Promise<RequirementsProfile> {
    const existing = await this.getProfileForSubmission(context.submissionId);
    if (existing) {
      return existing;
    }
    return await this.resolveRequirementsForSubmission(context, packIds);
  }

  /**
   * Update atom state for a submission
   */
  async updateAtomState(params: {
    submissionId: string;
    atomId: string;
    status: AtomStatus;
    value?: any;
    updatedBy: string;
  }): Promise<SubmissionAtomState> {
    console.log(`[ProofRequirementsAgent] Updating atom state`, params);

    // Validate profile exists
    const profile = await this.getProfileForSubmission(params.submissionId);
    if (!profile) {
      throw new ProofRequirementsError(
        `No requirements profile found for submission ${params.submissionId}`,
        'PROFILE_NOT_FOUND'
      );
    }

    // Validate atom is in required or optional atoms
    const isValidAtom =
      profile.requiredAtoms.includes(params.atomId) ||
      profile.optionalAtoms.includes(params.atomId);

    if (!isValidAtom) {
      throw new ProofRequirementsError(
        `Atom ${params.atomId} is not in the requirements profile for submission ${params.submissionId}`,
        'INVALID_ATOM'
      );
    }

    // Get enterprise_id and organization_id from profile
    const { data: submission } = await this.supabase
      .from('submissions')
      .select('enterprise_id, organization_id')
      .eq('id', params.submissionId)
      .single();

    if (!submission) {
      throw new ProofRequirementsError(
        `Submission ${params.submissionId} not found`,
        'INVALID_INPUT'
      );
    }

    // Upsert atom state
    const { data, error } = await this.supabase
      .from('submission_atom_states')
      .upsert(
        {
          enterprise_id: submission.enterprise_id || profile.enterpriseId,
          organization_id: submission.organization_id || profile.organizationId,
          submission_id: params.submissionId,
          atom_id: params.atomId,
          status: params.status,
          value: params.value || null,
          source_packs: profile.sourcePacks,
          updated_by: params.updatedBy,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'submission_id,atom_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new ProofRequirementsError(
        `Failed to update atom state: ${error.message}`,
        'INVALID_INPUT',
        { error }
      );
    }

    console.log(`[ProofRequirementsAgent] Updated atom state for ${params.atomId} to ${params.status}`);

    return this.mapDbAtomStateToType(data);
  }

  /**
   * Check if submission can transition to target state
   */
  async canTransition(
    submissionId: string,
    targetState: string
  ): Promise<TransitionCheckResult> {
    console.log(`[ProofRequirementsAgent] Checking transition for submission ${submissionId} to ${targetState}`);

    // Load requirements profile
    const profile = await this.getProfileForSubmission(submissionId);
    if (!profile) {
      return {
        allowed: false,
        missingAtoms: [],
        invalidAtoms: [],
        conflicts: ['No requirements profile found for submission'],
      };
    }

    // Check for conflicts
    if (profile.conflicts && profile.conflicts.length > 0) {
      return {
        allowed: false,
        missingAtoms: [],
        invalidAtoms: [],
        conflicts: profile.conflicts,
      };
    }

    // Load all atom states for this submission
    const { data: atomStates, error } = await this.supabase
      .from('submission_atom_states')
      .select('*')
      .eq('submission_id', submissionId);

    if (error) {
      throw new ProofRequirementsError(
        `Failed to load atom states: ${error.message}`,
        'INVALID_INPUT',
        { error }
      );
    }

    const statesByAtomId = new Map<string, any>();
    for (const state of atomStates || []) {
      statesByAtomId.set(state.atom_id, state);
    }

    // Check each required atom
    const missingAtoms: string[] = [];
    const invalidAtoms: string[] = [];

    for (const atomId of profile.requiredAtoms) {
      const state = statesByAtomId.get(atomId);
      if (!state || state.status === 'missing') {
        missingAtoms.push(atomId);
      } else if (state.status === 'invalid') {
        invalidAtoms.push(atomId);
      }
    }

    const allowed = missingAtoms.length === 0 && invalidAtoms.length === 0;

    console.log(`[ProofRequirementsAgent] Transition check: allowed=${allowed}, missing=${missingAtoms.length}, invalid=${invalidAtoms.length}`);

    return {
      allowed,
      missingAtoms,
      invalidAtoms,
      conflicts: profile.conflicts.length > 0 ? profile.conflicts : undefined,
    };
  }

  /**
   * Get proof checklist for a submission (UI-friendly format)
   */
  async getProofChecklist(submissionId: string): Promise<ProofChecklistResponse> {
    console.log(`[ProofRequirementsAgent] Getting proof checklist for submission ${submissionId}`);

    // Load requirements profile
    const profile = await this.getProfileForSubmission(submissionId);
    if (!profile) {
      throw new ProofRequirementsError(
        `No requirements profile found for submission ${submissionId}`,
        'PROFILE_NOT_FOUND'
      );
    }

    // Load all atom states for this submission
    const { data: atomStates, error: statesError } = await this.supabase
      .from('submission_atom_states')
      .select('*')
      .eq('submission_id', submissionId);

    if (statesError) {
      throw new ProofRequirementsError(
        `Failed to load atom states: ${statesError.message}`,
        'INVALID_INPUT',
        { statesError }
      );
    }

    // Load pack metadata
    const { data: packs, error: packsError } = await this.supabase
      .from('proof_packs')
      .select('id, label, severity')
      .in('id', profile.sourcePacks);

    if (packsError) {
      throw new ProofRequirementsError(
        `Failed to load proof packs: ${packsError.message}`,
        'INVALID_INPUT',
        { packsError }
      );
    }

    // Build states map
    const statesByAtomId = new Map<string, any>();
    for (const state of atomStates || []) {
      statesByAtomId.set(state.atom_id, state);
    }

    // Load atom metadata
    const allAtomIds = [...profile.requiredAtoms, ...profile.optionalAtoms];
    const { data: atomMetadata, error: atomsError } = await this.supabase
      .from('proof_atoms')
      .select('id, label, description, category')
      .in('id', allAtomIds);

    if (atomsError) {
      throw new ProofRequirementsError(
        `Failed to load atom metadata: ${atomsError.message}`,
        'INVALID_INPUT',
        { atomsError }
      );
    }

    const metadataByAtomId = new Map<string, any>();
    for (const atom of atomMetadata || []) {
      metadataByAtomId.set(atom.id, atom);
    }

    // Build enriched atoms list (required first, then optional)
    const enrichedAtoms: ProofChecklistResponse['atoms'] = [];

    // Add required atoms
    for (const atomId of profile.requiredAtoms) {
      const state = statesByAtomId.get(atomId);
      const metadata = metadataByAtomId.get(atomId);
      
      enrichedAtoms.push({
        id: atomId,
        label: metadata?.label || atomId,
        description: metadata?.description || null,
        category: metadata?.category || 'unknown',
        required: true,
        status: (state?.status as AtomStatus) || 'missing',
        value: state?.value || null,
        sourcePacks: state?.source_packs || profile.sourcePacks,
        notes: state?.notes || null,
        updatedAt: state?.updated_at || state?.created_at || new Date().toISOString(),
        updatedBy: state?.updated_by || null,
      });
    }

    // Add optional atoms
    for (const atomId of profile.optionalAtoms) {
      const state = statesByAtomId.get(atomId);
      const metadata = metadataByAtomId.get(atomId);
      
      enrichedAtoms.push({
        id: atomId,
        label: metadata?.label || atomId,
        description: metadata?.description || null,
        category: metadata?.category || 'unknown',
        required: false,
        status: (state?.status as AtomStatus) || 'missing',
        value: state?.value || null,
        sourcePacks: state?.source_packs || profile.sourcePacks,
        notes: state?.notes || null,
        updatedAt: state?.updated_at || state?.created_at || new Date().toISOString(),
        updatedBy: state?.updated_by || null,
      });
    }

    // Get transition check
    const transitionCheck = await this.canTransition(submissionId, 'approved');

    // Build summary
    const summary = {
      totalAtoms: enrichedAtoms.length,
      requiredAtoms: profile.requiredAtoms.length,
      optionalAtoms: profile.optionalAtoms.length,
      missingCount: enrichedAtoms.filter(a => a.status === 'missing').length,
      presentCount: enrichedAtoms.filter(a => a.status === 'present').length,
      waivedCount: enrichedAtoms.filter(a => a.status === 'waived').length,
      invalidCount: enrichedAtoms.filter(a => a.status === 'invalid').length,
      canTransition: transitionCheck.allowed,
      missingRequiredAtoms: transitionCheck.missingAtoms,
      conflicts: profile.conflicts || [],
    };

    return {
      submissionId,
      profile: {
        id: profile.id,
        profileKey: profile.profileKey,
        sourcePacks: (packs || []).map(p => ({
          id: p.id,
          label: p.label,
          severity: p.severity as 'regulatory' | 'contractual' | 'advisory',
        })),
      },
      atoms: enrichedAtoms,
      summary,
    };
  }

  // Helper: Map database pack to type
  private mapDbPackToType(dbPack: any): ProofPack {
    return {
      id: dbPack.id,
      enterpriseId: dbPack.enterprise_id,
      organizationId: dbPack.organization_id,
      label: dbPack.label,
      description: dbPack.description,
      priority: dbPack.priority || 0,
      appliesWhen: dbPack.applies_when || {},
      severity: dbPack.severity,
      version: dbPack.version,
    };
  }

  // Helper: Map database profile to type
  private mapDbProfileToType(dbProfile: any): RequirementsProfile {
    return {
      id: dbProfile.id,
      enterpriseId: dbProfile.enterprise_id,
      organizationId: dbProfile.organization_id,
      submissionId: dbProfile.submission_id,
      profileKey: dbProfile.profile_key,
      sourcePacks: dbProfile.source_packs || [],
      requiredAtoms: dbProfile.required_atoms || [],
      optionalAtoms: dbProfile.optional_atoms || [],
      constraints: dbProfile.constraints || {},
      conflicts: dbProfile.conflicts || [],
      createdAt: dbProfile.created_at,
      updatedAt: dbProfile.updated_at,
    };
  }

  // Helper: Map database atom state to type
  private mapDbAtomStateToType(dbState: any): SubmissionAtomState {
    return {
      id: dbState.id,
      enterpriseId: dbState.enterprise_id,
      organizationId: dbState.organization_id,
      submissionId: dbState.submission_id,
      atomId: dbState.atom_id,
      status: dbState.status,
      value: dbState.value,
      sourcePacks: dbState.source_packs || [],
      notes: dbState.notes,
      createdAt: dbState.created_at,
      updatedAt: dbState.updated_at,
      updatedBy: dbState.updated_by,
    };
  }
}

