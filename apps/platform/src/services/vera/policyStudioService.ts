/**
 * Policy Studio Service
 * 
 * Provides CRUD operations for managing policies and policy versions
 * in the VERA Platform's Policy Studio.
 */

import { supabase } from '@/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export type PolicyStatus = 'draft' | 'review' | 'published' | 'archived'
export type InheritanceMode = 'replace' | 'merge' | 'append'

export interface Policy {
  id: string
  title: string
  description: string | null
  enterprise_id: string
  created_by: string | null
  created_at: string
  updated_at: string
  status: PolicyStatus
  scope_id: string | null
  parent_policy_id: string | null
  inheritance_mode: InheritanceMode
  override_rules: Record<string, any>
  is_inherited: boolean
  pom: Record<string, any>
  source_document_path: string | null
  document_metadata: Record<string, any>
}

export interface PolicyListItem {
  id: string
  title: string
  description: string | null
  status: PolicyStatus
  created_at: string
  updated_at: string
  version_count: number
  latest_version: number | null
}

export interface PolicyVersion {
  id: string
  policy_id: string
  version_number: number
  title: string
  description: string | null
  rules: PolicyRules
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  distributed_at: string | null
  created_by: string | null
  created_at: string
  tool_whitelist: string[]
  control_mappings: Record<string, any>
  jurisdictions: string[]
}

export interface PolicyRules {
  tool_categories?: {
    allowed: string[]
    blocked: string[]
    requires_approval: string[]
  }
  data_handling?: {
    allowed_data_types: string[]
    prohibited_data_types: string[]
    retention_days: number
  }
  usage_restrictions?: {
    max_daily_requests?: number
    allowed_use_cases: string[]
    prohibited_use_cases: string[]
  }
  compliance_requirements?: {
    required_certifications: string[]
    audit_frequency: string
    documentation_requirements: string[]
  }
  custom_rules?: Array<{
    id: string
    name: string
    condition: string
    action: 'allow' | 'block' | 'flag' | 'require_approval'
    priority: number
  }>
}

export interface PolicyFilters {
  status?: PolicyStatus | PolicyStatus[]
  search?: string
  scope_id?: string
  limit?: number
  offset?: number
}

export interface CreatePolicyInput {
  title: string
  description?: string
  enterprise_id: string
  scope_id?: string
  parent_policy_id?: string
  inheritance_mode?: InheritanceMode
  status?: PolicyStatus
  initial_rules?: PolicyRules
}

export interface UpdatePolicyInput {
  title?: string
  description?: string
  status?: PolicyStatus
  scope_id?: string
  parent_policy_id?: string
  inheritance_mode?: InheritanceMode
  override_rules?: Record<string, any>
  pom?: Record<string, any>
}

export interface CreateVersionInput {
  policy_id: string
  title: string
  description?: string
  rules: PolicyRules
  tool_whitelist?: string[]
  control_mappings?: Record<string, any>
  jurisdictions?: string[]
}

// =============================================================================
// Policy CRUD Operations
// =============================================================================

/**
 * Get all policies for an enterprise with optional filtering
 */
