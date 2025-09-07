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

  static toVeeva(metadata: ComplianceMetadata): TransformResult {
    return this.mapUsing(metadata, this.veevaMap)
  }

  static toSharePoint(metadata: ComplianceMetadata): TransformResult {
    return this.mapUsing(metadata, this.sharepointMap)
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


