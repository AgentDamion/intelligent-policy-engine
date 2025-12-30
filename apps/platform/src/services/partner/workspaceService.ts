import { supabase } from '@/lib/supabase'
import { getRoleArchetypes, DEFAULT_ROLE_ARCHETYPES } from '../workflow/roleArchetypeService'

export interface PartnerWorkspace {
  userRole: string // Role archetype ID
  availableClients: Array<{
    clientId: string
    clientName: string
    brands: Array<{ id: string; name: string }>
    complianceScore: number
    activeRequests: number
  }>
  personalRequests: Array<{
    id: string
    tool: string
    status: string
    submittedAt: string
  }>
  teamMetrics?: {
    totalRequests: number
    approvalRate: number
    avgTimeToApproval: number
  }
}

/**
 * Get user's role archetype for current context
 */
export async function getUserRoleArchetype(
  userId: string,
  enterpriseId: string
): Promise<string | null> {
  try {
    // Try to get from user_contexts first
    const { data: userContext } = await supabase
      .from('user_contexts')
      .select('role')
      .eq('user_id', userId)
      .eq('enterprise_id', enterpriseId)
      .eq('is_active', true)
      .single()

    if (userContext?.role) {
      return userContext.role
    }

    // Fallback to partner_client_contexts
    const { data: partnerContext } = await supabase
      .from('partner_client_contexts')
      .select('role')
      .eq('user_id', userId)
      .eq('partner_enterprise_id', enterpriseId)
      .limit(1)
      .single()

    return partnerContext?.role || null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

/**
 * Get available workspaces (clients/brands) for user
 */
export async function getAvailableWorkspaces(
  userId: string,
  partnerEnterpriseId: string
): Promise<Array<{
  clientId: string
  clientName: string
  brands: Array<{ id: string; name: string }>
  complianceScore: number
  activeRequests: number
}>> {
  try {
    // Get partner-client relationships
    const { data: relationships, error } = await supabase
      .from('partner_enterprise_relationships')
      .select(`
        client_enterprise_id,
        enterprises!partner_enterprise_relationships_client_enterprise_id_fkey (
          id,
          name
        )
      `)
      .eq('partner_enterprise_id', partnerEnterpriseId)
      .eq('relationship_status', 'active')

    if (error || !relationships) {
      return []
    }

    // Get user's brand scope from partner_client_contexts
    const { data: contexts } = await supabase
      .from('partner_client_contexts')
      .select('client_enterprise_id, brand_scope')
      .eq('user_id', userId)
      .eq('partner_enterprise_id', partnerEnterpriseId)

    const workspaces = await Promise.all(
      relationships.map(async (rel: any) => {
        const clientId = rel.client_enterprise_id
        const clientName = (rel.enterprises as any)?.name || 'Unknown Client'

        // Get user's brand scope for this client
        const context = contexts?.find((c) => c.client_enterprise_id === clientId)
        const brandScope = context?.brand_scope || []

        // Get brands (mock for now - in production, fetch from brands table)
        const brands = brandScope.length > 0
          ? brandScope.map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }))
          : [{ id: 'all', name: 'All Brands' }]

        // Get compliance score (mock for now)
        const complianceScore = 85 // In production, calculate from governance threads

        // Get active requests count
        const { count } = await supabase
          .from('governance_threads')
          .select('*', { count: 'exact', head: true })
          .eq('enterprise_id', clientId)
          .in('status', ['open', 'pending_human', 'in_review'])

        return {
          clientId,
          clientName,
          brands,
          complianceScore,
          activeRequests: count || 0,
        }
      })
    )

    return workspaces
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return []
  }
}

/**
 * Get personal requests for user
 */
export async function getPersonalRequests(
  userId: string,
  enterpriseId: string
): Promise<Array<{
  id: string
  tool: string
  status: string
  submittedAt: string
}>> {
  try {
    const { data: threads, error } = await supabase
      .from('governance_threads')
      .select('id, title, status, created_at, metadata')
      .eq('enterprise_id', enterpriseId)
      .eq('thread_type', 'tool_request')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error || !threads) {
      return []
    }

    return threads.map((thread) => {
      const metadata = (thread.metadata as Record<string, unknown>) || {}
      return {
        id: thread.id,
        tool: metadata.tool_name as string || thread.title || 'Unknown Tool',
        status: thread.status,
        submittedAt: thread.created_at,
      }
    })
  } catch (error) {
    console.error('Error fetching personal requests:', error)
    return []
  }
}

/**
 * Get team metrics (for leadership/team lead roles)
 */
export async function getTeamMetrics(
  enterpriseId: string,
  clientId?: string
): Promise<{
  totalRequests: number
  approvalRate: number
  avgTimeToApproval: number
}> {
  try {
    let query = supabase
      .from('governance_threads')
      .select('id, status, created_at, resolved_at')
      .eq('enterprise_id', clientId || enterpriseId)
      .eq('thread_type', 'tool_request')

    const { data: threads, error } = await query

    if (error || !threads) {
      return { totalRequests: 0, approvalRate: 0, avgTimeToApproval: 0 }
    }

    const totalRequests = threads.length
    const approved = threads.filter((t) => t.status === 'approved' || t.status === 'approved_with_conditions').length
    const approvalRate = totalRequests > 0 ? (approved / totalRequests) * 100 : 0

    // Calculate average time to approval
    const resolvedThreads = threads.filter(
      (t) => t.resolved_at && (t.status === 'approved' || t.status === 'approved_with_conditions')
    )
    const avgTimeToApproval =
      resolvedThreads.length > 0
        ? resolvedThreads.reduce((acc, t) => {
            const created = new Date(t.created_at).getTime()
            const resolved = new Date(t.resolved_at!).getTime()
            return acc + (resolved - created) / (1000 * 60 * 60) // Convert to hours
          }, 0) / resolvedThreads.length
        : 0

    return {
      totalRequests,
      approvalRate: Math.round(approvalRate),
      avgTimeToApproval: Math.round(avgTimeToApproval * 10) / 10,
    }
  } catch (error) {
    console.error('Error fetching team metrics:', error)
    return { totalRequests: 0, approvalRate: 0, avgTimeToApproval: 0 }
  }
}

/**
 * Get partner workspace data
 */
export async function getPartnerWorkspace(
  userId: string,
  enterpriseId: string
): Promise<PartnerWorkspace | null> {
  try {
    const userRole = await getUserRoleArchetype(userId, enterpriseId)
    const availableClients = await getAvailableWorkspaces(userId, enterpriseId)
    const personalRequests = await getPersonalRequests(userId, enterpriseId)
    const teamMetrics = await getTeamMetrics(enterpriseId)

    return {
      userRole: userRole || 'contributor',
      availableClients,
      personalRequests,
      teamMetrics,
    }
  } catch (error) {
    console.error('Error fetching partner workspace:', error)
    return null
  }
}

