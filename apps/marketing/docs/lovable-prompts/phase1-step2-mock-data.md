# Phase 1, Step 2: Mock Data Seed

## Prompt to paste into Lovable:

```
Create a mock data seed script for development/testing of the tool disclosure and validation system.

Create a new file: src/lib/devdata/rfpValidationMockData.ts

This file should export:

1. mockPolicyPack - A sample policy pack with:
   - tool_whitelist containing approved tools (ChatGPT Enterprise, Adobe Firefly, Grammarly Business)
   - Each whitelisted tool should have: name, provider, approved versions array, allowed data_scope
   - control_mappings for key controls: CTRL-VERS-001 (version pinning), CTRL-DATA-002 (data scope), CTRL-BL-000 (blacklist)
   - jurisdictions: ['US', 'EU']

2. mockToolDisclosures - Array of 4 sample tool disclosures:
   - ChatGPT Enterprise (compliant: approved version, matching scope)
   - Midjourney (pending: not in whitelist)
   - Adobe Firefly (compliant: approved)
   - Claude API (pending: version not approved)

3. mockPolicyResolution - Expected resolution result showing:
   - Per-tool status (COMPLIANT/PENDING/RESTRICTED)
   - Reasons for non-compliant tools
   - Failed control IDs
   - Overall score calculation

Include TypeScript types for all exports matching the RFP types.
```

## Expected Output:

```typescript
// src/lib/devdata/rfpValidationMockData.ts
import { RFPQuestion } from '@/types/rfp';

export interface PolicyPack {
  id: string;
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
}

export interface ToolDisclosure {
  id?: string;
  tool_name: string;
  version?: string;
  provider?: string;
  intended_use?: string;
  data_scope?: {
    pii: boolean;
    hipaa: boolean;
    regions: string[];
  };
  connectors?: string[];
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

export interface PolicyResolution {
  id: string;
  distribution_id: string;
  overall_score: number;
  items: PolicyResolutionItem[];
  created_at: string;
}

export const mockPolicyPack: PolicyPack = {
  id: 'pack-pharma-2025',
  name: 'Pharma Enterprise - MLR Compliance 2025',
  tool_whitelist: [
    {
      name: 'ChatGPT Enterprise',
      provider: 'OpenAI',
      versions: ['GPT-4o-2024-05-13', 'GPT-4.1-2024-08-06'],
      data_scope: { pii: false, hipaa: false, regions: ['US', 'EU'] }
    },
    {
      name: 'Adobe Firefly',
      provider: 'Adobe',
      versions: ['3.0', '3.1'],
      data_scope: { pii: false, hipaa: false, regions: ['US', 'EU'] }
    },
    {
      name: 'Grammarly Business',
      provider: 'Grammarly',
      versions: ['2024.1'],
      data_scope: { pii: false, hipaa: false, regions: ['US', 'EU'] }
    }
  ],
  control_mappings: {
    'CTRL-VERS-001': 'Model version must be pinned to approved list',
    'CTRL-DATA-002': 'Data scope must match approved jurisdictions and PII/HIPAA restrictions',
    'CTRL-BL-000': 'Restricted tools cannot be used under any circumstances'
  },
  jurisdictions: ['US', 'EU']
};

export const mockToolDisclosures: ToolDisclosure[] = [
  {
    id: 'disc-1',
    tool_name: 'ChatGPT Enterprise',
    version: 'GPT-4o-2024-05-13',
    provider: 'OpenAI',
    intended_use: 'Copy refinement and content QA',
    data_scope: { pii: false, hipaa: false, regions: ['US', 'EU'] },
    connectors: ['Veeva-ReadOnly']
  },
  {
    id: 'disc-2',
    tool_name: 'Midjourney',
    version: 'v6',
    provider: 'Midjourney Inc',
    intended_use: 'Concept art exploration',
    data_scope: { pii: false, hipaa: false, regions: ['US'] },
    connectors: []
  },
  {
    id: 'disc-3',
    tool_name: 'Adobe Firefly',
    version: '3.0',
    provider: 'Adobe',
    intended_use: 'Final production imagery',
    data_scope: { pii: false, hipaa: false, regions: ['US'] },
    connectors: ['Adobe Creative Cloud']
  },
  {
    id: 'disc-4',
    tool_name: 'Claude API',
    version: 'claude-3-opus-20240229',
    provider: 'Anthropic',
    intended_use: 'Document summarization',
    data_scope: { pii: false, hipaa: false, regions: ['US'] },
    connectors: []
  }
];

export const mockPolicyResolution: PolicyResolution = {
  id: 'res-dev-001',
  distribution_id: 'dist-dev-001',
  overall_score: 50, // 2 out of 4 compliant
  items: [
    {
      tool_name: 'ChatGPT Enterprise',
      version: 'GPT-4o-2024-05-13',
      provider: 'OpenAI',
      status: 'COMPLIANT',
      reasons: [],
      failed_controls: []
    },
    {
      tool_name: 'Midjourney',
      version: 'v6',
      provider: 'Midjourney Inc',
      status: 'PENDING',
      reasons: ['Tool not in approved whitelist'],
      failed_controls: []
    },
    {
      tool_name: 'Adobe Firefly',
      version: '3.0',
      provider: 'Adobe',
      status: 'COMPLIANT',
      reasons: [],
      failed_controls: []
    },
    {
      tool_name: 'Claude API',
      version: 'claude-3-opus-20240229',
      provider: 'Anthropic',
      status: 'PENDING',
      reasons: ['Tool not in approved whitelist'],
      failed_controls: []
    }
  ],
  created_at: new Date().toISOString()
};
```
