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

  private static adobeMap: Record<string, string> = {
    'aicomplyr.project_id': 'aicomplyr:projectId',
    'aicomplyr.organization_id': 'aicomplyr:organizationId',
    'aicomplyr.activity_id': 'aicomplyr:activityId',
    'compliance.status': 'aicomplyr:complianceStatus',
    'compliance.score': 'aicomplyr:complianceScore',
    'compliance.risk_level': 'aicomplyr:riskLevel',
    'compliance.last_checked': 'aicomplyr:lastChecked',
  }

  static toVeeva(metadata: ComplianceMetadata): TransformResult {
    return this.mapUsing(metadata, this.veevaMap)
  }

  static toSharePoint(metadata: ComplianceMetadata): TransformResult {
    return this.mapUsing(metadata, this.sharepointMap)
  }

  static toAdobe(metadata: ComplianceMetadata): TransformResult {
    // Adobe uses XMP format, so we just map the keys
    return this.mapUsing(metadata, this.adobeMap)
  }
  
  static fromAdobe(xmpData: Record<string, unknown>): TransformResult<ComplianceMetadata> {
    // Reverse mapping from Adobe XMP to ComplianceMetadata
    try {
      const reverseMap: Record<string, string> = {}
      for (const [key, value] of Object.entries(this.adobeMap)) {
        reverseMap[value] = key
      }
      
      const result = this.mapUsing(xmpData, reverseMap)
      if (!result.success) return result as any
      
      // Reconstruct nested structure
      const unflattened = this.unflatten(result.data)
      return { success: true, data: unflattened as ComplianceMetadata }
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
  
  private static unflatten(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const parts = key.split('.')
      let current: any = result
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!(part in current)) {
          current[part] = {}
        }
        current = current[part]
      }
      
      current[parts[parts.length - 1]] = value
    }
    
    return result
  }
}


