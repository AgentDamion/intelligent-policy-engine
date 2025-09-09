import { ComplianceMetadata } from './platform-adapter-types.ts'

// Universal -> Platform-specific metadata transformer
export type TransformResult<T = Record<string, unknown>> = {
  success: true
  data: T
  warnings?: string[]
} | {
  success: false
  error: string
  warnings?: string[]
}

export class MetadataTransformer {
  // Example platform key maps
  private static veevaMap: Record<string, string> = {
    'aicomplyr.project_id': 'aicomplyr__project_id__c',
    'aicomplyr.organization_id': 'aicomplyr__organization_id__c',
    'compliance.status': 'aicomplyr__compliance_status__c',
    'compliance.score': 'aicomplyr__compliance_score__c',
    'compliance.risk_level': 'aicomplyr__risk_level__c',
  }

  private static sharepointMap: Record<string, string> = {
    'aicomplyr.project_id': 'AICOMPLYR_ProjectId',
    'aicomplyr.organization_id': 'AICOMPLYR_OrgId',
    'compliance.status': 'ComplianceStatus',
    'compliance.score': 'ComplianceScore',
    'compliance.risk_level': 'RiskLevel',
  }

  private static adobeXMPMap: Record<string, string> = {
    'aicomplyr.version': 'aicomplyr:version',
    'aicomplyr.generated_at': 'aicomplyr:generated_at',
    'aicomplyr.project_id': 'aicomplyr:project_id',
    'aicomplyr.organization_id': 'aicomplyr:organization_id',
    'aicomplyr.activity_id': 'aicomplyr:activity_id',
    'compliance.status': 'aicomplyr:compliance_status',
    'compliance.score': 'aicomplyr:compliance_score',
    'compliance.risk_level': 'aicomplyr:risk_level',
    'compliance.last_checked': 'aicomplyr:last_checked',
    'ai_tools': 'aicomplyr:ai_tools',
    'policy_checks': 'aicomplyr:policy_checks',
    'violations': 'aicomplyr:violations',
    'references': 'aicomplyr:references',
  }

  static toVeeva(metadata: ComplianceMetadata): TransformResult {
    return this.mapUsing(metadata, this.veevaMap)
  }

  static toSharePoint(metadata: ComplianceMetadata): TransformResult {
    return this.mapUsing(metadata, this.sharepointMap)
  }

  static toAdobe(metadata: ComplianceMetadata): TransformResult {
    return this.mapUsing(metadata, this.adobeXMPMap)
  }

  static fromAdobe(xmpData: Record<string, unknown>): TransformResult<ComplianceMetadata> {
    try {
      const metadata: ComplianceMetadata = {
        aicomplyr: {
          version: xmpData['aicomplyr:version'] as string || '1.0.0',
          generated_at: xmpData['aicomplyr:generated_at'] as string || new Date().toISOString(),
          project_id: xmpData['aicomplyr:project_id'] as string || '',
          organization_id: xmpData['aicomplyr:organization_id'] as string || '',
          activity_id: xmpData['aicomplyr:activity_id'] as string
        },
        compliance: {
          status: xmpData['aicomplyr:compliance_status'] as 'compliant' | 'warning' | 'violation' || 'unknown',
          score: xmpData['aicomplyr:compliance_score'] as number || 0,
          risk_level: xmpData['aicomplyr:risk_level'] as 'low' | 'medium' | 'high' | 'critical' || 'unknown',
          last_checked: xmpData['aicomplyr:last_checked'] as string || new Date().toISOString()
        },
        ai_tools: xmpData['aicomplyr:ai_tools'] ? JSON.parse(xmpData['aicomplyr:ai_tools'] as string) : [],
        policy_checks: xmpData['aicomplyr:policy_checks'] ? JSON.parse(xmpData['aicomplyr:policy_checks'] as string) : [],
        violations: xmpData['aicomplyr:violations'] ? JSON.parse(xmpData['aicomplyr:violations'] as string) : [],
        references: xmpData['aicomplyr:references'] ? JSON.parse(xmpData['aicomplyr:references'] as string) : {}
      }

      return { success: true, data: metadata }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  private static mapUsing(metadata: ComplianceMetadata, map: Record<string, string>): TransformResult {
    try {
      const flat = this.flatten(metadata)
      const out: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(flat)) {
        const target = map[key]
        if (target) out[target] = value
      }
      return { success: true, data: out }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  // Utilities
  private static flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const res: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(res, this.flatten(v as any, key))
      else res[key] = v
    }
    return res
  }
}


