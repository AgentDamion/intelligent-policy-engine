/**
 * VERA Preferences Service
 * 
 * Manages VERA configuration and preferences:
 * - Operating mode (Shadow/Enforcement/Disabled)
 * - Velocity coefficients (avg_campaign_value, avg_manual_review_days)
 * - Notification preferences
 * - Feature flags (auto_clear, dlp, meta_loop)
 */

import { supabase } from '../../lib/supabase'

// Types
export type VERAMode = 'shadow' | 'enforcement' | 'disabled'

export interface NotificationPreferences {
  email_on_decision: boolean
  email_on_alert: boolean
  email_on_proof_bundle: boolean
  slack_webhook_url: string | null
  slack_channel: string | null
  realtime_enabled: boolean
}

export interface VERAPreferences {
  id: string
  enterpriseId: string
  veraMode: VERAMode
  avgCampaignValueUsd: number
  avgManualReviewDays: number
  avgToolProcurementDays: number
  notificationPreferences: NotificationPreferences
  autoClearEnabled: boolean
  autoClearThreshold: number
  dlpEnabled: boolean
  metaLoopEnabled: boolean
  proofBundleRetentionDays: number
  auditLogRetentionDays: number
  createdAt: Date
  updatedAt: Date
}

export interface UpdateVERAPreferencesInput {
  veraMode?: VERAMode
  avgCampaignValueUsd?: number
  avgManualReviewDays?: number
  avgToolProcurementDays?: number
  notificationPreferences?: Partial<NotificationPreferences>
  autoClearEnabled?: boolean
  autoClearThreshold?: number
  dlpEnabled?: boolean
  metaLoopEnabled?: boolean
  proofBundleRetentionDays?: number
  auditLogRetentionDays?: number
}

/**
 * Get VERA preferences for an enterprise
 */
export async function getVERAPreferences(enterpriseId: string): Promise<VERAPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('vera_preferences')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    if (!data) return null

    return mapToVERAPreferences(data)
  } catch (error) {
    console.error('[VERAPreferencesService] Error fetching preferences:', error)
    return null
  }
}

/**
 * Get VERA mode for an enterprise (quick lookup)
 */
export async function getVERAMode(enterpriseId: string): Promise<VERAMode> {
  try {
    // First check vera_preferences table
    const { data: prefData } = await supabase
      .from('vera_preferences')
      .select('vera_mode')
      .eq('enterprise_id', enterpriseId)
      .single()

    if (prefData?.vera_mode) {
      return prefData.vera_mode as VERAMode
    }

    // Fall back to enterprises table
    const { data: entData } = await supabase
      .from('enterprises')
      .select('vera_mode')
      .eq('id', enterpriseId)
      .single()

    return (entData?.vera_mode as VERAMode) || 'shadow'
  } catch (error) {
    console.error('[VERAPreferencesService] Error fetching VERA mode:', error)
    return 'shadow' // Default to shadow mode
  }
}

/**
 * Set VERA mode for an enterprise
 * Also logs the transition in vera_mode_transitions table
 */
export async function setVERAMode(
  enterpriseId: string,
  mode: VERAMode,
  reason?: string
): Promise<boolean> {
  try {
    // Get current mode for transition logging
    const currentMode = await getVERAMode(enterpriseId)

    // Update vera_preferences
    const { error: prefError } = await supabase
      .from('vera_preferences')
      .upsert({
        enterprise_id: enterpriseId,
        vera_mode: mode,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'enterprise_id'
      })

    if (prefError) throw prefError

    // Also update enterprises table for backward compatibility
    const { error: entError } = await supabase
      .from('enterprises')
      .update({ vera_mode: mode })
      .eq('id', enterpriseId)

    if (entError) {
      console.warn('[VERAPreferencesService] Failed to update enterprises table:', entError)
    }

    // Log the transition
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('vera_mode_transitions')
      .insert({
        enterprise_id: enterpriseId,
        from_mode: currentMode,
        to_mode: mode,
        transitioned_by: user?.id,
        reason: reason || `Mode changed from ${currentMode} to ${mode}`
      })

    console.log(`[VERAPreferencesService] VERA mode changed: ${currentMode} -> ${mode}`)
    return true
  } catch (error) {
    console.error('[VERAPreferencesService] Error setting VERA mode:', error)
    return false
  }
}

/**
 * Update VERA preferences
 */
