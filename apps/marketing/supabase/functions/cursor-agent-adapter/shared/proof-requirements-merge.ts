// ================================
// PROOF REQUIREMENTS MERGE LOGIC
// ================================
// Pure functions for filtering and merging proof packs

import {
  ContextProfile,
  ProofPack,
  ProofPackAtom,
  RequirementsProfile,
  AtomConstraints,
} from './proof-requirements-types.ts';

/**
 * Filter proof packs by context using appliesWhen rules
 * If a key is missing in appliesWhen, treat it as "no restriction"
 */
export function filterPacksByContext(
  packs: ProofPack[],
  context: ContextProfile
): ProofPack[] {
  return packs.filter(pack => {
    const appliesWhen = pack.appliesWhen || {};

    // Check jurisdictions
    if (appliesWhen.jurisdictions && appliesWhen.jurisdictions.length > 0) {
      const hasMatchingJurisdiction = context.jurisdictions.some(j =>
        appliesWhen.jurisdictions!.includes(j)
      );
      if (!hasMatchingJurisdiction) return false;
    }

    // Check channels
    if (appliesWhen.channels && appliesWhen.channels.length > 0) {
      const hasMatchingChannel = context.channels.some(c =>
        appliesWhen.channels!.includes(c)
      );
      if (!hasMatchingChannel) return false;
    }

    // Check assetTypes
    if (appliesWhen.assetTypes && appliesWhen.assetTypes.length > 0) {
      const hasMatchingAssetType = context.assetTypes.some(a =>
        appliesWhen.assetTypes!.includes(a)
      );
      if (!hasMatchingAssetType) return false;
    }

    // Check categories
    if (appliesWhen.categories && appliesWhen.categories.length > 0) {
      const hasMatchingCategory = context.categories.some(cat =>
        appliesWhen.categories!.includes(cat)
      );
      if (!hasMatchingCategory) return false;
    }

    // Check aiUsed (if specified, must match exactly)
    if (appliesWhen.aiUsed !== undefined) {
      if (appliesWhen.aiUsed !== context.aiUsed) return false;
    }

    return true;
  });
}

/**
 * Merge multiple proof packs into a single Requirements Profile
 * Uses strictest-wins logic for constraints
 */
export function mergePacksToProfile(
  enterpriseId: string,
  organizationId: string,
  submissionId: string,
  packs: ProofPack[],
  packAtoms: ProofPackAtom[]
): RequirementsProfile {
  const packIds = packs.map(p => p.id).sort();
  const profileKey = packIds.join('+');

  // Collect all atoms by pack
  const atomsByPack = new Map<string, ProofPackAtom[]>();
  for (const packAtom of packAtoms) {
    if (!atomsByPack.has(packAtom.proofPackId)) {
      atomsByPack.set(packAtom.proofPackId, []);
    }
    atomsByPack.get(packAtom.proofPackId)!.push(packAtom);
  }

  // Build required and optional atom sets
  const requiredAtomSet = new Set<string>();
  const optionalAtomSet = new Set<string>();

  for (const pack of packs) {
    const atoms = atomsByPack.get(pack.id) || [];
    for (const packAtom of atoms) {
      if (packAtom.required) {
        requiredAtomSet.add(packAtom.atomId);
      } else {
        optionalAtomSet.add(packAtom.atomId);
      }
    }
  }

  // Remove any optional atoms that are also required
  for (const requiredAtom of requiredAtomSet) {
    optionalAtomSet.delete(requiredAtom);
  }

  const requiredAtoms = Array.from(requiredAtomSet).sort();
  const optionalAtoms = Array.from(optionalAtomSet).sort();

  // Merge constraints per atom (strictest-wins)
  const constraints: Record<string, AtomConstraints> = {};
  const conflicts: string[] = [];

  // Group pack atoms by atom ID
  const atomsById = new Map<string, ProofPackAtom[]>();
  for (const packAtom of packAtoms) {
    if (!atomsById.has(packAtom.atomId)) {
      atomsById.set(packAtom.atomId, []);
    }
    atomsById.get(packAtom.atomId)!.push(packAtom);
  }

  // Merge constraints for each atom
  for (const [atomId, atomDefs] of atomsById.entries()) {
    const mergedConstraints: AtomConstraints = {};

    // Collect all constraint values
    const allAllowedValues: string[][] = [];
    const allForbiddenValues: string[] = [];
    const allMins: number[] = [];
    const allMaxs: number[] = [];

    for (const atomDef of atomDefs) {
      const c = atomDef.constraints || {};
      if (c.allowedValues && Array.isArray(c.allowedValues)) {
        allAllowedValues.push(c.allowedValues);
      }
      if (c.forbiddenValues && Array.isArray(c.forbiddenValues)) {
        allForbiddenValues.push(...c.forbiddenValues);
      }
      if (typeof c.min === 'number') {
        allMins.push(c.min);
      }
      if (typeof c.max === 'number') {
        allMaxs.push(c.max);
      }
    }

    // Merge allowedValues: intersection (strictest)
    if (allAllowedValues.length > 0) {
      let intersection = allAllowedValues[0];
      for (let i = 1; i < allAllowedValues.length; i++) {
        intersection = intersection.filter(v => allAllowedValues[i].includes(v));
      }
      mergedConstraints.allowedValues = intersection;
    }

    // Merge forbiddenValues: union (any forbidden is forbidden)
    if (allForbiddenValues.length > 0) {
      mergedConstraints.forbiddenValues = Array.from(new Set(allForbiddenValues));
    }

    // Merge min: maximum of all mins (strictest)
    if (allMins.length > 0) {
      mergedConstraints.min = Math.max(...allMins);
    }

    // Merge max: minimum of all maxes (strictest)
    if (allMaxs.length > 0) {
      mergedConstraints.max = Math.min(...allMaxs);
    }

    // Check for conflicts: if allowedValues exists and all are forbidden
    if (mergedConstraints.allowedValues && mergedConstraints.allowedValues.length > 0) {
      const effectiveAllowed = mergedConstraints.allowedValues.filter(
        v => !mergedConstraints.forbiddenValues?.includes(v)
      );
      if (effectiveAllowed.length === 0) {
        conflicts.push(
          `Atom ${atomId}: All allowed values are forbidden by constraints from packs ${packIds.join(', ')}`
        );
      }
    }

    // Only add constraints if they exist
    if (Object.keys(mergedConstraints).length > 0) {
      constraints[atomId] = mergedConstraints;
    }
  }

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    enterpriseId,
    organizationId,
    submissionId,
    profileKey,
    sourcePacks: packIds,
    requiredAtoms,
    optionalAtoms,
    constraints,
    conflicts,
    createdAt: now,
    updatedAt: now,
  };
}