export async function getPolicies(
  enterpriseId: string,
  filters: PolicyFilters = {}
): Promise<PolicyListItem[]> {
  // Guard against missing enterpriseId
  if (!enterpriseId || enterpriseId === 'undefined') {
    console.warn('[policyStudioService] getPolicies called without valid enterpriseId')
    return []
  }

  const { status, search, scope_id, limit = 50, offset = 0 } = filters

  let query = supabase
    .from('policies')
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      updated_at,
      policy_versions(id, version_number)
    `)
    .eq('enterprise_id', enterpriseId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply status filter
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status)
    } else {
      query = query.eq('status', status)
    }
  }

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply scope filter
  if (scope_id) {
    query = query.eq('scope_id', scope_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching policies:', error)
    throw error
  }

  // Transform the data to include version counts
  return (data || []).map((policy: any) => ({
    id: policy.id,
    title: policy.title,
    description: policy.description,
    status: policy.status,
    created_at: policy.created_at,
    updated_at: policy.updated_at,
    version_count: policy.policy_versions?.length || 0,
    latest_version: policy.policy_versions?.length > 0
      ? Math.max(...policy.policy_versions.map((v: any) => v.version_number))
      : null
  }))
}

/**
 * Get a single policy by ID with full details
 */
export async function getPolicy(policyId: string): Promise<Policy | null> {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching policy:', error)
    throw error
  }

  return data as Policy
}

/**
 * Create a new policy
 */
export async function createPolicy(input: CreatePolicyInput): Promise<Policy> {
  const { data: policy, error: policyError } = await supabase
    .from('policies')
    .insert({
      title: input.title,
      description: input.description || null,
      enterprise_id: input.enterprise_id,
      scope_id: input.scope_id || null,
      parent_policy_id: input.parent_policy_id || null,
      inheritance_mode: input.inheritance_mode || 'merge',
      status: input.status || 'draft',
      pom: {},
      override_rules: {},
      document_metadata: {},
      is_inherited: false
    })
    .select()
    .single()

  if (policyError) {
    console.error('Error creating policy:', policyError)
    throw policyError
  }

  // Create initial version if rules provided
  if (input.initial_rules) {
    await createPolicyVersion({
      policy_id: policy.id,
      title: input.title,
      description: input.description,
      rules: input.initial_rules
    })
  }

  return policy as Policy
}

/**
 * Update an existing policy
 */
export async function updatePolicy(
  policyId: string,
  input: UpdatePolicyInput
): Promise<Policy> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  }

  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description
  if (input.status !== undefined) updateData.status = input.status
  if (input.scope_id !== undefined) updateData.scope_id = input.scope_id
  if (input.parent_policy_id !== undefined) updateData.parent_policy_id = input.parent_policy_id
  if (input.inheritance_mode !== undefined) updateData.inheritance_mode = input.inheritance_mode
  if (input.override_rules !== undefined) updateData.override_rules = input.override_rules
  if (input.pom !== undefined) updateData.pom = input.pom

  const { data, error } = await supabase
    .from('policies')
    .update(updateData)
    .eq('id', policyId)
    .select()
    .single()

  if (error) {
    console.error('Error updating policy:', error)
    throw error
  }

  return data as Policy
}

/**
 * Delete a policy (soft delete by archiving)
 */
export async function archivePolicy(policyId: string): Promise<void> {
  const { error } = await supabase
    .from('policies')
    .update({ 
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .eq('id', policyId)

  if (error) {
    console.error('Error archiving policy:', error)
    throw error
  }
}

/**
 * Permanently delete a policy (use with caution)
 */
export async function deletePolicy(policyId: string): Promise<void> {
  // First delete all versions
  const { error: versionsError } = await supabase
    .from('policy_versions')
    .delete()
    .eq('policy_id', policyId)

  if (versionsError) {
    console.error('Error deleting policy versions:', versionsError)
    throw versionsError
  }

  // Then delete the policy
  const { error } = await supabase
    .from('policies')
    .delete()
    .eq('id', policyId)

  if (error) {
    console.error('Error deleting policy:', error)
    throw error
  }
}

// =============================================================================
// Policy Version Operations
// =============================================================================

/**
 * Get all versions of a policy
 */
export async function getPolicyVersions(policyId: string): Promise<PolicyVersion[]> {
  const { data, error } = await supabase
    .from('policy_versions')
    .select('*')
    .eq('policy_id', policyId)
    .order('version_number', { ascending: false })

  if (error) {
    console.error('Error fetching policy versions:', error)
    throw error
  }

  return (data || []) as PolicyVersion[]
}

/**
 * Get a specific version of a policy
 */
export async function getPolicyVersion(versionId: string): Promise<PolicyVersion | null> {
  const { data, error } = await supabase
    .from('policy_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching policy version:', error)
    throw error
  }

  return data as PolicyVersion
}

/**
 * Get the latest published version of a policy
 */
export async function getLatestPublishedVersion(policyId: string): Promise<PolicyVersion | null> {
  const { data, error } = await supabase
    .from('policy_versions')
    .select('*')
    .eq('policy_id', policyId)
    .eq('status', 'published')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching latest published version:', error)
    throw error
  }

  return data as PolicyVersion
}

/**
 * Create a new version of a policy
 */
export async function createPolicyVersion(input: CreateVersionInput): Promise<PolicyVersion> {
  // Get the current max version number
  const { data: existingVersions } = await supabase
    .from('policy_versions')
    .select('version_number')
    .eq('policy_id', input.policy_id)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersion = existingVersions && existingVersions.length > 0
    ? existingVersions[0].version_number + 1
    : 1

  const { data, error } = await supabase
    .from('policy_versions')
    .insert({
      policy_id: input.policy_id,
      version_number: nextVersion,
      title: input.title,
      description: input.description || null,
      rules: input.rules,
      status: 'draft',
      tool_whitelist: input.tool_whitelist || [],
      control_mappings: input.control_mappings || {},
      jurisdictions: input.jurisdictions || []
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating policy version:', error)
    throw error
  }

  return data as PolicyVersion
}

/**
 * Update a policy version (only allowed for draft versions)
 */
export async function updatePolicyVersion(
  versionId: string,
  updates: Partial<Pick<PolicyVersion, 'title' | 'description' | 'rules' | 'tool_whitelist' | 'control_mappings' | 'jurisdictions'>>
): Promise<PolicyVersion> {
  // First check if version is draft
  const { data: existingVersion } = await supabase
    .from('policy_versions')
    .select('status')
    .eq('id', versionId)
    .single()

  if (existingVersion?.status !== 'draft') {
    throw new Error('Cannot update a published or archived version. Create a new version instead.')
  }

  const { data, error } = await supabase
    .from('policy_versions')
    .update(updates)
    .eq('id', versionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating policy version:', error)
    throw error
  }

  return data as PolicyVersion
}

/**
 * Publish a draft version
 */
export async function publishPolicyVersion(versionId: string): Promise<PolicyVersion> {
  const { data, error } = await supabase
    .from('policy_versions')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', versionId)
    .select()
    .single()

  if (error) {
    console.error('Error publishing policy version:', error)
    throw error
  }

  // Also update the parent policy status
  if (data) {
    await supabase
      .from('policies')
      .update({ 
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.policy_id)
  }

  return data as PolicyVersion
}

/**
 * Archive a version
 */
export async function archivePolicyVersion(versionId: string): Promise<void> {
  const { error } = await supabase
    .from('policy_versions')
    .update({ status: 'archived' })
    .eq('id', versionId)

  if (error) {
    console.error('Error archiving policy version:', error)
    throw error
  }
}

// =============================================================================
// Version Comparison
// =============================================================================

export interface VersionDiff {
  field: string
  path: string[]
  oldValue: any
  newValue: any
  changeType: 'added' | 'removed' | 'changed'
}

/**
 * Compare two policy versions and return the differences
 */
export function compareVersions(
  oldVersion: PolicyVersion,
  newVersion: PolicyVersion
): VersionDiff[] {
  const diffs: VersionDiff[] = []

  // Compare rules
  const oldRules = oldVersion.rules || {}
  const newRules = newVersion.rules || {}

  // Deep compare function
  function deepCompare(
    oldObj: Record<string, any>,
    newObj: Record<string, any>,
    path: string[] = []
  ) {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    for (const key of allKeys) {
      const currentPath = [...path, key]
      const oldVal = oldObj[key]
      const newVal = newObj[key]

      if (oldVal === undefined && newVal !== undefined) {
        diffs.push({
          field: key,
          path: currentPath,
          oldValue: undefined,
          newValue: newVal,
          changeType: 'added'
        })
      } else if (oldVal !== undefined && newVal === undefined) {
        diffs.push({
          field: key,
          path: currentPath,
          oldValue: oldVal,
          newValue: undefined,
          changeType: 'removed'
        })
      } else if (typeof oldVal === 'object' && typeof newVal === 'object' && 
                 oldVal !== null && newVal !== null &&
                 !Array.isArray(oldVal) && !Array.isArray(newVal)) {
        deepCompare(oldVal, newVal, currentPath)
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({
          field: key,
          path: currentPath,
          oldValue: oldVal,
          newValue: newVal,
          changeType: 'changed'
        })
      }
    }
  }

  deepCompare(oldRules, newRules, ['rules'])

  // Compare other fields
  if (oldVersion.title !== newVersion.title) {
    diffs.push({
      field: 'title',
      path: ['title'],
      oldValue: oldVersion.title,
      newValue: newVersion.title,
      changeType: 'changed'
    })
  }

  if (oldVersion.description !== newVersion.description) {
    diffs.push({
      field: 'description',
      path: ['description'],
      oldValue: oldVersion.description,
      newValue: newVersion.description,
      changeType: 'changed'
    })
  }

  if (JSON.stringify(oldVersion.jurisdictions) !== JSON.stringify(newVersion.jurisdictions)) {
    diffs.push({
      field: 'jurisdictions',
      path: ['jurisdictions'],
      oldValue: oldVersion.jurisdictions,
      newValue: newVersion.jurisdictions,
      changeType: 'changed'
    })
  }

  return diffs
}

// =============================================================================
// Policy Statistics
// =============================================================================

export interface PolicyStats {
  total: number
  byStatus: Record<PolicyStatus, number>
  recentlyUpdated: number
  withVersions: number
}

/**
 * Get policy statistics for an enterprise
 */
export async function getPolicyStats(enterpriseId: string): Promise<PolicyStats> {
  // Guard against missing enterpriseId
  if (!enterpriseId || enterpriseId === 'undefined') {
    console.warn('[policyStudioService] getPolicyStats called without valid enterpriseId')
    return {
      total: 0,
      byStatus: { draft: 0, review: 0, published: 0, archived: 0 },
      recentlyUpdated: 0,
      withVersions: 0
    }
  }

  const { data, error } = await supabase
    .from('policies')
    .select(`
      id,
      status,
      updated_at,
      policy_versions(id)
    `)
    .eq('enterprise_id', enterpriseId)

  if (error) {
    console.error('Error fetching policy stats:', error)
    throw error
  }

  const policies = data || []
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const stats: PolicyStats = {
    total: policies.length,
    byStatus: {
      draft: 0,
      review: 0,
      published: 0,
      archived: 0
    },
    recentlyUpdated: 0,
    withVersions: 0
  }

  for (const policy of policies) {
    stats.byStatus[policy.status as PolicyStatus]++
    
    if (new Date(policy.updated_at) > oneWeekAgo) {
      stats.recentlyUpdated++
    }
    
    if ((policy as any).policy_versions?.length > 0) {
      stats.withVersions++
    }
  }

  return stats
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  // Policies
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  archivePolicy,
  deletePolicy,
  
  // Versions
  getPolicyVersions,
  getPolicyVersion,
  getLatestPublishedVersion,
  createPolicyVersion,
  updatePolicyVersion,
  publishPolicyVersion,
  archivePolicyVersion,
  
  // Utilities
  compareVersions,
  getPolicyStats
}