export async function updateVERAPreferences(
  enterpriseId: string,
  updates: UpdateVERAPreferencesInput
): Promise<VERAPreferences | null> {
  try {
    // Build update object
    const updateData: Record<string, any> = {
      enterprise_id: enterpriseId,
      updated_at: new Date().toISOString()
    }

    if (updates.veraMode !== undefined) {
      updateData.vera_mode = updates.veraMode
    }
    if (updates.avgCampaignValueUsd !== undefined) {
      updateData.avg_campaign_value_usd = updates.avgCampaignValueUsd
    }
    if (updates.avgManualReviewDays !== undefined) {
      updateData.avg_manual_review_days = updates.avgManualReviewDays
    }
    if (updates.avgToolProcurementDays !== undefined) {
      updateData.avg_tool_procurement_days = updates.avgToolProcurementDays
    }
    if (updates.notificationPreferences !== undefined) {
      // Merge with existing notification preferences
      const existing = await getVERAPreferences(enterpriseId)
      const currentNotifs = existing?.notificationPreferences || getDefaultNotificationPreferences()
      updateData.notification_preferences = {
        ...currentNotifs,
        ...updates.notificationPreferences
      }
    }
    if (updates.autoClearEnabled !== undefined) {
      updateData.auto_clear_enabled = updates.autoClearEnabled
    }
    if (updates.autoClearThreshold !== undefined) {
      updateData.auto_clear_threshold = updates.autoClearThreshold
    }
    if (updates.dlpEnabled !== undefined) {
      updateData.dlp_enabled = updates.dlpEnabled
    }
    if (updates.metaLoopEnabled !== undefined) {
      updateData.meta_loop_enabled = updates.metaLoopEnabled
    }
    if (updates.proofBundleRetentionDays !== undefined) {
      updateData.proof_bundle_retention_days = updates.proofBundleRetentionDays
    }
    if (updates.auditLogRetentionDays !== undefined) {
      updateData.audit_log_retention_days = updates.auditLogRetentionDays
    }

    const { data, error } = await supabase
      .from('vera_preferences')
      .upsert(updateData, {
        onConflict: 'enterprise_id'
      })
      .select()
      .single()

    if (error) throw error

    // If mode was changed, also update enterprises table
    if (updates.veraMode !== undefined) {
      await supabase
        .from('enterprises')
        .update({ vera_mode: updates.veraMode })
        .eq('id', enterpriseId)
    }

    return mapToVERAPreferences(data)
  } catch (error) {
    console.error('[VERAPreferencesService] Error updating preferences:', error)
    return null
  }
}

/**
 * Create default VERA preferences for an enterprise
 */
export async function createDefaultVERAPreferences(enterpriseId: string): Promise<VERAPreferences | null> {
  try {
    const defaultPrefs = {
      enterprise_id: enterpriseId,
      vera_mode: 'shadow' as VERAMode,
      avg_campaign_value_usd: 150000,
      avg_manual_review_days: 14,
      avg_tool_procurement_days: 30,
      notification_preferences: getDefaultNotificationPreferences(),
      auto_clear_enabled: true,
      auto_clear_threshold: 0.95,
      dlp_enabled: true,
      meta_loop_enabled: false,
      proof_bundle_retention_days: 365,
      audit_log_retention_days: 730
    }

    const { data, error } = await supabase
      .from('vera_preferences')
      .insert(defaultPrefs)
      .select()
      .single()

    if (error) throw error

    return mapToVERAPreferences(data)
  } catch (error) {
    console.error('[VERAPreferencesService] Error creating default preferences:', error)
    return null
  }
}

/**
 * Get or create VERA preferences for an enterprise
 */
export async function getOrCreateVERAPreferences(enterpriseId: string): Promise<VERAPreferences | null> {
  const existing = await getVERAPreferences(enterpriseId)
  if (existing) return existing
  return createDefaultVERAPreferences(enterpriseId)
}

/**
 * Get VERA mode transition history
 */
export async function getModeTransitionHistory(
  enterpriseId: string,
  limit = 10
): Promise<Array<{
  id: string
  fromMode: VERAMode | null
  toMode: VERAMode
  transitionedBy: string | null
  transitionedAt: Date
  reason: string | null
}>> {
  try {
    const { data, error } = await supabase
      .from('vera_mode_transitions')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('transitioned_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map(row => ({
      id: row.id,
      fromMode: row.from_mode,
      toMode: row.to_mode,
      transitionedBy: row.transitioned_by,
      transitionedAt: new Date(row.transitioned_at),
      reason: row.reason
    }))
  } catch (error) {
    console.error('[VERAPreferencesService] Error fetching mode transitions:', error)
    return []
  }
}

// Helper functions

function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    email_on_decision: true,
    email_on_alert: true,
    email_on_proof_bundle: false,
    slack_webhook_url: null,
    slack_channel: null,
    realtime_enabled: true
  }
}

function mapToVERAPreferences(data: any): VERAPreferences {
  return {
    id: data.id,
    enterpriseId: data.enterprise_id,
    veraMode: data.vera_mode || 'shadow',
    avgCampaignValueUsd: data.avg_campaign_value_usd || 150000,
    avgManualReviewDays: data.avg_manual_review_days || 14,
    avgToolProcurementDays: data.avg_tool_procurement_days || 30,
    notificationPreferences: data.notification_preferences || getDefaultNotificationPreferences(),
    autoClearEnabled: data.auto_clear_enabled ?? true,
    autoClearThreshold: data.auto_clear_threshold ?? 0.95,
    dlpEnabled: data.dlp_enabled ?? true,
    metaLoopEnabled: data.meta_loop_enabled ?? false,
    proofBundleRetentionDays: data.proof_bundle_retention_days || 365,
    auditLogRetentionDays: data.audit_log_retention_days || 730,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export default {
  getVERAPreferences,
  getVERAMode,
  setVERAMode,
  updateVERAPreferences,
  createDefaultVERAPreferences,
  getOrCreateVERAPreferences,
  getModeTransitionHistory
}

