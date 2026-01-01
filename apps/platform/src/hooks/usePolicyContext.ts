/**
 * usePolicyContext Hook
 * 
 * Fetches and caches the active policy digest for an enterprise/workspace.
 * Uses React Query for caching and automatic refetching.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface PolicyContext {
  digest: string
  fullReference: string
  activatedAt: string
  artifactId: string
  policyId: string
  versionNumber: number
  ociRegistry: string
  ociRepository: string
  ociTag: string | null
}

export interface PolicyContextResult {
  policy: PolicyContext | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
  invalidate: () => void
}

interface PolicyArtifact {
  id: string
  policy_id: string
  version_number: number
  oci_registry: string
  oci_repository: string
  oci_tag: string | null
  oci_digest: string
  created_at: string
}

// =============================================================================
// Query Key Factory
// =============================================================================

export const policyContextKeys = {
  all: ['policy-context'] as const,
  context: (enterpriseId: string, workspaceId?: string) => 
    [...policyContextKeys.all, enterpriseId, workspaceId ?? 'enterprise-wide'] as const,
  artifact: (digest: string) => 
    [...policyContextKeys.all, 'artifact', digest] as const,
  history: (enterpriseId: string) => 
    [...policyContextKeys.all, 'history', enterpriseId] as const,
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to fetch the active policy context for an enterprise/workspace
 */
export function usePolicyContext(
  enterpriseId: string | undefined,
  workspaceId?: string
): PolicyContextResult {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: policyContextKeys.context(enterpriseId || '', workspaceId),
    queryFn: async (): Promise<PolicyContext | null> => {
      if (!enterpriseId) return null

      // 1. Call the database function to get active digest
      const { data: digest, error: digestError } = await supabase.rpc(
        'get_active_policy_digest',
        {
          p_enterprise_id: enterpriseId,
          p_workspace_id: workspaceId || null
        }
      )

      if (digestError) {
        console.error('[usePolicyContext] Error getting digest:', digestError)
        throw new Error(digestError.message)
      }

      if (!digest) {
        return null
      }

      // 2. Fetch full artifact details
      const { data: artifact, error: artifactError } = await supabase
        .from('policy_artifacts')
        .select(`
          id,
          policy_id,
          version_number,
          oci_registry,
          oci_repository,
          oci_tag,
          oci_digest,
          created_at
        `)
        .eq('oci_digest', digest)
        .single()

      if (artifactError || !artifact) {
        console.error('[usePolicyContext] Error getting artifact:', artifactError)
        return null
      }

      // 3. Get activation time
      const { data: activation } = await supabase
        .from('policy_activations')
        .select('activated_at')
        .eq('active_digest', digest)
        .eq('enterprise_id', enterpriseId)
        .is('deactivated_at', null)
        .order('activated_at', { ascending: false })
        .limit(1)
        .single()

      return {
        digest: artifact.oci_digest,
        fullReference: `${artifact.oci_registry}/${artifact.oci_repository}@${artifact.oci_digest}`,
        activatedAt: activation?.activated_at || artifact.created_at,
        artifactId: artifact.id,
        policyId: artifact.policy_id,
        versionNumber: artifact.version_number,
        ociRegistry: artifact.oci_registry,
        ociRepository: artifact.oci_repository,
        ociTag: artifact.oci_tag
      }
    },
    enabled: !!enterpriseId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 2
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ 
      queryKey: policyContextKeys.context(enterpriseId || '', workspaceId) 
    })
  }

  return {
    policy: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
    invalidate
  }
}

// =============================================================================
// Additional Hooks
// =============================================================================

/**
 * Hook to fetch policy artifact by digest
 */
export function usePolicyArtifact(digest: string | null) {
  return useQuery({
    queryKey: policyContextKeys.artifact(digest || ''),
    queryFn: async (): Promise<PolicyArtifact | null> => {
      if (!digest) return null

      const { data, error } = await supabase
        .from('policy_artifacts')
        .select('*')
        .eq('oci_digest', digest)
        .single()

      if (error || !data) {
        return null
      }

      return data as PolicyArtifact
    },
    enabled: !!digest,
    staleTime: 300000 // 5 minutes - artifacts are immutable
  })
}

/**
 * Hook to fetch policy activation history
 */
export function usePolicyActivationHistory(
  enterpriseId: string | undefined,
  limit: number = 50
) {
  return useQuery({
    queryKey: policyContextKeys.history(enterpriseId || ''),
    queryFn: async () => {
      if (!enterpriseId) return []

      const { data, error } = await supabase.rpc('get_policy_activation_history', {
        p_enterprise_id: enterpriseId,
        p_limit: limit
      })

      if (error) {
        console.error('[usePolicyActivationHistory] Error:', error)
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!enterpriseId,
    staleTime: 30000 // 30 seconds
  })
}

/**
 * Hook to get available policy artifacts for activation
 */
export function useAvailablePolicyArtifacts(enterpriseId: string | undefined) {
  return useQuery({
    queryKey: [...policyContextKeys.all, 'available', enterpriseId],
    queryFn: async () => {
      if (!enterpriseId) return []

      // Get all policy artifacts for policies belonging to this enterprise
      const { data, error } = await supabase
        .from('policy_artifacts')
        .select(`
          id,
          policy_id,
          version_number,
          oci_registry,
          oci_repository,
          oci_tag,
          oci_digest,
          created_at,
          policies!inner(
            id,
            name,
            enterprise_id
          )
        `)
        .eq('policies.enterprise_id', enterpriseId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[useAvailablePolicyArtifacts] Error:', error)
        throw new Error(error.message)
      }

      return (data || []).map(artifact => ({
        id: artifact.id,
        policyId: artifact.policy_id,
        policyName: (artifact.policies as any)?.name || 'Unknown',
        versionNumber: artifact.version_number,
        digest: artifact.oci_digest,
        fullReference: `${artifact.oci_registry}/${artifact.oci_repository}@${artifact.oci_digest}`,
        tag: artifact.oci_tag,
        createdAt: artifact.created_at
      }))
    },
    enabled: !!enterpriseId,
    staleTime: 60000
  })
}











