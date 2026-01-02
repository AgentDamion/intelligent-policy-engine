# AICOMPLYR Database Schema
Generated from Supabase on [January 02, 2026]

## Tables| table_schema                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ### agency_seats
- id (uuid, required, default: gen_random_uuid())
- partner_id (uuid)
- enterprise_id (uuid)
- user_id (uuid)
- role (text, required)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ### agency_subscriptions
- id (uuid, required, default: gen_random_uuid())
- agency_enterprise_id (uuid, required)
- subscription_tier (text, required, default: 'starter'::text)
- is_enterprise_mode (boolean, default: false)
- enterprise_features_enabled (jsonb, default: '{}'::jsonb)
- billing_contact_id (uuid)
- subscription_metadata (jsonb, default: '{}'::jsonb)
- activated_at (timestamp with time zone)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ### agency_task
- id (uuid, required, default: gen_random_uuid())
- workspace_id (uuid, required)
- enterprise_id (uuid)
- type (text, required)
- title (text, required)
- description (text)
- due_at (timestamp with time zone)
- status (text, required, default: 'open'::text)
- assigned_to (uuid)
- created_by (uuid)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### agent_activities
- id (bigint, required)
- created_at (timestamp with time zone, required, default: now())
- agent (text, required)
- action (text, required)
- status (text)
- details (jsonb)
- workspace_id (uuid)
- enterprise_id (uuid)
- severity (text)
- trace_id (text)
- span_id (text)
- policy_digest (text)
- ledger_hash (text)
- reasoning_steps (jsonb)
- alternatives_considered (jsonb)
- confidence_factors (jsonb)
- precedents_consulted (ARRAY)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### agent_prompts
- id (uuid, required, default: gen_random_uuid())
- agent_name (text, required)
- version (integer, required)
- prompt (text, required)
- metadata (jsonb, required, default: '{}'::jsonb)
- created_by (uuid)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### agent_prompts_v2
- id (uuid, required, default: gen_random_uuid())
- agent_type (text, required)
- prompt_version (integer, required)
- system_prompt (text, required)
- user_prompt_template (text, required)
- few_shot_examples (jsonb, default: '[]'::jsonb)
- performance_metrics (jsonb, default: '{}'::jsonb)
- is_active (boolean, default: false)
- created_by (text, default: 'system'::text)
- created_at (timestamp with time zone, default: now())
- activated_at (timestamp with time zone)
- deprecated_at (timestamp with time zone)
- parent_prompt_id (uuid)
- optimization_run_id (uuid)
- improvement_percentage (numeric)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### agent_reasoning_steps
- id (uuid, required, default: gen_random_uuid())
- activity_id (bigint)
- enterprise_id (uuid)
- workspace_id (uuid)
- trace_id (text, required)
- span_id (text, required)
- parent_span_id (text)
- step_type (text, required)
- step_order (integer, required)
- agent_name (text)
- content_hash (text)
- content (jsonb, required, default: '{}'::jsonb)
- duration_ms (integer)
- token_count (integer)
- model_used (text)
- policy_digest (text)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ### agent_task_requests
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid)
- status (text, default: 'pending'::text)
- request_payload (jsonb)
- response_payload (jsonb)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### agent_tasks
- id (bigint, required)
- workflow_id (bigint)
- agent_id (bigint)
- task_type (text, required)
- input_data (jsonb, required)
- output_data (jsonb)
- status (text, default: 'pending'::text)
- priority (integer, default: 5)
- started_at (timestamp with time zone)
- completed_at (timestamp with time zone)
- error_message (text)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ### agent_workflows
- id (bigint, required)
- name (text, required)
- description (text)
- trigger_conditions (jsonb, required)
- agent_sequence (jsonb, required)
- enterprise_id (uuid)
- status (text, default: 'active'::text)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### ai_agent_decisions
- id (bigint, required)
- created_at (timestamp with time zone, required, default: now())
- agent (text, required)
- action (text, required)
- agency (text)
- outcome (text, required)
- risk (text)
- details (jsonb)
- enterprise_id (uuid)
- risk_profile_tier (text)
- dimension_scores (jsonb)
- audit_checklist (jsonb)
- policy_digest (text)
- policy_artifact_reference (text)
- rationale_human (text)
- rationale_structured (jsonb, default: '{}'::jsonb)
- reasoning_chain (jsonb)
- decision_factors (jsonb)
- alternative_outcomes (jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ### ai_agents
- id (bigint, required)
- name (text, required)
- type (text, required)
- capabilities (jsonb, required)
- config (jsonb, default: '{}'::jsonb)
- status (text, default: 'active'::text)
- enterprise_id (uuid)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ### ai_tool_registry
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- provider (text, required)
- category (text, required)
- created_at (timestamp with time zone, required, default: now())
- risk_tier (text)
- data_sensitivity_used (ARRAY, default: '{}'::text[])
- jurisdictions (ARRAY, default: '{}'::text[])
- deployment_status (text, default: 'draft'::text)
- version (text)
- description (text)
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### ai_tool_usage
- id (uuid, required, default: gen_random_uuid())
- project_id (uuid, required)
- tool_name (text, required)
- how_it_was_used (text, required)
- files_created (ARRAY)
- date_used (date, required)
- workspace_id (uuid, required)
- created_by (uuid)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ### ai_tool_usage_logs
- id (uuid, required, default: gen_random_uuid())
- client_id (uuid)
- tool_name (character varying, required)
- vendor_name (character varying)
- timestamp (timestamp with time zone, default: now())
- usage_type (character varying)
- data_processed (character varying)
- compliance_status (character varying, default: 'unknown'::character varying)
- risk_level (character varying, default: 'unknown'::character varying)
- metadata (jsonb, default: '{}'::jsonb)
- enterprise_id (uuid)
- partner_id (uuid)
- workspace_id (uuid)
- project_id (uuid)
- effective_policy_snapshot_id (uuid)
- vc_payload (jsonb)
- vc_hash (text)
- issuer_did (text)
- subject_did (text)
- decision (text)
- event_time (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                        |
| ### ai_tool_versions
- id (uuid, required, default: gen_random_uuid())
- tool_id (uuid, required)
- version (text, required)
- release_date (timestamp with time zone, required)
- deprecates_version_id (uuid)
- capabilities (jsonb, default: '{}'::jsonb)
- known_limitations (ARRAY, default: ARRAY[]::text[])
- notes (text)
- created_at (timestamp with time zone, required, default: now())
- status (USER-DEFINED, required, default: 'draft'::ai_tool_version_status)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ### ai_tools
- id (uuid, required, default: gen_random_uuid())
- vendor_id (uuid)
- name (text, required)
- website (text)
- surface (text)
- category (text)
- deployment_types (ARRAY, required, default: ARRAY[]::text[])
- description (text)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ### anonymized_patterns
- id (uuid, required, default: gen_random_uuid())
- pattern_type (text, required)
- scope (text, required, default: 'network'::text)
- pattern_data (jsonb, required)
- tenant_count (integer, required)
- data_point_count (integer, required, default: 0)
- period_start (timestamp with time zone, required)
- period_end (timestamp with time zone, required)
- period_type (text, required, default: 'monthly'::text)
- industry_vertical (text)
- benchmark_category (text)
- computed_at (timestamp with time zone, default: now())
- computation_version (text, default: '1.0'::text)
- is_current (boolean, default: true)
- expires_at (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ### approval_workflows
- id (uuid, required, default: gen_random_uuid())
- document_id (uuid, required)
- document_type (text, required)
- workspace_id (uuid)
- enterprise_id (uuid)
- workflow_name (text, required)
- current_stage (text, required)
- stages (jsonb, required)
- assignees (jsonb, default: '[]'::jsonb)
- progress_percentage (integer, default: 0)
- estimated_completion (timestamp with time zone)
- bottleneck_detected (boolean, default: false)
- escalation_triggered (boolean, default: false)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())
- sla_hours (integer, default: 48)
- started_at (timestamp with time zone)
- due_date (timestamp with time zone)
- priority_level (text, default: 'normal'::text)
- workflow_template (text, default: 'standard'::text)
- auto_assignment_rules (jsonb, default: '{}'::jsonb)
- escalation_rules (jsonb, default: '{}'::jsonb)
- stage_history (jsonb, default: '[]'::jsonb)
- auto_sync_platforms (jsonb, default: '[]'::jsonb)       |
| ### approvals
- id (uuid, required, default: gen_random_uuid())
- object_type (text, required)
- object_id (uuid, required)
- stage (text, required)
- required_roles (ARRAY, default: ARRAY[]::text[])
- decision (text)
- decided_by (uuid)
- decided_at (timestamp with time zone)
- rationale (text)
- conditions (ARRAY, default: ARRAY[]::text[])
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### assessment_progress
- id (uuid, required, default: gen_random_uuid())
- token (text, required)
- email (text, required)
- current_step (integer, required, default: 0)
- answers (jsonb, required, default: '{}'::jsonb)
- evidence (jsonb, required, default: '{}'::jsonb)
- organization_data (jsonb, required, default: '{}'::jsonb)
- expires_at (timestamp with time zone, required)
- completed_at (timestamp with time zone)
- assessment_id (uuid)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### assessments
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid)
- organization_type (text)
- organization_size (text)
- organization_name (text)
- composite_score (integer, required)
- band (text, required)
- confidence (real, required)
- projected_tta (integer)
- domain_breakdown (jsonb, required, default: '[]'::jsonb)
- must_pass_gates (jsonb, required, default: '{}'::jsonb)
- recommendations (jsonb, required, default: '[]'::jsonb)
- evidence (jsonb, required, default: '{}'::jsonb)
- metadata (jsonb, required, default: '{}'::jsonb)
- answers (jsonb, required, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                            |
| ### asset_declarations
- id (uuid, required, default: gen_random_uuid())
- file_hash (text, required)
- file_name (text)
- file_size_bytes (bigint)
- file_type (text)
- enterprise_id (uuid, required)
- partner_id (uuid, required)
- project_id (uuid)
- tools_used (jsonb, required, default: '[]'::jsonb)
- usage_description (text)
- validation_status (text, required, default: 'pending'::text)
- validation_result (jsonb)
- aggregated_risk_tier (text)
- proof_bundle_id (uuid)
- proof_bundle_metadata (jsonb)
- declared_by_user_id (uuid)
- role_credential (text)
- role_verified (boolean, default: false)
- declared_at (timestamp with time zone, required, default: now())
- validated_at (timestamp with time zone)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())
- workspace_id (uuid)
- effective_policy_snapshot_id (uuid)
- c2pa_manifest (jsonb)
- c2pa_manifest_hash (text)
- tool_use_vc_hash (text)                                                                                                                          |
| ### audit_events
- id (uuid, required, default: gen_random_uuid())
- event_type (text, required)
- entity_type (text)
- entity_id (uuid)
- user_id (uuid)
- workspace_id (uuid)
- enterprise_id (uuid)
- details (jsonb, default: '{}'::jsonb)
- ip_address (inet)
- user_agent (text)
- created_at (timestamp with time zone, default: now())
- before_state (jsonb)
- after_state (jsonb)
- actor_type (text)
- agent_name (text)
- thread_id (uuid)
- rationale_human (text)
- rationale_structured (jsonb, default: '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ### boundary_decision_tokens
- dt_id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- partner_id (uuid)
- eps_id (text, required)
- eps_digest (text, required)
- tool_registry_id (uuid)
- tool_version_id (uuid)
- tool_name (text, required)
- tool_version (text, required)
- vendor_name (text, required)
- usage_grant (jsonb, required, default: '{}'::jsonb)
- decision (jsonb, required, default: '{}'::jsonb)
- signature (text, required)
- signing_method (USER-DEFINED, required, default: 'HMAC'::boundary_signing_method)
- signing_key_id (text)
- status (USER-DEFINED, required, default: 'active'::boundary_dt_status)
- issued_at (timestamp with time zone, required, default: now())
- expires_at (timestamp with time zone, required)
- revoked_at (timestamp with time zone)
- revocation_reason (text)
- consumed_at (timestamp with time zone)
- trace_id (text)
- request_id (text)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                               |
| ### boundary_execution_receipts
- er_id (uuid, required, default: gen_random_uuid())
- dt_id (uuid, required)
- pc_id (uuid)
- executor_type (USER-DEFINED, required)
- executor_id (uuid, required)
- executor_user_id (text)
- execution_started_at (timestamp with time zone, required)
- execution_completed_at (timestamp with time zone)
- execution_duration_ms (integer)
- outcome (jsonb, required, default: '{}'::jsonb)
- attestation (text, required)
- signing_method (USER-DEFINED, required, default: 'HMAC'::boundary_signing_method)
- trace_id (text)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### boundary_partner_confirmations
- pc_id (uuid, required, default: gen_random_uuid())
- dt_id (uuid, required)
- partner_id (uuid, required)
- confirmer_user_id (text, required)
- confirmer_role (text)
- confirmation_statement (text, required)
- accepted_controls (jsonb, required, default: '[]'::jsonb)
- ip_address (text)
- user_agent (text)
- signature (text, required)
- signing_method (USER-DEFINED, required, default: 'HMAC'::boundary_signing_method)
- confirmed_at (timestamp with time zone, required, default: now())
- expires_at (timestamp with time zone, required)
- trace_id (text)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ### boundary_transitions
- id (uuid, required, default: gen_random_uuid())
- governance_action_id (uuid, required)
- from_enterprise_id (uuid, required)
- to_enterprise_id (uuid, required)
- transition_type (text, required)
- visibility_snapshot (jsonb, required, default: '{}'::jsonb)
- brand_id (text)
- workflow_step (text)
- transition_latency_ms (integer)
- decision_confidence (numeric)
- risk_score (numeric)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ### brand_workspace_members
- id (uuid, required, default: gen_random_uuid())
- brand_workspace_id (uuid, required)
- user_id (uuid, required)
- role (USER-DEFINED, required, default: 'viewer'::enterprise_role_enum)
- permissions (jsonb, default: '{}'::jsonb)
- invited_by (uuid)
- joined_at (timestamp with time zone, default: now())
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ### brand_workspaces
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- description (text)
- agency_workspace_id (uuid, required)
- client_enterprise_id (uuid, required)
- brand_metadata (jsonb, default: '{}'::jsonb)
- is_active (boolean, default: true)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- created_by (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ### chat_messages
- id (uuid, required, default: gen_random_uuid())
- thread_id (text, required)
- role (text, required)
- content (text, required)
- actions (jsonb, default: '[]'::jsonb)
- metadata (jsonb, default: '{}'::jsonb)
- workspace_id (uuid)
- enterprise_id (uuid)
- user_id (uuid)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ### clause_review_queue
- id (bigint, required, default: nextval('clause_review_queue_id_seq'::regclass))
- policy_id (text, required)
- clause_id (text, required)
- enterprise_id (uuid, required)
- lane_suggested (text)
- lane_confidence (numeric)
- reason (text)
- reviewer_id (uuid)
- resolved (boolean, default: false)
- resolved_lane (text)
- resolved_at (timestamp with time zone)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ### client_agency_relationships
- id (bigint, required)
- client_enterprise_id (uuid, required)
- agency_enterprise_id (uuid, required)
- status (text, required, default: 'active'::text)
- permissions (jsonb, required, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### collaboration_messages
- id (uuid, required, default: gen_random_uuid())
- document_id (uuid)
- document_type (text)
- workspace_id (uuid)
- sender_id (uuid, required)
- recipient_id (uuid)
- message_type (text, required, default: 'text'::text)
- content (text, required)
- metadata (jsonb, default: '{}'::jsonb)
- thread_id (uuid)
- is_read (boolean, default: false)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ### collaboration_sessions
- id (uuid, required, default: gen_random_uuid())
- document_id (uuid, required)
- document_type (text, required)
- user_id (uuid, required)
- session_type (text, required, default: 'viewing'::text)
- section_id (uuid)
- presence_data (jsonb, default: '{}'::jsonb)
- is_active (boolean, default: true)
- last_activity (timestamp with time zone, required, default: now())
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ### compliance_reports
- id (uuid, required, default: gen_random_uuid())
- project_id (uuid, required)
- enterprise_id (uuid, required)
- workspace_id (uuid)
- report_type (character varying, default: 'compliance_summary'::character varying)
- overall_status (character varying, required)
- compliance_score (integer, required)
- tools_summary (jsonb, required)
- policy_violations (jsonb, default: '[]'::jsonb)
- recommendations (jsonb, default: '[]'::jsonb)
- risk_assessment (jsonb, required)
- compliance_frameworks (ARRAY)
- generated_by (uuid)
- generated_at (timestamp with time zone, default: now())
- expires_at (timestamp with time zone)
- metadata (jsonb, default: '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ### conflict_resolutions
- id (uuid, required, default: gen_random_uuid())
- document_id (uuid, required)
- document_type (text, required)
- section_id (uuid)
- conflict_type (text, required)
- users_involved (ARRAY, required)
- conflict_data (jsonb, required)
- resolution_method (text)
- resolved_by (uuid)
- resolution_data (jsonb)
- resolved_at (timestamp with time zone)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### custom_roles
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- archetype_id (text, required)
- display_name (text, required)
- description (text)
- permissions (jsonb, required, default: '{}'::jsonb)
- icon (text)
- color (text)
- is_active (boolean, default: true)
- is_default (boolean, default: false)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- created_by (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ### customer_onboarding
- id (uuid, required, default: gen_random_uuid())
- email (text, required)
- company_name (text, required)
- magic_token (text, required)
- account_type (text, default: 'enterprise'::text)
- role (text, default: 'admin'::text)
- workspace_name (text)
- enterprise_id (uuid)
- workspace_id (uuid)
- invited_by (uuid)
- expires_at (timestamp with time zone, required, default: (now() + '7 days'::interval))
- used_at (timestamp with time zone)
- user_id (uuid)
- onboarding_data (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())
- invitation_type (text, default: 'customer_signup'::text)
- inviting_enterprise_id (uuid)
- target_role (text, default: 'admin'::text)                                                                                                                                                                                                                                                                                                                  |
| ### data_source_registry
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- source_type (text, required)
- description (text)
- sensitivity_level (text, required)
- jurisdictions (ARRAY, required, default: '{}'::text[])
- connection_config (jsonb)
- enterprise_id (uuid, required)
- deployment_status (text, default: 'active'::text)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- created_by (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### decision_conditions
- id (uuid, required, default: gen_random_uuid())
- decision_id (uuid, required)
- condition_type (text, required)
- condition_value (jsonb, required, default: '{}'::jsonb)
- display_text (text)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ### decisions
- id (uuid, required, default: gen_random_uuid())
- submission_id (uuid)
- submission_item_id (uuid)
- outcome (USER-DEFINED, required)
- conditions (text)
- feedback (text)
- expires_at (timestamp with time zone)
- decided_by (uuid)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ### demo_mode_audit_log
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid, required)
- action (text, required)
- trigger_source (text, required)
- account_type (text)
- previous_state (boolean)
- new_state (boolean, required)
- metadata (jsonb, default: '{}'::jsonb)
- ip_address (inet)
- user_agent (text)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ### demo_mode_preferences
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid, required)
- enabled (boolean, required, default: false)
- auto_enable_for_partner (boolean, required, default: true)
- auto_enable_for_vendor (boolean, required, default: true)
- auto_enable_for_enterprise (boolean, required, default: false)
- preference_source (text, required, default: 'manual'::text)
- last_toggled_at (timestamp with time zone)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ### demo_requests
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- email (text, required)
- company (text, required)
- company_size (text)
- industry (text)
- use_case (text)
- message (text)
- demo_type (text, default: 'executive_overview'::text)
- preferred_time (text)
- phone (text)
- source (text, default: 'contact_form'::text)
- status (text, default: 'new'::text)
- lead_score (integer, default: 0)
- assigned_to (uuid)
- scheduled_at (timestamp with time zone)
- completed_at (timestamp with time zone)
- follow_up_notes (text)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ### document_annotations
- id (uuid, required, default: gen_random_uuid())
- document_id (uuid, required)
- document_type (text, required)
- section_id (uuid)
- user_id (uuid, required)
- annotation_type (text, required, default: 'comment'::text)
- content (text, required)
- position_data (jsonb, default: '{}'::jsonb)
- parent_id (uuid)
- status (text, default: 'active'::text)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ### document_sections
- id (uuid, required, default: gen_random_uuid())
- document_id (uuid, required)
- document_type (text, required)
- section_name (text, required)
- section_path (text, required)
- content_hash (text)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ### effective_policy_snapshots
- id (uuid, required, default: gen_random_uuid())
- policy_instance_id (uuid, required)
- enterprise_id (uuid, required)
- workspace_id (uuid)
- scope_id (uuid)
- effective_pom (jsonb, required)
- content_hash (text, required)
- idempotency_key (text)
- hash_inputs (jsonb, required, default: '{}'::jsonb)
- field_provenance (jsonb, required, default: '{}'::jsonb)
- version (integer, required, default: 1)
- created_at (timestamp with time zone, required, default: now())
- activated_at (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ### egress_rules
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- scope_id (uuid)
- dest_host (text, required)
- protocol (text, default: 'https'::text)
- allowed (boolean, required, default: true)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ### enterprise_members
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid, required)
- enterprise_id (uuid, required)
- role (USER-DEFINED, required, default: 'member'::app_role)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ### enterprise_signing_keys
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- key_type (text, required)
- key_size (integer, required)
- public_key_pem (text, required)
- private_key_encrypted (bytea, required)
- key_id (text, required)
- algorithm (text, required)
- purpose (text, required, default: 'signing'::text)
- status (text, required, default: 'active'::text)
- created_at (timestamp with time zone, default: now())
- rotated_at (timestamp with time zone)
- revoked_at (timestamp with time zone)
- expires_at (timestamp with time zone)
- created_by (uuid)
- metadata (jsonb, default: '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ### enterprise_users
- id (bigint, required)
- enterprise_id (uuid, required)
- user_id (uuid, required)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ### enterprises
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- domain (text)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- enterprise_type (text, default: 'client'::text)
- subscription_tier (USER-DEFINED, required, default: 'foundation'::subscription_tier)
- vera_mode (text, required, default: 'shadow'::text)
- tenancy_type (text, default: 'owning'::text)
- parent_enterprise_id (uuid)
- guardrails (jsonb, default: '{}'::jsonb)
- network_intelligence_enabled (boolean, default: false)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### evidence
- id (uuid, required, default: gen_random_uuid())
- submission_item_id (uuid, required)
- filename (text, required)
- file_path (text, required)
- file_size (bigint)
- content_hash (text)
- content_type (text)
- scan_status (USER-DEFINED, default: 'pending'::evidence_scan_status)
- scan_result (jsonb)
- uploaded_by (uuid)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ### evidence_events
- id (uuid, required, default: gen_random_uuid())
- workflow_id (uuid, required)
- stage (USER-DEFINED, required, default: 'in_run'::stage_t)
- event_type (text, required)
- delta_points (integer, required)
- payload (jsonb, required, default: '{}'::jsonb)
- triggered_by (uuid)
- occurred_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ### exports_log
- id (uuid, required, default: gen_random_uuid())
- run_id (uuid, required)
- target_platform (text, required)
- exported_by (uuid)
- exported_at (timestamp with time zone, required, default: now())
- export_format (text, default: 'pdf'::text)
- file_size_bytes (bigint)
- export_status (text, required, default: 'pending'::text)
- error_message (text)
- metadata (jsonb, default: '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ### flow_definitions
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- version (text, required)
- graph_definition (jsonb, required)
- is_active (boolean, default: true)
- created_at (timestamp with time zone, default: now())
- enterprise_id (uuid)
- created_by (uuid)
- description (text)
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ### flow_runs
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid)
- flow_definition_id (uuid)
- status (text, default: 'running'::text)
- current_node (text)
- context (jsonb, default: '{}'::jsonb)
- proof_bundle_id (uuid)
- created_at (timestamp with time zone, default: now())
- completed_at (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ### flow_steps
- id (uuid, required, default: gen_random_uuid())
- flow_run_id (uuid)
- node_id (text, required)
- agent_name (text)
- input_data (jsonb)
- output_data (jsonb)
- duration_ms (integer)
- error_message (text)
- step_order (integer, required)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ### framework_requirements
- id (uuid, required, default: gen_random_uuid())
- framework_id (uuid, required)
- requirement_code (text, required)
- title (text, required)
- description (text)
- weight (numeric)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### governance_actions
- id (uuid, required, default: gen_random_uuid())
- thread_id (uuid, required)
- action_type (text, required)
- actor_type (text, required)
- actor_id (uuid)
- agent_name (text)
- rationale (text)
- before_state (jsonb)
- after_state (jsonb)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, default: now())
- idempotency_key (uuid)
- actor_role (text)
- surface (text)
- mode (text)
- client (text, default: 'web'::text)
- context_snapshot (jsonb)
- precedent_action_ids (ARRAY)
- similar_decisions (jsonb)
- precedent_influence_score (numeric)
- electronic_signature (bytea)
- signature_algorithm (text)
- signature_timestamp (timestamp with time zone)
- signer_certificate (text)
- signature_reason (text)
- signature_meaning (text)
- reasoning_trace (jsonb)
- content_hash (text)
- actor_permissions (jsonb)
- actor_enterprise_id (uuid)
- policy_version_id (uuid)
- policy_snapshot (jsonb)
- tool_version (text)
- visibility_level (text)
- viewing_enterprise_id (uuid)
- is_boundary_action (boolean, default: false)
- actor_custom_role_id (uuid) |
| ### governance_alerts
- id (uuid, required, default: gen_random_uuid())
- severity (text, required)
- title (text, required)
- description (text)
- entity_name (text)
- entity_type (text)
- entity_id (uuid)
- enterprise_id (uuid)
- workspace_id (uuid)
- days_open (integer, required, default: 0)
- assignee_name (text)
- category (text)
- status (text, required, default: 'open'::text)
- resolved_at (timestamp with time zone)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ### governance_audit_events
- event_id (uuid, required, default: gen_random_uuid())
- occurred_at (timestamp with time zone, required, default: now())
- thread_id (uuid)
- action_id (uuid)
- action_type (text, required)
- actor_type (text, required)
- actor_id (uuid)
- actor_role (text)
- surface (text)
- mode (text)
- client (text, default: 'web'::text)
- before_state (jsonb)
- after_state (jsonb)
- artifact_refs (ARRAY, default: '{}'::uuid[])
- rationale_ref (uuid)
- enterprise_id (uuid)
- metadata (jsonb, default: '{}'::jsonb)
- denied (boolean, default: false)
- denial_reason (text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ### governance_decisions
- id (uuid, required, default: gen_random_uuid())
- policy_context_id (uuid, required)
- ai_tool_id (uuid, required)
- decision_state (text, required)
- rationale (text)
- created_by (uuid)
- approved_by (uuid)
- approved_at (timestamp with time zone)
- policy_version_id (uuid)
- proof_bundle_id (uuid)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ### governance_entities
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- type (text, required)
- enterprise_id (uuid)
- workspace_id (uuid)
- compliance_score (integer, required, default: 0)
- tool_approval_score (integer, required, default: 0)
- audit_completeness_score (integer, required, default: 0)
- open_risks (integer, required, default: 0)
- owner_name (text)
- region (text)
- last_update (timestamp with time zone, required, default: now())
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())
- metadata (jsonb, default: '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ### governance_events
- id (uuid, required, default: gen_random_uuid())
- event_type (text, required)
- run_id (uuid)
- workspace_id (uuid)
- user_id (uuid)
- role_view (text)
- grade (text)
- coverage (numeric)
- details (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- enterprise_id (uuid)
- partner_id (uuid)
- vc_hash (text)
- manifest_hash (text)
- receipt (jsonb)
- event_time (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ### governance_events_v2
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- policy_context_id (uuid)
- ai_tool_id (uuid)
- decision_id (uuid)
- event_type (text, required)
- actor_user_id (uuid)
- payload (jsonb, required, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ### governance_policy_versions
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- version (integer, required)
- status (text, required, default: 'draft'::text)
- policy_blob (jsonb, required, default: '{}'::jsonb)
- created_by (uuid)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ### governance_threads
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- thread_type (text, required)
- subject_id (uuid, required)
- subject_type (text, required)
- status (text, required, default: 'open'::text)
- current_step (text)
- flow_run_id (uuid)
- proof_bundle_id (uuid)
- submission_id (uuid)
- priority (text, default: 'normal'::text)
- sla_due_at (timestamp with time zone)
- title (text)
- description (text)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- resolved_at (timestamp with time zone)
- resolved_by (uuid)
- owner_user_id (uuid)
- reviewer_user_ids (ARRAY, default: '{}'::uuid[])
- severity (text)
- applicable_policy_ids (ARRAY)                                                                                                                                                                                                                                                                                                                    |
| ### incident
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid)
- workspace_id (uuid)
- policy_id (uuid)
- severity (text, required)
- status (text, required, default: 'open'::text)
- tool_id (uuid)
- tool_class (text)
- title (text, required)
- description (text)
- evidence_url (text)
- pii_data (boolean, default: false)
- phi_data (boolean, default: false)
- started_at (timestamp with time zone, required, default: now())
- last_event_at (timestamp with time zone, required, default: now())
- resolved_at (timestamp with time zone)
- resolved_by (uuid)
- mute_reason (text)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                           |
| ### invitation_keys
- id (uuid, required, default: gen_random_uuid())
- email (character varying, required)
- workspace_id (uuid)
- role (USER-DEFINED, required, default: 'viewer'::enterprise_role_enum)
- token (character varying, required)
- expires_at (timestamp with time zone, required)
- accepted_at (timestamp with time zone)
- created_by (uuid)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ### legacy_role_mappings
- legacy_role (text, required)
- archetype_id (text, required)
- default_display_name (text, required)
- notes (text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ### marketplace_tools
- id (bigint, required)
- vendor_enterprise_id (uuid, required)
- name (text, required)
- category (text, required)
- compliance_certifications (jsonb, required, default: '[]'::jsonb)
- pricing_tier (text, required, default: 'basic'::text)
- status (text, required, default: 'pending_verification'::text)
- description (text)
- website (text)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())
- vendor_id (uuid)
- average_rating (numeric, default: 0)
- review_count (integer, default: 0)
- monthly_active_users (integer, default: 0)
- setup_complexity (text, default: 'medium'::text)
- integration_options (jsonb, default: '[]'::jsonb)
- promotion_tier (text, default: 'standard'::text)
- promotion_expires_at (timestamp with time zone)
- promotion_started_at (timestamp with time zone)
- promotion_analytics (jsonb, default: '{"clicks": 0, "conversions": 0, "impressions": 0}'::jsonb)
- promotion_budget_spent (numeric, default: 0.00)
- promotion_daily_budget (numeric)                              |
| ### marketplace_vendors
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- company_name (text, required)
- contact_email (text, required)
- contact_name (text)
- website (text)
- logo_url (text)
- description (text)
- verification_status (text, required, default: 'pending'::text)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ### memberships
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid, required)
- enterprise_id (uuid, required)
- status (text, required, default: 'active'::text)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### middleware_requests
- id (uuid, required, default: uuid_generate_v4())
- tenant_id (uuid, required)
- body (jsonb, required)
- created_at (timestamp with time zone, default: now())
- partner_id (uuid)
- enterprise_id (uuid)
- workspace_id (uuid)
- model (text)
- prompt_tokens (integer)
- completion_tokens (integer)
- total_tokens (integer)
- policy_decision (text)
- policy_evaluation (jsonb)
- context_analysis (jsonb)
- proof_bundle (jsonb)
- response_status (integer)
- response_time_ms (integer)
- openai_request_id (text)
- estimated_cost_usd (numeric)
- event_type (text, default: 'ai_request'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ### model_data_source_mappings
- id (uuid, required, default: gen_random_uuid())
- model_id (uuid, required)
- data_source_id (uuid, required)
- access_type (text)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ### msa_visibility
- id (uuid, required, default: gen_random_uuid())
- agency_enterprise_id (uuid, required)
- client_enterprise_id (uuid, required)
- visibility_level (text, required, default: 'role_only'::text)
- overrides (jsonb, default: '{}'::jsonb)
- msa_reference (text)
- effective_date (date)
- expiration_date (date)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- created_by (uuid)
- updated_by (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ### operation_logs
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid)
- operation (text, required)
- status (text, required)
- duration_ms (integer)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ### optimization_runs
- id (uuid, required, default: gen_random_uuid())
- agent_name (text, required)
- baseline_prompt_id (uuid)
- improved_prompt_id (uuid)
- status (text, required, default: 'pending'::text)
- metrics (jsonb, required, default: '{}'::jsonb)
- error (text)
- created_by (uuid)
- created_at (timestamp with time zone, required, default: now())
- completed_at (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### optimization_runs_v2
- id (uuid, required, default: gen_random_uuid())
- agent_type (text, required)
- status (text, default: 'running'::text)
- started_at (timestamp with time zone, default: now())
- completed_at (timestamp with time zone)
- training_examples_count (integer)
- test_examples_count (integer)
- baseline_score (numeric)
- improved_score (numeric)
- improvement_percentage (numeric)
- best_prompt_id (uuid)
- failure_analysis (jsonb, default: '{}'::jsonb)
- cost_estimate_usd (numeric)
- created_by (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ### organizations
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- name (text, required)
- slug (text)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ### partner_api_keys
- id (uuid, required, default: gen_random_uuid())
- partner_id (uuid, required)
- enterprise_id (uuid, required)
- key_hash (text, required)
- key_prefix (text, required)
- name (text)
- scopes (ARRAY, default: ARRAY['ai.request'::text])
- rate_limit_tier (text, default: 'standard'::text)
- expires_at (timestamp with time zone)
- last_used_at (timestamp with time zone)
- is_active (boolean, default: true)
- created_by (uuid)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- require_role_proof (boolean, required, default: false)
- allowed_role_claims (jsonb, required, default: '[]'::jsonb)
- allowed_scopes (jsonb, required, default: '[]'::jsonb)
- issuer_did (text)                                                                                                                                                                                                                                                                                                                                                           |
| ### partner_client_contexts
- id (uuid, required, default: gen_random_uuid())
- user_id (uuid, required)
- partner_enterprise_id (uuid, required)
- client_enterprise_id (uuid, required)
- role (text, required, default: 'contributor'::text)
- permissions (jsonb, default: '[]'::jsonb)
- is_active (boolean, default: true)
- is_default (boolean, default: false)
- last_accessed (timestamp with time zone, default: now())
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- brand_scope (ARRAY)
- custom_role_id (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ### partner_knowledge_base
- id (uuid, required, default: gen_random_uuid())
- workspace_id (uuid, required)
- document_type (text, required)
- title (text, required)
- description (text)
- content (text)
- file_url (text)
- metadata (jsonb, default: '{}'::jsonb)
- tags (ARRAY, default: '{}'::text[])
- version (integer, default: 1)
- is_active (boolean, default: true)
- uploaded_by (uuid)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ### partners
- id (uuid, required, default: gen_random_uuid())
- name (text, required)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ### platform_configurations
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- platform_type (text, required)
- platform_name (text, required)
- auth_method (text, required)
- credentials (jsonb, required, default: '{}'::jsonb)
- endpoint_url (text)
- status (text, required, default: 'inactive'::text)
- last_connection_test (timestamp with time zone)
- auto_sync_enabled (boolean, default: false)
- sync_schedule (jsonb, default: '{}'::jsonb)
- metadata (jsonb, default: '{}'::jsonb)
- created_by (uuid)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())
- workspace_id (uuid)
- agency_workspace_id (uuid)
- client_enterprise_id (uuid)                                                                                                                                                                                                                                                                                                                                                                |
| ### platform_document_syncs
- id (uuid, required, default: gen_random_uuid())
- platform_config_id (uuid, required)
- document_type (text, required)
- document_id (uuid, required)
- sync_status (text, required, default: 'pending'::text)
- platform_document_id (text)
- platform_url (text)
- synced_at (timestamp with time zone)
- sync_error (text)
- retry_count (integer, default: 0)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ### platform_integration_logs
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- platform_config_id (uuid)
- platform_type (text, required)
- operation_type (text, required)
- status (text, required)
- submission_id (uuid)
- file_name (text)
- file_size (bigint)
- files_processed (integer, default: 0)
- files_failed (integer, default: 0)
- error_message (text)
- error_details (jsonb)
- duration_ms (integer)
- triggered_by (uuid)
- started_at (timestamp with time zone, default: now())
- completed_at (timestamp with time zone)
- metadata (jsonb, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ### policies
- id (uuid, required, default: gen_random_uuid())
- title (text, required)
- description (text)
- enterprise_id (uuid, required)
- created_by (uuid)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, default: now())
- status (USER-DEFINED, required, default: 'draft'::policy_status_enum)
- rfp_template_data (jsonb)
- auto_generate_clauses (boolean, default: false)
- source_document_path (text)
- document_metadata (jsonb, default: '{}'::jsonb)
- platform_sync_status (jsonb, default: '{}'::jsonb)
- pom (jsonb, default: '{}'::jsonb)
- scope_id (uuid)
- parent_policy_id (uuid)
- inheritance_mode (USER-DEFINED, default: 'merge'::policy_inheritance_mode)
- override_rules (jsonb, default: '{}'::jsonb)
- is_inherited (boolean, default: false)                                                                                                                                                                                                                                                                                                               |
| ### policy_alignments
- id (uuid, required, default: gen_random_uuid())
- policy_id (uuid, required)
- client_id (uuid)
- client_enterprise_id (uuid)
- external_policy_id (text)
- external_policy_name (text)
- snapshot_id (text, required)
- harmonized_pom (jsonb, required, default: '{}'::jsonb)
- conflicts (jsonb, default: '[]'::jsonb)
- created_at (timestamp with time zone, required, default: now())
- updated_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ### policy_assignments
- id (uuid, required, default: gen_random_uuid())
- policy_context_id (uuid, required)
- policy_version_id (uuid, required)
- effective_from (timestamp with time zone, required, default: now())
- effective_to (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### policy_clauses
- id (text, required)
- policy_id (text, required)
- enterprise_id (uuid, required)
- clause_ref (text)
- clause_title (text)
- clause_text (text, required)
- lane (text)
- lane_confidence (numeric)
- controls (ARRAY)
- evidence (ARRAY)
- tags (ARRAY)
- created_at (timestamp with time zone, default: now())
- pom_field_mappings (jsonb, default: '[]'::jsonb)
- applied_to_instances (ARRAY, default: '{}'::uuid[])
- mapping_status (text, default: 'suggested'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ### policy_client_overlays
- id (bigint, required, default: nextval('policy_client_overlays_id_seq'::regclass))
- policy_id (text, required)
- enterprise_id (uuid, required)
- client_id (text, required)
- overrides (jsonb, required, default: '{}'::jsonb)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ### policy_conflicts
- id (uuid, required, default: gen_random_uuid())
- child_policy_id (uuid, required)
- parent_policy_id (uuid, required)
- conflict_type (text, required)
- field_path (text, required)
- parent_value (jsonb)
- child_value (jsonb)
- severity (text, required, default: 'warning'::text)
- detected_at (timestamp with time zone, default: now())
- resolved (boolean, default: false)
- resolved_at (timestamp with time zone)
- resolved_by (uuid)
- resolution_notes (text)
- created_at (timestamp with time zone, default: now())
- conflicting_rule (text, required)
- description (text)
- resolution_status (text, required, default: 'unresolved'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ### policy_contexts
- id (uuid, required, default: gen_random_uuid())
- enterprise_id (uuid, required)
- agency_enterprise_id (uuid)
- brand_id (uuid)
- region_code (text)
- workstream (text)
- name (text, required)
- metadata (jsonb, required, default: '{}'::jsonb)
- created_at (timestamp with time zone, required, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ### policy_controls
- id (uuid, required, default: gen_random_uuid())
- workflow_id (uuid, required)
- control_key (text, required)
- stage (USER-DEFINED, required, default: 'pre_run'::stage_t)
- points (integer, required)
- weight (numeric, required, default: 1.0)
- metadata (jsonb, required, default: '{}'::jsonb)
- evidence_url (text)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ### policy_distributions
- id (uuid, required, default: gen_random_uuid())
- policy_version_id (uuid, required)
- target_workspace_id (uuid, required)
- distributed_by (uuid)
- note (text)
- created_at (timestamp with time zone, default: now())
- status (text, required, default: 'sent'::text)
- response_deadline (timestamp with time zone)
- metadata (jsonb, required, default: '{}'::jsonb)
- distribution_type (text, default: 'policy_request'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ### policy_evidence_bundles
- id (uuid, required, default: uuid_generate_v4())
- tenant_id (uuid, required)
- policy_snapshot_id (text, required)
- body (jsonb, required)
- created_at (timestamp with time zone, default: now())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ### policy_gaps
- id (uuid, required, default: gen_random_uuid())
- policy_id (uuid, required)
- field_path (text, required)
- gap_type (text, required)
- severity (integer, required)
- hint (text)
- detected_at (timestamp with time zone, required, default: now())
- resolved_at (timestamp with time zone)
- resolved_by (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          || tablename                       | rls_status                 |
| ------------------------------- | -------------------------- |
| ai_tools                        | ❌ RLS DISABLED - NEEDS FIX |
| decision_conditions             | ❌ RLS DISABLED - NEEDS FIX |
| governance_decisions            | ❌ RLS DISABLED - NEEDS FIX |
| governance_events_v2            | ❌ RLS DISABLED - NEEDS FIX |
| governance_policy_versions      | ❌ RLS DISABLED - NEEDS FIX |
| legacy_role_mappings            | ❌ RLS DISABLED - NEEDS FIX |
| memberships                     | ❌ RLS DISABLED - NEEDS FIX |
| partners                        | ❌ RLS DISABLED - NEEDS FIX |
| policy_assignments              | ❌ RLS DISABLED - NEEDS FIX |
| policy_contexts                 | ❌ RLS DISABLED - NEEDS FIX |
| role_assignments                | ❌ RLS DISABLED - NEEDS FIX |
| roles                           | ❌ RLS DISABLED - NEEDS FIX |
| tool_governance_requests        | ❌ RLS DISABLED - NEEDS FIX |
| tool_observations               | ❌ RLS DISABLED - NEEDS FIX |
| vendor_artifacts                | ❌ RLS DISABLED - NEEDS FIX |
| vendor_tool_submissions         | ❌ RLS DISABLED - NEEDS FIX |
| vendors                         | ❌ RLS DISABLED - NEEDS FIX |
| agency_seats                    | ✅ RLS Enabled              |
| agency_subscriptions            | ✅ RLS Enabled              |
| agency_task                     | ✅ RLS Enabled              |
| agent_activities                | ✅ RLS Enabled              |
| agent_prompts                   | ✅ RLS Enabled              |
| agent_prompts_v2                | ✅ RLS Enabled              |
| agent_reasoning_steps           | ✅ RLS Enabled              |
| agent_task_requests             | ✅ RLS Enabled              |
| agent_tasks                     | ✅ RLS Enabled              |
| agent_workflows                 | ✅ RLS Enabled              |
| ai_agent_decisions              | ✅ RLS Enabled              |
| ai_agents                       | ✅ RLS Enabled              |
| ai_tool_registry                | ✅ RLS Enabled              |
| ai_tool_usage                   | ✅ RLS Enabled              |
| ai_tool_usage_logs              | ✅ RLS Enabled              |
| ai_tool_versions                | ✅ RLS Enabled              |
| anonymized_patterns             | ✅ RLS Enabled              |
| approval_workflows              | ✅ RLS Enabled              |
| approvals                       | ✅ RLS Enabled              |
| assessment_progress             | ✅ RLS Enabled              |
| assessments                     | ✅ RLS Enabled              |
| asset_declarations              | ✅ RLS Enabled              |
| audit_events                    | ✅ RLS Enabled              |
| boundary_decision_tokens        | ✅ RLS Enabled              |
| boundary_execution_receipts     | ✅ RLS Enabled              |
| boundary_partner_confirmations  | ✅ RLS Enabled              |
| boundary_transitions            | ✅ RLS Enabled              |
| brand_workspace_members         | ✅ RLS Enabled              |
| brand_workspaces                | ✅ RLS Enabled              |
| chat_messages                   | ✅ RLS Enabled              |
| clause_review_queue             | ✅ RLS Enabled              |
| client_agency_relationships     | ✅ RLS Enabled              |
| collaboration_messages          | ✅ RLS Enabled              |
| collaboration_sessions          | ✅ RLS Enabled              |
| compliance_reports              | ✅ RLS Enabled              |
| conflict_resolutions            | ✅ RLS Enabled              |
| custom_roles                    | ✅ RLS Enabled              |
| customer_onboarding             | ✅ RLS Enabled              |
| data_source_registry            | ✅ RLS Enabled              |
| decisions                       | ✅ RLS Enabled              |
| demo_mode_audit_log             | ✅ RLS Enabled              |
| demo_mode_preferences           | ✅ RLS Enabled              |
| demo_requests                   | ✅ RLS Enabled              |
| document_annotations            | ✅ RLS Enabled              |
| document_sections               | ✅ RLS Enabled              |
| effective_policy_snapshots      | ✅ RLS Enabled              |
| egress_rules                    | ✅ RLS Enabled              |
| enterprise_members              | ✅ RLS Enabled              |
| enterprise_signing_keys         | ✅ RLS Enabled              |
| enterprise_users                | ✅ RLS Enabled              |
| enterprises                     | ✅ RLS Enabled              |
| evidence                        | ✅ RLS Enabled              |
| evidence_events                 | ✅ RLS Enabled              |
| exports_log                     | ✅ RLS Enabled              |
| flow_definitions                | ✅ RLS Enabled              |
| flow_runs                       | ✅ RLS Enabled              |
| flow_steps                      | ✅ RLS Enabled              |
| framework_requirements          | ✅ RLS Enabled              |
| governance_actions              | ✅ RLS Enabled              |
| governance_alerts               | ✅ RLS Enabled              |
| governance_audit_events         | ✅ RLS Enabled              |
| governance_entities             | ✅ RLS Enabled              |
| governance_events               | ✅ RLS Enabled              |
| governance_threads              | ✅ RLS Enabled              |
| incident                        | ✅ RLS Enabled              |
| invitation_keys                 | ✅ RLS Enabled              |
| marketplace_tools               | ✅ RLS Enabled              |
| marketplace_vendors             | ✅ RLS Enabled              |
| middleware_requests             | ✅ RLS Enabled              |
| model_data_source_mappings      | ✅ RLS Enabled              |
| msa_visibility                  | ✅ RLS Enabled              |
| operation_logs                  | ✅ RLS Enabled              |
| optimization_runs               | ✅ RLS Enabled              |
| optimization_runs_v2            | ✅ RLS Enabled              |
| organizations                   | ✅ RLS Enabled              |
| partner_api_keys                | ✅ RLS Enabled              |
| partner_client_contexts         | ✅ RLS Enabled              |
| partner_knowledge_base          | ✅ RLS Enabled              |
| platform_configurations         | ✅ RLS Enabled              |
| platform_document_syncs         | ✅ RLS Enabled              |
| platform_integration_logs       | ✅ RLS Enabled              |
| policies                        | ✅ RLS Enabled              |
| policy_alignments               | ✅ RLS Enabled              |
| policy_clauses                  | ✅ RLS Enabled              |
| policy_client_overlays          | ✅ RLS Enabled              |
| policy_conflicts                | ✅ RLS Enabled              |
| policy_controls                 | ✅ RLS Enabled              |
| policy_distributions            | ✅ RLS Enabled              |
| policy_evidence_bundles         | ✅ RLS Enabled              |
| policy_gaps                     | ✅ RLS Enabled              |
| policy_ingest_mappings          | ✅ RLS Enabled              |
| policy_insights                 | ✅ RLS Enabled              |
| policy_instances                | ✅ RLS Enabled              |
| policy_master                   | ✅ RLS Enabled              |
| policy_parse_jobs               | ✅ RLS Enabled              |
| policy_propagation_status       | ✅ RLS Enabled              |
| policy_resolutions              | ✅ RLS Enabled              |
| policy_rules                    | ✅ RLS Enabled              |
| policy_templates                | ✅ RLS Enabled              |
| policy_validation_events        | ✅ RLS Enabled              |
| policy_versions                 | ✅ RLS Enabled              |
| postrun_outcomes                | ✅ RLS Enabled              |
| profiles                        | ✅ RLS Enabled              |
| project_ai_tool_usage           | ✅ RLS Enabled              |
| projects                        | ✅ RLS Enabled              |
| prompt_reflections              | ✅ RLS Enabled              |
| prompt_reflections_v2           | ✅ RLS Enabled              |
| proof_atoms                     | ✅ RLS Enabled              |
| proof_bundle_artifacts          | ✅ RLS Enabled              |
| proof_bundle_compliance         | ✅ RLS Enabled              |
| proof_bundle_links              | ✅ RLS Enabled              |
| proof_bundles                   | ✅ RLS Enabled              |
| proof_pack_atoms                | ✅ RLS Enabled              |
| proof_packs                     | ✅ RLS Enabled              |
| regulatory_frameworks           | ✅ RLS Enabled              |
| relationship_patterns           | ✅ RLS Enabled              |
| requirement_evidence_map        | ✅ RLS Enabled              |
| requirements_profiles           | ✅ RLS Enabled              |
| rfp_profiles                    | ✅ RLS Enabled              |
| rfp_question_library            | ✅ RLS Enabled              |
| rfp_tool_disclosures            | ✅ RLS Enabled              |
| risk_profile_assessments        | ✅ RLS Enabled              |
| risk_scores                     | ✅ RLS Enabled              |
| risk_snapshot                   | ✅ RLS Enabled              |
| risk_weights                    | ✅ RLS Enabled              |
| role_archetypes                 | ✅ RLS Enabled              |
| runtime_bindings                | ✅ RLS Enabled              |
| sandbox_approvals               | ✅ RLS Enabled              |
| sandbox_controls                | ✅ RLS Enabled              |
| sandbox_projects                | ✅ RLS Enabled              |
| sandbox_runs                    | ✅ RLS Enabled              |
| scoped_policies                 | ✅ RLS Enabled              |
| scopes                          | ✅ RLS Enabled              |
| scores                          | ✅ RLS Enabled              |
| secret_access_log               | ✅ RLS Enabled              |
| secrets                         | ✅ RLS Enabled              |
| security_audit_checklists       | ✅ RLS Enabled              |
| structured_policy_data          | ✅ RLS Enabled              |
| submission_atom_states          | ✅ RLS Enabled              |
| submission_items                | ✅ RLS Enabled              |
| submissions                     | ✅ RLS Enabled              |
| subscription_tier_limits        | ✅ RLS Enabled              |
| subtenants                      | ✅ RLS Enabled              |
| system_validations              | ✅ RLS Enabled              |
| tenant_health                   | ✅ RLS Enabled              |
| tool_category_keywords          | ✅ RLS Enabled              |
| tool_compliance_history         | ✅ RLS Enabled              |
| tool_policy_links               | ✅ RLS Enabled              |
| tool_policy_scores              | ✅ RLS Enabled              |
| tool_requests                   | ✅ RLS Enabled              |
| tool_reviews                    | ✅ RLS Enabled              |
| trusted_issuers                 | ✅ RLS Enabled              |
| user_achievements               | ✅ RLS Enabled              |
| user_contexts                   | ✅ RLS Enabled              |
| user_roles                      | ✅ RLS Enabled              |
| validation_errors               | ✅ RLS Enabled              |
| vendor_marketplace_settings     | ✅ RLS Enabled              |
| vendor_profiles                 | ✅ RLS Enabled              |
| vendor_promotions               | ✅ RLS Enabled              |
| vera_autonomy_config            | ✅ RLS Enabled              |
| vera_mode_transitions           | ✅ RLS Enabled              |
| vera_policy_rules               | ✅ RLS Enabled              |
| vera_preferences                | ✅ RLS Enabled              |
| vera_state                      | ✅ RLS Enabled              |
| white_paper_downloads           | ✅ RLS Enabled              |
| workflow_ai_interventions       | ✅ RLS Enabled              |
| workflow_configs                | ✅ RLS Enabled              |
| workflow_customization_requests | ✅ RLS Enabled              |
| workflow_executions             | ✅ RLS Enabled              |
| workflow_governance_items       | ✅ RLS Enabled              |
| workflow_industries             | ✅ RLS Enabled              |
| workflow_instance_governance    | ✅ RLS Enabled              |
| workflow_instance_interventions | ✅ RLS Enabled              |
| workflow_instance_phases        | ✅ RLS Enabled              |
| workflow_instances              | ✅ RLS Enabled              |
| workflow_phases                 | ✅ RLS Enabled              |
| workflow_template_views         | ✅ RLS Enabled              |
| workflow_templates              | ✅ RLS Enabled              |
| workflows                       | ✅ RLS Enabled              |
| workspace_frameworks            | ✅ RLS Enabled              |
| workspace_members               | ✅ RLS Enabled              |
| workspaces                      | ✅ RLS Enabled              |