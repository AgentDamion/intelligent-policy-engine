// Temporary RPC types until migrations run and types.ts regenerates

export interface AppPolicyListRow {
  policy_id: string;
  title: string;
  version: string;
  status: string;
  owner: string;
  effective_date: string;
  updated_at: string;
}

export interface AppToolPolicyClausesRow {
  tool_id: number;
  tool_name: string;
  policy_id: string;
  policy_title: string;
  policy_version: string;
  clause_id: string;
  clause_ref: string;
  lane: string;
  clause_text: string;
}
