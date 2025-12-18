# Phase 1, Step 3: TypeScript Types Extension

## Prompt to paste into Lovable:

```
Extend the existing RFP types in src/types/rfp.ts to support tool disclosure and policy validation.

ADD the following new interfaces to the EXISTING file (do not remove any existing types):

1. ToolDisclosure - Structure for disclosed AI tools in RFP responses
   - id, distribution_id, tool_id (optional), tool_name, version, provider
   - intended_use, data_scope (object), connectors (array)
   - created_at, updated_at

2. PolicyCheckStatus - Type union of 'COMPLIANT' | 'PENDING' | 'RESTRICTED'

3. PolicyResolutionItem - Individual tool validation result
   - tool_name, version, provider, status (PolicyCheckStatus)
   - reasons (string array), failed_controls (string array)

4. PolicyResolutionResult - Complete validation result
   - id, distribution_id, overall_score (0-100)
   - items (array of PolicyResolutionItem)
   - created_at

5. PolicyPack - Client policy configuration
   - id, client_id, name
   - tool_whitelist (array with name, provider, versions, data_scope)
   - control_mappings (object)
   - jurisdictions (string array)

Keep all existing RFP types intact. These are additive only.
```

## Expected Code:

```typescript
// ADD to existing src/types/rfp.ts (keep all existing types)

export interface ToolDisclosure {
  id?: string;
  distribution_id: string;
  tool_id?: string;
  tool_name: string;
  version?: string;
  provider?: string;
  intended_use?: string;
  data_scope?: {
    pii?: boolean;
    hipaa?: boolean;
    regions?: string[];
    data_types?: string[];
  };
  connectors?: string[];
  created_at?: string;
  updated_at?: string;
}

export type PolicyCheckStatus = 'COMPLIANT' | 'PENDING' | 'RESTRICTED';

export interface PolicyResolutionItem {
  tool_name: string;
  version?: string;
  provider?: string;
  status: PolicyCheckStatus;
  reasons: string[];
  failed_controls: string[];
}

export interface PolicyResolutionResult {
  id: string;
  distribution_id: string;
  overall_score: number;
  items: PolicyResolutionItem[];
  created_at: string;
}

export interface PolicyPack {
  id: string;
  client_id?: string;
  name: string;
  tool_whitelist: Array<{
    name: string;
    provider: string;
    versions: string[];
    data_scope: {
      pii: boolean;
      hipaa: boolean;
      regions: string[];
    };
  }>;
  control_mappings: Record<string, string>;
  jurisdictions: string[];
  created_at?: string;
  updated_at?: string;
}
```
