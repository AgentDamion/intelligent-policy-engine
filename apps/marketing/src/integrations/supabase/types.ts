export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agency_subscriptions: {
        Row: {
          activated_at: string | null
          agency_enterprise_id: string
          billing_contact_id: string | null
          created_at: string | null
          enterprise_features_enabled: Json | null
          id: string
          is_enterprise_mode: boolean | null
          subscription_metadata: Json | null
          subscription_tier: string
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          agency_enterprise_id: string
          billing_contact_id?: string | null
          created_at?: string | null
          enterprise_features_enabled?: Json | null
          id?: string
          is_enterprise_mode?: boolean | null
          subscription_metadata?: Json | null
          subscription_tier?: string
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          agency_enterprise_id?: string
          billing_contact_id?: string | null
          created_at?: string | null
          enterprise_features_enabled?: Json | null
          id?: string
          is_enterprise_mode?: boolean | null
          subscription_metadata?: Json | null
          subscription_tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_subscriptions_agency_enterprise_id_fkey"
            columns: ["agency_enterprise_id"]
            isOneToOne: true
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_subscriptions_agency_enterprise_id_fkey"
            columns: ["agency_enterprise_id"]
            isOneToOne: true
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "agency_subscriptions_agency_enterprise_id_fkey"
            columns: ["agency_enterprise_id"]
            isOneToOne: true
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_task: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          enterprise_id: string | null
          id: string
          metadata: Json | null
          status: string
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          enterprise_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          title: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          enterprise_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_task_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_task_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_task_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_task_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "agency_task_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_task_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_activities: {
        Row: {
          action: string
          agent: string
          created_at: string
          details: Json | null
          enterprise_id: string | null
          id: number
          severity: string | null
          status: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          agent: string
          created_at?: string
          details?: Json | null
          enterprise_id?: string | null
          id?: never
          severity?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          agent?: string
          created_at?: string
          details?: Json | null
          enterprise_id?: string | null
          id?: never
          severity?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      agent_prompts: {
        Row: {
          agent_name: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          prompt: string
          version: number
        }
        Insert: {
          agent_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          prompt: string
          version: number
        }
        Update: {
          agent_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          prompt?: string
          version?: number
        }
        Relationships: []
      }
      agent_prompts_v2: {
        Row: {
          activated_at: string | null
          agent_type: string
          created_at: string | null
          created_by: string | null
          deprecated_at: string | null
          few_shot_examples: Json | null
          id: string
          improvement_percentage: number | null
          is_active: boolean | null
          optimization_run_id: string | null
          parent_prompt_id: string | null
          performance_metrics: Json | null
          prompt_version: number
          system_prompt: string
          user_prompt_template: string
        }
        Insert: {
          activated_at?: string | null
          agent_type: string
          created_at?: string | null
          created_by?: string | null
          deprecated_at?: string | null
          few_shot_examples?: Json | null
          id?: string
          improvement_percentage?: number | null
          is_active?: boolean | null
          optimization_run_id?: string | null
          parent_prompt_id?: string | null
          performance_metrics?: Json | null
          prompt_version: number
          system_prompt: string
          user_prompt_template: string
        }
        Update: {
          activated_at?: string | null
          agent_type?: string
          created_at?: string | null
          created_by?: string | null
          deprecated_at?: string | null
          few_shot_examples?: Json | null
          id?: string
          improvement_percentage?: number | null
          is_active?: boolean | null
          optimization_run_id?: string | null
          parent_prompt_id?: string | null
          performance_metrics?: Json | null
          prompt_version?: number
          system_prompt?: string
          user_prompt_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_prompts_v2_parent_prompt_id_fkey"
            columns: ["parent_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: number
          input_data: Json
          output_data: Json | null
          priority: number | null
          started_at: string | null
          status: string | null
          task_type: string
          workflow_id: number | null
        }
        Insert: {
          agent_id?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: never
          input_data: Json
          output_data?: Json | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          task_type: string
          workflow_id?: number | null
        }
        Update: {
          agent_id?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: never
          input_data?: Json
          output_data?: Json | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          task_type?: string
          workflow_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "agent_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_workflows: {
        Row: {
          agent_sequence: Json
          created_at: string | null
          description: string | null
          enterprise_id: string | null
          id: number
          name: string
          status: string | null
          trigger_conditions: Json
          updated_at: string | null
        }
        Insert: {
          agent_sequence: Json
          created_at?: string | null
          description?: string | null
          enterprise_id?: string | null
          id?: never
          name: string
          status?: string | null
          trigger_conditions: Json
          updated_at?: string | null
        }
        Update: {
          agent_sequence?: Json
          created_at?: string | null
          description?: string | null
          enterprise_id?: string | null
          id?: never
          name?: string
          status?: string | null
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_workflows_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agent_workflows_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "agent_workflows_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_decisions: {
        Row: {
          action: string
          agency: string | null
          agent: string
          audit_checklist: Json | null
          created_at: string
          details: Json | null
          dimension_scores: Json | null
          enterprise_id: string | null
          id: number
          outcome: string
          risk: string | null
          risk_profile_tier: string | null
        }
        Insert: {
          action: string
          agency?: string | null
          agent: string
          audit_checklist?: Json | null
          created_at?: string
          details?: Json | null
          dimension_scores?: Json | null
          enterprise_id?: string | null
          id?: never
          outcome: string
          risk?: string | null
          risk_profile_tier?: string | null
        }
        Update: {
          action?: string
          agency?: string | null
          agent?: string
          audit_checklist?: Json | null
          created_at?: string
          details?: Json | null
          dimension_scores?: Json | null
          enterprise_id?: string | null
          id?: never
          outcome?: string
          risk?: string | null
          risk_profile_tier?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          capabilities: Json
          config: Json | null
          created_at: string | null
          enterprise_id: string | null
          id: number
          name: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          capabilities: Json
          config?: Json | null
          created_at?: string | null
          enterprise_id?: string | null
          id?: never
          name: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json
          config?: Json | null
          created_at?: string | null
          enterprise_id?: string | null
          id?: never
          name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "ai_agents_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "ai_agents_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tool_registry: {
        Row: {
          category: string
          created_at: string
          data_sensitivity_used: string[] | null
          deployment_status: string | null
          description: string | null
          id: string
          jurisdictions: string[] | null
          name: string
          provider: string
          risk_tier: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category: string
          created_at?: string
          data_sensitivity_used?: string[] | null
          deployment_status?: string | null
          description?: string | null
          id?: string
          jurisdictions?: string[] | null
          name: string
          provider: string
          risk_tier?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          data_sensitivity_used?: string[] | null
          deployment_status?: string | null
          description?: string | null
          id?: string
          jurisdictions?: string[] | null
          name?: string
          provider?: string
          risk_tier?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      ai_tool_usage: {
        Row: {
          created_at: string
          created_by: string | null
          date_used: string
          files_created: string[] | null
          how_it_was_used: string
          id: string
          project_id: string
          tool_name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_used: string
          files_created?: string[] | null
          how_it_was_used: string
          id?: string
          project_id: string
          tool_name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_used?: string
          files_created?: string[] | null
          how_it_was_used?: string
          id?: string
          project_id?: string
          tool_name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tool_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tool_usage_logs: {
        Row: {
          client_id: string
          compliance_status: string | null
          data_processed: string | null
          id: string
          metadata: Json | null
          risk_level: string | null
          timestamp: string | null
          tool_name: string
          usage_type: string | null
          vendor_name: string | null
        }
        Insert: {
          client_id: string
          compliance_status?: string | null
          data_processed?: string | null
          id?: string
          metadata?: Json | null
          risk_level?: string | null
          timestamp?: string | null
          tool_name: string
          usage_type?: string | null
          vendor_name?: string | null
        }
        Update: {
          client_id?: string
          compliance_status?: string | null
          data_processed?: string | null
          id?: string
          metadata?: Json | null
          risk_level?: string | null
          timestamp?: string | null
          tool_name?: string
          usage_type?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      ai_tool_versions: {
        Row: {
          capabilities: Json | null
          created_at: string
          deprecates_version_id: string | null
          id: string
          known_limitations: string[] | null
          notes: string | null
          release_date: string
          tool_id: string
          version: string
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string
          deprecates_version_id?: string | null
          id?: string
          known_limitations?: string[] | null
          notes?: string | null
          release_date: string
          tool_id: string
          version: string
        }
        Update: {
          capabilities?: Json | null
          created_at?: string
          deprecates_version_id?: string | null
          id?: string
          known_limitations?: string[] | null
          notes?: string | null
          release_date?: string
          tool_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tool_versions_deprecates_version_id_fkey"
            columns: ["deprecates_version_id"]
            isOneToOne: false
            referencedRelation: "ai_tool_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tool_versions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "ai_tool_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          assignees: Json | null
          auto_assignment_rules: Json | null
          auto_sync_platforms: Json | null
          bottleneck_detected: boolean | null
          created_at: string
          current_stage: string
          document_id: string
          document_type: string
          due_date: string | null
          enterprise_id: string | null
          escalation_rules: Json | null
          escalation_triggered: boolean | null
          estimated_completion: string | null
          id: string
          metadata: Json | null
          priority_level: string | null
          progress_percentage: number | null
          sla_hours: number | null
          stage_history: Json | null
          stages: Json
          started_at: string | null
          updated_at: string
          workflow_name: string
          workflow_template: string | null
          workspace_id: string | null
        }
        Insert: {
          assignees?: Json | null
          auto_assignment_rules?: Json | null
          auto_sync_platforms?: Json | null
          bottleneck_detected?: boolean | null
          created_at?: string
          current_stage: string
          document_id: string
          document_type: string
          due_date?: string | null
          enterprise_id?: string | null
          escalation_rules?: Json | null
          escalation_triggered?: boolean | null
          estimated_completion?: string | null
          id?: string
          metadata?: Json | null
          priority_level?: string | null
          progress_percentage?: number | null
          sla_hours?: number | null
          stage_history?: Json | null
          stages: Json
          started_at?: string | null
          updated_at?: string
          workflow_name: string
          workflow_template?: string | null
          workspace_id?: string | null
        }
        Update: {
          assignees?: Json | null
          auto_assignment_rules?: Json | null
          auto_sync_platforms?: Json | null
          bottleneck_detected?: boolean | null
          created_at?: string
          current_stage?: string
          document_id?: string
          document_type?: string
          due_date?: string | null
          enterprise_id?: string | null
          escalation_rules?: Json | null
          escalation_triggered?: boolean | null
          estimated_completion?: string | null
          id?: string
          metadata?: Json | null
          priority_level?: string | null
          progress_percentage?: number | null
          sla_hours?: number | null
          stage_history?: Json | null
          stages?: Json
          started_at?: string | null
          updated_at?: string
          workflow_name?: string
          workflow_template?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      approvals: {
        Row: {
          conditions: string[] | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: string | null
          id: string
          object_id: string
          object_type: string
          rationale: string | null
          required_roles: string[] | null
          stage: string
        }
        Insert: {
          conditions?: string[] | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          id?: string
          object_id: string
          object_type: string
          rationale?: string | null
          required_roles?: string[] | null
          stage: string
        }
        Update: {
          conditions?: string[] | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          id?: string
          object_id?: string
          object_type?: string
          rationale?: string | null
          required_roles?: string[] | null
          stage?: string
        }
        Relationships: []
      }
      assessment_progress: {
        Row: {
          answers: Json
          assessment_id: string | null
          completed_at: string | null
          created_at: string
          current_step: number
          email: string
          evidence: Json
          expires_at: string
          id: string
          organization_data: Json
          token: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          email: string
          evidence?: Json
          expires_at: string
          id?: string
          organization_data?: Json
          token: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          email?: string
          evidence?: Json
          expires_at?: string
          id?: string
          organization_data?: Json
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_progress_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          answers: Json
          band: string
          composite_score: number
          confidence: number
          created_at: string
          domain_breakdown: Json
          evidence: Json
          id: string
          metadata: Json
          must_pass_gates: Json
          organization_name: string | null
          organization_size: string | null
          organization_type: string | null
          projected_tta: number | null
          recommendations: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          band: string
          composite_score: number
          confidence: number
          created_at?: string
          domain_breakdown?: Json
          evidence?: Json
          id?: string
          metadata?: Json
          must_pass_gates?: Json
          organization_name?: string | null
          organization_size?: string | null
          organization_type?: string | null
          projected_tta?: number | null
          recommendations?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          band?: string
          composite_score?: number
          confidence?: number
          created_at?: string
          domain_breakdown?: Json
          evidence?: Json
          id?: string
          metadata?: Json
          must_pass_gates?: Json
          organization_name?: string | null
          organization_size?: string | null
          organization_type?: string | null
          projected_tta?: number | null
          recommendations?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      asset_declarations: {
        Row: {
          aggregated_risk_tier: string | null
          created_at: string
          declared_at: string
          declared_by_user_id: string | null
          enterprise_id: string
          file_hash: string
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          partner_id: string
          project_id: string | null
          proof_bundle_id: string | null
          proof_bundle_metadata: Json | null
          role_credential: string | null
          role_verified: boolean | null
          tools_used: Json
          updated_at: string
          usage_description: string | null
          validated_at: string | null
          validation_result: Json | null
          validation_status: string
          workspace_id: string | null
        }
        Insert: {
          aggregated_risk_tier?: string | null
          created_at?: string
          declared_at?: string
          declared_by_user_id?: string | null
          enterprise_id: string
          file_hash: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          partner_id: string
          project_id?: string | null
          proof_bundle_id?: string | null
          proof_bundle_metadata?: Json | null
          role_credential?: string | null
          role_verified?: boolean | null
          tools_used?: Json
          updated_at?: string
          usage_description?: string | null
          validated_at?: string | null
          validation_result?: Json | null
          validation_status?: string
          workspace_id?: string | null
        }
        Update: {
          aggregated_risk_tier?: string | null
          created_at?: string
          declared_at?: string
          declared_by_user_id?: string | null
          enterprise_id?: string
          file_hash?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          partner_id?: string
          project_id?: string | null
          proof_bundle_id?: string | null
          proof_bundle_metadata?: Json | null
          role_credential?: string | null
          role_verified?: boolean | null
          tools_used?: Json
          updated_at?: string
          usage_description?: string | null
          validated_at?: string | null
          validation_result?: Json | null
          validation_status?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_declarations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "asset_declarations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "asset_declarations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_declarations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "policy_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_declarations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          created_at: string | null
          details: Json | null
          enterprise_id: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          enterprise_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          enterprise_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "audit_events_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "audit_events_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_workspace_members: {
        Row: {
          brand_workspace_id: string
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["enterprise_role_enum"]
          user_id: string
        }
        Insert: {
          brand_workspace_id: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["enterprise_role_enum"]
          user_id: string
        }
        Update: {
          brand_workspace_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["enterprise_role_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_workspace_members_brand_workspace_id_fkey"
            columns: ["brand_workspace_id"]
            isOneToOne: false
            referencedRelation: "brand_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_workspaces: {
        Row: {
          agency_workspace_id: string
          brand_metadata: Json | null
          client_enterprise_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          agency_workspace_id: string
          brand_metadata?: Json | null
          client_enterprise_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          agency_workspace_id?: string
          brand_metadata?: Json | null
          client_enterprise_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_workspaces_agency_workspace_id_fkey"
            columns: ["agency_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_workspaces_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "brand_workspaces_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "brand_workspaces_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          actions: Json | null
          content: string
          created_at: string
          enterprise_id: string | null
          id: string
          metadata: Json | null
          role: string
          thread_id: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          actions?: Json | null
          content: string
          created_at?: string
          enterprise_id?: string | null
          id?: string
          metadata?: Json | null
          role: string
          thread_id: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          actions?: Json | null
          content?: string
          created_at?: string
          enterprise_id?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          thread_id?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "chat_messages_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "chat_messages_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clause_review_queue: {
        Row: {
          clause_id: string
          created_at: string | null
          enterprise_id: string
          id: number
          lane_confidence: number | null
          lane_suggested: string | null
          policy_id: string
          reason: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_lane: string | null
          reviewer_id: string | null
        }
        Insert: {
          clause_id: string
          created_at?: string | null
          enterprise_id: string
          id?: number
          lane_confidence?: number | null
          lane_suggested?: string | null
          policy_id: string
          reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_lane?: string | null
          reviewer_id?: string | null
        }
        Update: {
          clause_id?: string
          created_at?: string | null
          enterprise_id?: string
          id?: number
          lane_confidence?: number | null
          lane_suggested?: string | null
          policy_id?: string
          reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_lane?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clause_review_queue_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "clause_review_queue_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "clause_review_queue_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clause_review_queue_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_agency_relationships: {
        Row: {
          agency_enterprise_id: string
          client_enterprise_id: string
          created_at: string
          id: number
          permissions: Json
          status: string
        }
        Insert: {
          agency_enterprise_id: string
          client_enterprise_id: string
          created_at?: string
          id?: never
          permissions?: Json
          status?: string
        }
        Update: {
          agency_enterprise_id?: string
          client_enterprise_id?: string
          created_at?: string
          id?: never
          permissions?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_agency_relationships_agency_enterprise_id_fkey"
            columns: ["agency_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "client_agency_relationships_agency_enterprise_id_fkey"
            columns: ["agency_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_agency_relationships_agency_enterprise_id_fkey"
            columns: ["agency_enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_agency_relationships_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "client_agency_relationships_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_agency_relationships_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_messages: {
        Row: {
          content: string
          created_at: string
          document_id: string | null
          document_type: string | null
          id: string
          is_read: boolean | null
          message_type: string
          metadata: Json | null
          recipient_id: string | null
          sender_id: string
          thread_id: string | null
          workspace_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          recipient_id?: string | null
          sender_id: string
          thread_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          recipient_id?: string | null
          sender_id?: string
          thread_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "collaboration_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_sessions: {
        Row: {
          created_at: string
          document_id: string
          document_type: string
          id: string
          is_active: boolean | null
          last_activity: string
          presence_data: Json | null
          section_id: string | null
          session_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          is_active?: boolean | null
          last_activity?: string
          presence_data?: Json | null
          section_id?: string | null
          session_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          is_active?: boolean | null
          last_activity?: string
          presence_data?: Json | null
          section_id?: string | null
          session_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_sessions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          compliance_frameworks: string[] | null
          compliance_score: number
          enterprise_id: string
          expires_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          overall_status: string
          policy_violations: Json | null
          project_id: string
          recommendations: Json | null
          report_type: string | null
          risk_assessment: Json
          tools_summary: Json
          workspace_id: string | null
        }
        Insert: {
          compliance_frameworks?: string[] | null
          compliance_score: number
          enterprise_id: string
          expires_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          overall_status: string
          policy_violations?: Json | null
          project_id: string
          recommendations?: Json | null
          report_type?: string | null
          risk_assessment: Json
          tools_summary: Json
          workspace_id?: string | null
        }
        Update: {
          compliance_frameworks?: string[] | null
          compliance_score?: number
          enterprise_id?: string
          expires_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          overall_status?: string
          policy_violations?: Json | null
          project_id?: string
          recommendations?: Json | null
          report_type?: string | null
          risk_assessment?: Json
          tools_summary?: Json
          workspace_id?: string | null
        }
        Relationships: []
      }
      conflict_resolutions: {
        Row: {
          conflict_data: Json
          conflict_type: string
          created_at: string
          document_id: string
          document_type: string
          id: string
          resolution_data: Json | null
          resolution_method: string | null
          resolved_at: string | null
          resolved_by: string | null
          section_id: string | null
          users_involved: string[]
        }
        Insert: {
          conflict_data: Json
          conflict_type: string
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          resolution_data?: Json | null
          resolution_method?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          section_id?: string | null
          users_involved: string[]
        }
        Update: {
          conflict_data?: Json
          conflict_type?: string
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          resolution_data?: Json | null
          resolution_method?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          section_id?: string | null
          users_involved?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "conflict_resolutions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_onboarding: {
        Row: {
          account_type: string | null
          company_name: string
          created_at: string
          email: string
          enterprise_id: string | null
          expires_at: string
          id: string
          invitation_type: string | null
          invited_by: string | null
          inviting_enterprise_id: string | null
          magic_token: string
          onboarding_data: Json | null
          role: string | null
          target_role: string | null
          updated_at: string
          used_at: string | null
          user_id: string | null
          workspace_id: string | null
          workspace_name: string | null
        }
        Insert: {
          account_type?: string | null
          company_name: string
          created_at?: string
          email: string
          enterprise_id?: string | null
          expires_at?: string
          id?: string
          invitation_type?: string | null
          invited_by?: string | null
          inviting_enterprise_id?: string | null
          magic_token: string
          onboarding_data?: Json | null
          role?: string | null
          target_role?: string | null
          updated_at?: string
          used_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
        }
        Update: {
          account_type?: string | null
          company_name?: string
          created_at?: string
          email?: string
          enterprise_id?: string | null
          expires_at?: string
          id?: string
          invitation_type?: string | null
          invited_by?: string | null
          inviting_enterprise_id?: string | null
          magic_token?: string
          onboarding_data?: Json | null
          role?: string | null
          target_role?: string | null
          updated_at?: string
          used_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_onboarding_inviting_enterprise_id_fkey"
            columns: ["inviting_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "customer_onboarding_inviting_enterprise_id_fkey"
            columns: ["inviting_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "customer_onboarding_inviting_enterprise_id_fkey"
            columns: ["inviting_enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source_registry: {
        Row: {
          connection_config: Json | null
          created_at: string | null
          created_by: string | null
          deployment_status: string | null
          description: string | null
          enterprise_id: string
          id: string
          jurisdictions: string[]
          name: string
          sensitivity_level: string
          source_type: string
          updated_at: string | null
        }
        Insert: {
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          deployment_status?: string | null
          description?: string | null
          enterprise_id: string
          id?: string
          jurisdictions?: string[]
          name: string
          sensitivity_level: string
          source_type: string
          updated_at?: string | null
        }
        Update: {
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          deployment_status?: string | null
          description?: string | null
          enterprise_id?: string
          id?: string
          jurisdictions?: string[]
          name?: string
          sensitivity_level?: string
          source_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_source_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_registry_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "data_source_registry_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "data_source_registry_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          conditions: string | null
          created_at: string | null
          decided_by: string | null
          expires_at: string | null
          feedback: string | null
          id: string
          outcome: Database["public"]["Enums"]["decision_outcome"]
          submission_id: string | null
          submission_item_id: string | null
        }
        Insert: {
          conditions?: string | null
          created_at?: string | null
          decided_by?: string | null
          expires_at?: string | null
          feedback?: string | null
          id?: string
          outcome: Database["public"]["Enums"]["decision_outcome"]
          submission_id?: string | null
          submission_item_id?: string | null
        }
        Update: {
          conditions?: string | null
          created_at?: string | null
          decided_by?: string | null
          expires_at?: string | null
          feedback?: string | null
          id?: string
          outcome?: Database["public"]["Enums"]["decision_outcome"]
          submission_id?: string | null
          submission_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_submission_item_id_fkey"
            columns: ["submission_item_id"]
            isOneToOne: false
            referencedRelation: "submission_items"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_mode_audit_log: {
        Row: {
          account_type: string | null
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_state: boolean
          previous_state: boolean | null
          trigger_source: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          account_type?: string | null
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_state: boolean
          previous_state?: boolean | null
          trigger_source: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          account_type?: string | null
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_state?: boolean
          previous_state?: boolean | null
          trigger_source?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      demo_mode_preferences: {
        Row: {
          auto_enable_for_enterprise: boolean
          auto_enable_for_partner: boolean
          auto_enable_for_vendor: boolean
          created_at: string
          enabled: boolean
          id: string
          last_toggled_at: string | null
          preference_source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_enable_for_enterprise?: boolean
          auto_enable_for_partner?: boolean
          auto_enable_for_vendor?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          last_toggled_at?: string | null
          preference_source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_enable_for_enterprise?: boolean
          auto_enable_for_partner?: boolean
          auto_enable_for_vendor?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          last_toggled_at?: string | null
          preference_source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          assigned_to: string | null
          company: string
          company_size: string | null
          completed_at: string | null
          created_at: string
          demo_type: string | null
          email: string
          follow_up_notes: string | null
          id: string
          industry: string | null
          lead_score: number | null
          message: string | null
          name: string
          phone: string | null
          preferred_time: string | null
          scheduled_at: string | null
          source: string | null
          status: string | null
          updated_at: string
          use_case: string | null
        }
        Insert: {
          assigned_to?: string | null
          company: string
          company_size?: string | null
          completed_at?: string | null
          created_at?: string
          demo_type?: string | null
          email: string
          follow_up_notes?: string | null
          id?: string
          industry?: string | null
          lead_score?: number | null
          message?: string | null
          name: string
          phone?: string | null
          preferred_time?: string | null
          scheduled_at?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string
          company_size?: string | null
          completed_at?: string | null
          created_at?: string
          demo_type?: string | null
          email?: string
          follow_up_notes?: string | null
          id?: string
          industry?: string | null
          lead_score?: number | null
          message?: string | null
          name?: string
          phone?: string | null
          preferred_time?: string | null
          scheduled_at?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Relationships: []
      }
      document_annotations: {
        Row: {
          annotation_type: string
          content: string
          created_at: string
          document_id: string
          document_type: string
          id: string
          metadata: Json | null
          parent_id: string | null
          position_data: Json | null
          section_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation_type?: string
          content: string
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          position_data?: Json | null
          section_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation_type?: string
          content?: string
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          position_data?: Json | null
          section_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_annotations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_annotations_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sections: {
        Row: {
          content_hash: string | null
          created_at: string
          document_id: string
          document_type: string
          id: string
          section_name: string
          section_path: string
          updated_at: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          section_name: string
          section_path: string
          updated_at?: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          section_name?: string
          section_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      effective_policy_snapshots: {
        Row: {
          activated_at: string | null
          content_hash: string
          created_at: string
          effective_pom: Json
          enterprise_id: string
          field_provenance: Json
          hash_inputs: Json
          id: string
          idempotency_key: string | null
          policy_instance_id: string
          scope_id: string | null
          version: number
          workspace_id: string | null
        }
        Insert: {
          activated_at?: string | null
          content_hash: string
          created_at?: string
          effective_pom: Json
          enterprise_id: string
          field_provenance?: Json
          hash_inputs?: Json
          id?: string
          idempotency_key?: string | null
          policy_instance_id: string
          scope_id?: string | null
          version?: number
          workspace_id?: string | null
        }
        Update: {
          activated_at?: string | null
          content_hash?: string
          created_at?: string
          effective_pom?: Json
          enterprise_id?: string
          field_provenance?: Json
          hash_inputs?: Json
          id?: string
          idempotency_key?: string | null
          policy_instance_id?: string
          scope_id?: string | null
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "effective_policy_snapshots_policy_instance_id_fkey"
            columns: ["policy_instance_id"]
            isOneToOne: false
            referencedRelation: "policy_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      egress_rules: {
        Row: {
          allowed: boolean
          created_at: string | null
          dest_host: string
          enterprise_id: string
          id: string
          protocol: string | null
          scope_id: string | null
        }
        Insert: {
          allowed?: boolean
          created_at?: string | null
          dest_host: string
          enterprise_id: string
          id?: string
          protocol?: string | null
          scope_id?: string | null
        }
        Update: {
          allowed?: boolean
          created_at?: string | null
          dest_host?: string
          enterprise_id?: string
          id?: string
          protocol?: string | null
          scope_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "egress_rules_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "egress_rules_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "egress_rules_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egress_rules_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_matrix_scope_first"
            referencedColumns: ["scope_id"]
          },
          {
            foreignKeyName: "egress_rules_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_members: {
        Row: {
          created_at: string
          enterprise_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_users: {
        Row: {
          created_at: string
          enterprise_id: string
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: never
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: never
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprises: {
        Row: {
          created_at: string | null
          domain: string | null
          enterprise_type: string | null
          id: string
          name: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          enterprise_type?: string | null
          id?: string
          name: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          enterprise_type?: string | null
          id?: string
          name?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      evidence: {
        Row: {
          content_hash: string | null
          content_type: string | null
          created_at: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          scan_result: Json | null
          scan_status:
            | Database["public"]["Enums"]["evidence_scan_status"]
            | null
          submission_item_id: string
          uploaded_by: string | null
        }
        Insert: {
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          scan_result?: Json | null
          scan_status?:
            | Database["public"]["Enums"]["evidence_scan_status"]
            | null
          submission_item_id: string
          uploaded_by?: string | null
        }
        Update: {
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          scan_result?: Json | null
          scan_status?:
            | Database["public"]["Enums"]["evidence_scan_status"]
            | null
          submission_item_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_submission_item_id_fkey"
            columns: ["submission_item_id"]
            isOneToOne: false
            referencedRelation: "submission_items"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_events: {
        Row: {
          delta_points: number
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          stage: Database["public"]["Enums"]["stage_t"]
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          delta_points: number
          event_type: string
          id?: string
          occurred_at?: string
          payload?: Json
          stage?: Database["public"]["Enums"]["stage_t"]
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          delta_points?: number
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          stage?: Database["public"]["Enums"]["stage_t"]
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_events_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_events_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      exports_log: {
        Row: {
          error_message: string | null
          export_format: string | null
          export_status: string
          exported_at: string
          exported_by: string | null
          file_size_bytes: number | null
          id: string
          metadata: Json | null
          run_id: string
          target_platform: string
        }
        Insert: {
          error_message?: string | null
          export_format?: string | null
          export_status?: string
          exported_at?: string
          exported_by?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          run_id: string
          target_platform: string
        }
        Update: {
          error_message?: string | null
          export_format?: string | null
          export_status?: string
          exported_at?: string
          exported_by?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          run_id?: string
          target_platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_log_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exports_log_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_alerts: {
        Row: {
          assignee_name: string | null
          category: string | null
          created_at: string
          days_open: number
          description: string | null
          enterprise_id: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          assignee_name?: string | null
          category?: string | null
          created_at?: string
          days_open?: number
          description?: string | null
          enterprise_id?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          assignee_name?: string | null
          category?: string | null
          created_at?: string
          days_open?: number
          description?: string | null
          enterprise_id?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_alerts_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "governance_alerts_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "governance_alerts_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_alerts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "governance_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_entities: {
        Row: {
          audit_completeness_score: number
          compliance_score: number
          created_at: string
          enterprise_id: string | null
          id: string
          last_update: string
          metadata: Json | null
          name: string
          open_risks: number
          owner_name: string | null
          region: string | null
          tool_approval_score: number
          type: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          audit_completeness_score?: number
          compliance_score?: number
          created_at?: string
          enterprise_id?: string | null
          id?: string
          last_update?: string
          metadata?: Json | null
          name: string
          open_risks?: number
          owner_name?: string | null
          region?: string | null
          tool_approval_score?: number
          type: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          audit_completeness_score?: number
          compliance_score?: number
          created_at?: string
          enterprise_id?: string | null
          id?: string
          last_update?: string
          metadata?: Json | null
          name?: string
          open_risks?: number
          owner_name?: string | null
          region?: string | null
          tool_approval_score?: number
          type?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_entities_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "governance_entities_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "governance_entities_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_entities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_events: {
        Row: {
          coverage: number | null
          created_at: string
          details: Json | null
          event_type: string
          grade: string | null
          id: string
          role_view: string | null
          run_id: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          coverage?: number | null
          created_at?: string
          details?: Json | null
          event_type: string
          grade?: string | null
          id?: string
          role_view?: string | null
          run_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          coverage?: number | null
          created_at?: string
          details?: Json | null
          event_type?: string
          grade?: string | null
          id?: string
          role_view?: string | null
          run_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      incident: {
        Row: {
          created_at: string
          description: string | null
          enterprise_id: string | null
          evidence_url: string | null
          id: string
          last_event_at: string
          metadata: Json | null
          mute_reason: string | null
          phi_data: boolean | null
          pii_data: boolean | null
          policy_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          started_at: string
          status: string
          title: string
          tool_class: string | null
          tool_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enterprise_id?: string | null
          evidence_url?: string | null
          id?: string
          last_event_at?: string
          metadata?: Json | null
          mute_reason?: string | null
          phi_data?: boolean | null
          pii_data?: boolean | null
          policy_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          started_at?: string
          status?: string
          title: string
          tool_class?: string | null
          tool_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enterprise_id?: string | null
          evidence_url?: string | null
          id?: string
          last_event_at?: string
          metadata?: Json | null
          mute_reason?: string | null
          phi_data?: boolean | null
          pii_data?: boolean | null
          policy_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          tool_class?: string | null
          tool_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "incident_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "incident_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_keys: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["enterprise_role_enum"]
          token: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          role?: Database["public"]["Enums"]["enterprise_role_enum"]
          token: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["enterprise_role_enum"]
          token?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_tools: {
        Row: {
          average_rating: number | null
          category: string
          compliance_certifications: Json
          created_at: string
          description: string | null
          id: number
          integration_options: Json | null
          monthly_active_users: number | null
          name: string
          pricing_tier: string
          promotion_analytics: Json | null
          promotion_budget_spent: number | null
          promotion_daily_budget: number | null
          promotion_expires_at: string | null
          promotion_started_at: string | null
          promotion_tier: string | null
          review_count: number | null
          setup_complexity: string | null
          status: string
          updated_at: string
          vendor_enterprise_id: string
          vendor_id: string | null
          website: string | null
        }
        Insert: {
          average_rating?: number | null
          category: string
          compliance_certifications?: Json
          created_at?: string
          description?: string | null
          id?: never
          integration_options?: Json | null
          monthly_active_users?: number | null
          name: string
          pricing_tier?: string
          promotion_analytics?: Json | null
          promotion_budget_spent?: number | null
          promotion_daily_budget?: number | null
          promotion_expires_at?: string | null
          promotion_started_at?: string | null
          promotion_tier?: string | null
          review_count?: number | null
          setup_complexity?: string | null
          status?: string
          updated_at?: string
          vendor_enterprise_id: string
          vendor_id?: string | null
          website?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string
          compliance_certifications?: Json
          created_at?: string
          description?: string | null
          id?: never
          integration_options?: Json | null
          monthly_active_users?: number | null
          name?: string
          pricing_tier?: string
          promotion_analytics?: Json | null
          promotion_budget_spent?: number | null
          promotion_daily_budget?: number | null
          promotion_expires_at?: string | null
          promotion_started_at?: string | null
          promotion_tier?: string | null
          review_count?: number | null
          setup_complexity?: string | null
          status?: string
          updated_at?: string
          vendor_enterprise_id?: string
          vendor_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_tools_vendor_enterprise_id_fkey"
            columns: ["vendor_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "marketplace_tools_vendor_enterprise_id_fkey"
            columns: ["vendor_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "marketplace_tools_vendor_enterprise_id_fkey"
            columns: ["vendor_enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_vendors: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string | null
          created_at: string
          description: string | null
          enterprise_id: string
          id: string
          logo_url: string | null
          updated_at: string
          verification_status: string
          website: string | null
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name?: string | null
          created_at?: string
          description?: string | null
          enterprise_id: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          description?: string | null
          enterprise_id?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      middleware_requests: {
        Row: {
          body: Json
          completion_tokens: number | null
          context_analysis: Json | null
          created_at: string | null
          enterprise_id: string | null
          estimated_cost_usd: number | null
          event_type: string | null
          id: string
          model: string | null
          openai_request_id: string | null
          partner_id: string | null
          policy_decision: string | null
          policy_evaluation: Json | null
          prompt_tokens: number | null
          proof_bundle: Json | null
          response_status: number | null
          response_time_ms: number | null
          tenant_id: string
          total_tokens: number | null
          workspace_id: string | null
        }
        Insert: {
          body: Json
          completion_tokens?: number | null
          context_analysis?: Json | null
          created_at?: string | null
          enterprise_id?: string | null
          estimated_cost_usd?: number | null
          event_type?: string | null
          id?: string
          model?: string | null
          openai_request_id?: string | null
          partner_id?: string | null
          policy_decision?: string | null
          policy_evaluation?: Json | null
          prompt_tokens?: number | null
          proof_bundle?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          tenant_id: string
          total_tokens?: number | null
          workspace_id?: string | null
        }
        Update: {
          body?: Json
          completion_tokens?: number | null
          context_analysis?: Json | null
          created_at?: string | null
          enterprise_id?: string | null
          estimated_cost_usd?: number | null
          event_type?: string | null
          id?: string
          model?: string | null
          openai_request_id?: string | null
          partner_id?: string | null
          policy_decision?: string | null
          policy_evaluation?: Json | null
          prompt_tokens?: number | null
          proof_bundle?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          tenant_id?: string
          total_tokens?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      model_data_source_mappings: {
        Row: {
          access_type: string | null
          created_at: string | null
          data_source_id: string
          id: string
          model_id: string
        }
        Insert: {
          access_type?: string | null
          created_at?: string | null
          data_source_id: string
          id?: string
          model_id: string
        }
        Update: {
          access_type?: string | null
          created_at?: string | null
          data_source_id?: string
          id?: string
          model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_data_source_mappings_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_source_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_data_source_mappings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_tool_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          metadata: Json | null
          operation: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          operation: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          operation?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      optimization_runs: {
        Row: {
          agent_name: string
          baseline_prompt_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          improved_prompt_id: string | null
          metrics: Json
          status: string
        }
        Insert: {
          agent_name: string
          baseline_prompt_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          improved_prompt_id?: string | null
          metrics?: Json
          status?: string
        }
        Update: {
          agent_name?: string
          baseline_prompt_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          improved_prompt_id?: string | null
          metrics?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_runs_baseline_prompt_id_fkey"
            columns: ["baseline_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_runs_improved_prompt_id_fkey"
            columns: ["improved_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_runs_v2: {
        Row: {
          agent_type: string
          baseline_score: number | null
          best_prompt_id: string | null
          completed_at: string | null
          cost_estimate_usd: number | null
          created_by: string | null
          failure_analysis: Json | null
          id: string
          improved_score: number | null
          improvement_percentage: number | null
          started_at: string | null
          status: string | null
          test_examples_count: number | null
          training_examples_count: number | null
        }
        Insert: {
          agent_type: string
          baseline_score?: number | null
          best_prompt_id?: string | null
          completed_at?: string | null
          cost_estimate_usd?: number | null
          created_by?: string | null
          failure_analysis?: Json | null
          id?: string
          improved_score?: number | null
          improvement_percentage?: number | null
          started_at?: string | null
          status?: string | null
          test_examples_count?: number | null
          training_examples_count?: number | null
        }
        Update: {
          agent_type?: string
          baseline_score?: number | null
          best_prompt_id?: string | null
          completed_at?: string | null
          cost_estimate_usd?: number | null
          created_by?: string | null
          failure_analysis?: Json | null
          id?: string
          improved_score?: number | null
          improvement_percentage?: number | null
          started_at?: string | null
          status?: string | null
          test_examples_count?: number | null
          training_examples_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_runs_v2_best_prompt_id_fkey"
            columns: ["best_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          enterprise_id: string
          id: string
          metadata: Json | null
          name: string
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enterprise_id: string
          id?: string
          metadata?: Json | null
          name: string
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enterprise_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "organizations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "organizations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_api_keys: {
        Row: {
          allowed_role_claims: Json
          allowed_scopes: Json
          created_at: string | null
          created_by: string | null
          enterprise_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          issuer_did: string | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string | null
          partner_id: string
          rate_limit_tier: string | null
          require_role_proof: boolean
          scopes: string[] | null
          updated_at: string | null
        }
        Insert: {
          allowed_role_claims?: Json
          allowed_scopes?: Json
          created_at?: string | null
          created_by?: string | null
          enterprise_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          issuer_did?: string | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string | null
          partner_id: string
          rate_limit_tier?: string | null
          require_role_proof?: boolean
          scopes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          allowed_role_claims?: Json
          allowed_scopes?: Json
          created_at?: string | null
          created_by?: string | null
          enterprise_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          issuer_did?: string | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string | null
          partner_id?: string
          rate_limit_tier?: string | null
          require_role_proof?: boolean
          scopes?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_partner_api_keys_issuer_did"
            columns: ["issuer_did"]
            isOneToOne: false
            referencedRelation: "trusted_issuers"
            referencedColumns: ["issuer_did"]
          },
          {
            foreignKeyName: "partner_api_keys_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "partner_api_keys_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "partner_api_keys_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_api_keys_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "partner_api_keys_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "partner_api_keys_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_knowledge_base: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          document_type: string
          file_url: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
          workspace_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          document_type: string
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          workspace_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_knowledge_base_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_configurations: {
        Row: {
          agency_workspace_id: string | null
          auth_method: string
          auto_sync_enabled: boolean | null
          client_enterprise_id: string | null
          created_at: string
          created_by: string | null
          credentials: Json
          endpoint_url: string | null
          enterprise_id: string
          id: string
          last_connection_test: string | null
          metadata: Json | null
          platform_name: string
          platform_type: string
          status: string
          sync_schedule: Json | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agency_workspace_id?: string | null
          auth_method: string
          auto_sync_enabled?: boolean | null
          client_enterprise_id?: string | null
          created_at?: string
          created_by?: string | null
          credentials?: Json
          endpoint_url?: string | null
          enterprise_id: string
          id?: string
          last_connection_test?: string | null
          metadata?: Json | null
          platform_name: string
          platform_type: string
          status?: string
          sync_schedule?: Json | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agency_workspace_id?: string | null
          auth_method?: string
          auto_sync_enabled?: boolean | null
          client_enterprise_id?: string | null
          created_at?: string
          created_by?: string | null
          credentials?: Json
          endpoint_url?: string | null
          enterprise_id?: string
          id?: string
          last_connection_test?: string | null
          metadata?: Json | null
          platform_name?: string
          platform_type?: string
          status?: string
          sync_schedule?: Json | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_configurations_agency_workspace_id_fkey"
            columns: ["agency_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_configurations_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "platform_configurations_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "platform_configurations_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_configurations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_document_syncs: {
        Row: {
          created_at: string | null
          document_id: string
          document_type: string
          id: string
          metadata: Json | null
          platform_config_id: string
          platform_document_id: string | null
          platform_url: string | null
          retry_count: number | null
          sync_error: string | null
          sync_status: string
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          document_type: string
          id?: string
          metadata?: Json | null
          platform_config_id: string
          platform_document_id?: string | null
          platform_url?: string | null
          retry_count?: number | null
          sync_error?: string | null
          sync_status?: string
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          document_type?: string
          id?: string
          metadata?: Json | null
          platform_config_id?: string
          platform_document_id?: string | null
          platform_url?: string | null
          retry_count?: number | null
          sync_error?: string | null
          sync_status?: string
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_document_syncs_platform_config_id_fkey"
            columns: ["platform_config_id"]
            isOneToOne: false
            referencedRelation: "platform_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_integration_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          enterprise_id: string
          error_details: Json | null
          error_message: string | null
          file_name: string | null
          file_size: number | null
          files_failed: number | null
          files_processed: number | null
          id: string
          metadata: Json | null
          operation_type: string
          platform_config_id: string | null
          platform_type: string
          started_at: string | null
          status: string
          submission_id: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          enterprise_id: string
          error_details?: Json | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          files_failed?: number | null
          files_processed?: number | null
          id?: string
          metadata?: Json | null
          operation_type: string
          platform_config_id?: string | null
          platform_type: string
          started_at?: string | null
          status: string
          submission_id?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          enterprise_id?: string
          error_details?: Json | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          files_failed?: number | null
          files_processed?: number | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          platform_config_id?: string | null
          platform_type?: string
          started_at?: string | null
          status?: string
          submission_id?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_integration_logs_platform_config_id_fkey"
            columns: ["platform_config_id"]
            isOneToOne: false
            referencedRelation: "platform_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          auto_generate_clauses: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_metadata: Json | null
          enterprise_id: string
          id: string
          inheritance_mode:
            | Database["public"]["Enums"]["policy_inheritance_mode"]
            | null
          is_inherited: boolean | null
          override_rules: Json | null
          parent_policy_id: string | null
          platform_sync_status: Json | null
          pom: Json | null
          rfp_template_data: Json | null
          scope_id: string | null
          source_document_path: string | null
          status: Database["public"]["Enums"]["policy_status_enum"]
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_generate_clauses?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_metadata?: Json | null
          enterprise_id: string
          id?: string
          inheritance_mode?:
            | Database["public"]["Enums"]["policy_inheritance_mode"]
            | null
          is_inherited?: boolean | null
          override_rules?: Json | null
          parent_policy_id?: string | null
          platform_sync_status?: Json | null
          pom?: Json | null
          rfp_template_data?: Json | null
          scope_id?: string | null
          source_document_path?: string | null
          status?: Database["public"]["Enums"]["policy_status_enum"]
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_generate_clauses?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_metadata?: Json | null
          enterprise_id?: string
          id?: string
          inheritance_mode?:
            | Database["public"]["Enums"]["policy_inheritance_mode"]
            | null
          is_inherited?: boolean | null
          override_rules?: Json | null
          parent_policy_id?: string | null
          platform_sync_status?: Json | null
          pom?: Json | null
          rfp_template_data?: Json | null
          scope_id?: string | null
          source_document_path?: string | null
          status?: Database["public"]["Enums"]["policy_status_enum"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policies_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policies_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_matrix_scope_first"
            referencedColumns: ["scope_id"]
          },
          {
            foreignKeyName: "policies_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_alignments: {
        Row: {
          client_enterprise_id: string | null
          client_id: string | null
          conflicts: Json | null
          created_at: string
          external_policy_id: string | null
          external_policy_name: string | null
          harmonized_pom: Json
          id: string
          policy_id: string
          snapshot_id: string
          updated_at: string
        }
        Insert: {
          client_enterprise_id?: string | null
          client_id?: string | null
          conflicts?: Json | null
          created_at?: string
          external_policy_id?: string | null
          external_policy_name?: string | null
          harmonized_pom?: Json
          id?: string
          policy_id: string
          snapshot_id: string
          updated_at?: string
        }
        Update: {
          client_enterprise_id?: string | null
          client_id?: string | null
          conflicts?: Json | null
          created_at?: string
          external_policy_id?: string | null
          external_policy_name?: string | null
          harmonized_pom?: Json
          id?: string
          policy_id?: string
          snapshot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_alignments_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_alignments_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_alignments_client_enterprise_id_fkey"
            columns: ["client_enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_alignments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_alignments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_alignments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_clauses: {
        Row: {
          applied_to_instances: string[] | null
          clause_ref: string | null
          clause_text: string
          clause_title: string | null
          controls: string[] | null
          created_at: string | null
          enterprise_id: string
          evidence: string[] | null
          id: string
          lane: string | null
          lane_confidence: number | null
          mapping_status: string | null
          policy_id: string
          pom_field_mappings: Json | null
          tags: string[] | null
        }
        Insert: {
          applied_to_instances?: string[] | null
          clause_ref?: string | null
          clause_text: string
          clause_title?: string | null
          controls?: string[] | null
          created_at?: string | null
          enterprise_id: string
          evidence?: string[] | null
          id: string
          lane?: string | null
          lane_confidence?: number | null
          mapping_status?: string | null
          policy_id: string
          pom_field_mappings?: Json | null
          tags?: string[] | null
        }
        Update: {
          applied_to_instances?: string[] | null
          clause_ref?: string | null
          clause_text?: string
          clause_title?: string | null
          controls?: string[] | null
          created_at?: string | null
          enterprise_id?: string
          evidence?: string[] | null
          id?: string
          lane?: string | null
          lane_confidence?: number | null
          mapping_status?: string | null
          policy_id?: string
          pom_field_mappings?: Json | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_clauses_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_clauses_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_clauses_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_clauses_enterprise_id_policy_id_fkey"
            columns: ["enterprise_id", "policy_id"]
            isOneToOne: false
            referencedRelation: "policy_master"
            referencedColumns: ["enterprise_id", "id"]
          },
        ]
      }
      policy_client_overlays: {
        Row: {
          client_id: string
          created_at: string | null
          enterprise_id: string
          id: number
          overrides: Json
          policy_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          enterprise_id: string
          id?: number
          overrides?: Json
          policy_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          enterprise_id?: string
          id?: number
          overrides?: Json
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_client_overlays_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_client_overlays_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_client_overlays_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_client_overlays_enterprise_id_policy_id_fkey"
            columns: ["enterprise_id", "policy_id"]
            isOneToOne: false
            referencedRelation: "policy_master"
            referencedColumns: ["enterprise_id", "id"]
          },
        ]
      }
      policy_conflicts: {
        Row: {
          child_policy_id: string
          child_value: Json | null
          conflict_type: string
          conflicting_rule: string
          created_at: string | null
          description: string | null
          detected_at: string | null
          field_path: string
          id: string
          parent_policy_id: string
          parent_value: Json | null
          resolution_notes: string | null
          resolution_status: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          child_policy_id: string
          child_value?: Json | null
          conflict_type: string
          conflicting_rule: string
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          field_path: string
          id?: string
          parent_policy_id: string
          parent_value?: Json | null
          resolution_notes?: string | null
          resolution_status?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          child_policy_id?: string
          child_value?: Json | null
          conflict_type?: string
          conflicting_rule?: string
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          field_path?: string
          id?: string
          parent_policy_id?: string
          parent_value?: Json | null
          resolution_notes?: string | null
          resolution_status?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_conflicts_child_policy_id_fkey"
            columns: ["child_policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_conflicts_child_policy_id_fkey"
            columns: ["child_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_conflicts_child_policy_id_fkey"
            columns: ["child_policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_conflicts_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_conflicts_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_conflicts_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_controls: {
        Row: {
          control_key: string
          created_at: string | null
          evidence_url: string | null
          id: string
          metadata: Json
          points: number
          stage: Database["public"]["Enums"]["stage_t"]
          weight: number
          workflow_id: string
        }
        Insert: {
          control_key: string
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          metadata?: Json
          points: number
          stage?: Database["public"]["Enums"]["stage_t"]
          weight?: number
          workflow_id: string
        }
        Update: {
          control_key?: string
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          metadata?: Json
          points?: number
          stage?: Database["public"]["Enums"]["stage_t"]
          weight?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_controls_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_distributions: {
        Row: {
          created_at: string | null
          distributed_by: string | null
          distribution_type: string | null
          id: string
          metadata: Json
          note: string | null
          policy_version_id: string
          response_deadline: string | null
          status: string
          target_workspace_id: string
        }
        Insert: {
          created_at?: string | null
          distributed_by?: string | null
          distribution_type?: string | null
          id?: string
          metadata?: Json
          note?: string | null
          policy_version_id: string
          response_deadline?: string | null
          status?: string
          target_workspace_id: string
        }
        Update: {
          created_at?: string | null
          distributed_by?: string | null
          distribution_type?: string | null
          id?: string
          metadata?: Json
          note?: string | null
          policy_version_id?: string
          response_deadline?: string | null
          status?: string
          target_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_distributions_policy_version_id_fkey"
            columns: ["policy_version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_distributions_target_workspace_id_fkey"
            columns: ["target_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_evidence_bundles: {
        Row: {
          body: Json
          created_at: string | null
          id: string
          policy_snapshot_id: string
          tenant_id: string
        }
        Insert: {
          body: Json
          created_at?: string | null
          id?: string
          policy_snapshot_id: string
          tenant_id: string
        }
        Update: {
          body?: Json
          created_at?: string | null
          id?: string
          policy_snapshot_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      policy_gaps: {
        Row: {
          detected_at: string
          field_path: string
          gap_type: string
          hint: string | null
          id: string
          policy_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: number
        }
        Insert: {
          detected_at?: string
          field_path: string
          gap_type: string
          hint?: string | null
          id?: string
          policy_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: number
        }
        Update: {
          detected_at?: string
          field_path?: string
          gap_type?: string
          hint?: string | null
          id?: string
          policy_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
        }
        Relationships: [
          {
            foreignKeyName: "policy_gaps_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_gaps_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_gaps_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_ingest_mappings: {
        Row: {
          created_at: string
          extractor_version: string
          field_extractors: Json | null
          id: string
          mapping_rules: Json
          source_type: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          extractor_version: string
          field_extractors?: Json | null
          id?: string
          mapping_rules?: Json
          source_type: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          extractor_version?: string
          field_extractors?: Json | null
          id?: string
          mapping_rules?: Json
          source_type?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      policy_insights: {
        Row: {
          affected_partners: string[] | null
          affected_policies: string[]
          created_at: string | null
          data_evidence: Json
          description: string
          enterprise_id: string
          id: string
          insight_type: string
          recommendations: Json
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_partners?: string[] | null
          affected_policies?: string[]
          created_at?: string | null
          data_evidence?: Json
          description: string
          enterprise_id: string
          id?: string
          insight_type: string
          recommendations?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_partners?: string[] | null
          affected_policies?: string[]
          created_at?: string | null
          data_evidence?: Json
          description?: string
          enterprise_id?: string
          id?: string
          insight_type?: string
          recommendations?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_insights_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_insights_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_insights_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_instances: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audience: string[] | null
          created_at: string
          created_by: string | null
          current_eps_id: string | null
          enterprise_id: string
          eps_version: number | null
          expires_at: string | null
          id: string
          jurisdiction: string[] | null
          pom: Json
          status: string
          template_id: string | null
          tool_version_id: string
          updated_at: string
          updated_by: string | null
          use_case: string
          workspace_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audience?: string[] | null
          created_at?: string
          created_by?: string | null
          current_eps_id?: string | null
          enterprise_id: string
          eps_version?: number | null
          expires_at?: string | null
          id?: string
          jurisdiction?: string[] | null
          pom: Json
          status?: string
          template_id?: string | null
          tool_version_id: string
          updated_at?: string
          updated_by?: string | null
          use_case: string
          workspace_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audience?: string[] | null
          created_at?: string
          created_by?: string | null
          current_eps_id?: string | null
          enterprise_id?: string
          eps_version?: number | null
          expires_at?: string | null
          id?: string
          jurisdiction?: string[] | null
          pom?: Json
          status?: string
          template_id?: string | null
          tool_version_id?: string
          updated_at?: string
          updated_by?: string | null
          use_case?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_instances_current_eps_id_fkey"
            columns: ["current_eps_id"]
            isOneToOne: false
            referencedRelation: "effective_policy_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_instances_tool_version_id_fkey"
            columns: ["tool_version_id"]
            isOneToOne: false
            referencedRelation: "ai_tool_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_master: {
        Row: {
          allowed_use_cases: string[] | null
          classification: Json | null
          created_at: string | null
          effective_date: string | null
          enterprise_id: string
          id: string
          owner: string | null
          prohibited_use_cases: string[] | null
          raw_doc_url: string | null
          regionality: Json | null
          retention: Json | null
          review_cycle_months: number | null
          status: string
          title: string
          tool_identity: Json | null
          updated_at: string | null
          version: string
        }
        Insert: {
          allowed_use_cases?: string[] | null
          classification?: Json | null
          created_at?: string | null
          effective_date?: string | null
          enterprise_id: string
          id: string
          owner?: string | null
          prohibited_use_cases?: string[] | null
          raw_doc_url?: string | null
          regionality?: Json | null
          retention?: Json | null
          review_cycle_months?: number | null
          status: string
          title: string
          tool_identity?: Json | null
          updated_at?: string | null
          version: string
        }
        Update: {
          allowed_use_cases?: string[] | null
          classification?: Json | null
          created_at?: string | null
          effective_date?: string | null
          enterprise_id?: string
          id?: string
          owner?: string | null
          prohibited_use_cases?: string[] | null
          raw_doc_url?: string | null
          regionality?: Json | null
          retention?: Json | null
          review_cycle_months?: number | null
          status?: string
          title?: string
          tool_identity?: Json | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_master_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_master_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_master_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_parse_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          enterprise_id: string
          errors: Json | null
          id: string
          metadata: Json | null
          policy_id: string | null
          source_filename: string
          source_mime: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          enterprise_id: string
          errors?: Json | null
          id?: string
          metadata?: Json | null
          policy_id?: string | null
          source_filename: string
          source_mime?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          enterprise_id?: string
          errors?: Json | null
          id?: string
          metadata?: Json | null
          policy_id?: string | null
          source_filename?: string
          source_mime?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_parse_jobs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_parse_jobs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_parse_jobs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_propagation_status: {
        Row: {
          approved_at: string | null
          conflicts_detected: number | null
          created_at: string
          draft_at: string | null
          enforced_at: string | null
          enterprise_id: string | null
          id: string
          metadata: Json | null
          policy_id: string
          propagated_at: string | null
          proven_at: string | null
          sandbox_delta: boolean | null
          state: string
          updated_at: string
          version: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          conflicts_detected?: number | null
          created_at?: string
          draft_at?: string | null
          enforced_at?: string | null
          enterprise_id?: string | null
          id?: string
          metadata?: Json | null
          policy_id: string
          propagated_at?: string | null
          proven_at?: string | null
          sandbox_delta?: boolean | null
          state?: string
          updated_at?: string
          version: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          conflicts_detected?: number | null
          created_at?: string
          draft_at?: string | null
          enforced_at?: string | null
          enterprise_id?: string | null
          id?: string
          metadata?: Json | null
          policy_id?: string
          propagated_at?: string | null
          proven_at?: string | null
          sandbox_delta?: boolean | null
          state?: string
          updated_at?: string
          version?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_propagation_status_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_propagation_status_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_propagation_status_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_propagation_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_resolutions: {
        Row: {
          created_at: string
          distribution_id: string
          id: string
          overall_score: number | null
          resolution_data: Json
        }
        Insert: {
          created_at?: string
          distribution_id: string
          id?: string
          overall_score?: number | null
          resolution_data?: Json
        }
        Update: {
          created_at?: string
          distribution_id?: string
          id?: string
          overall_score?: number | null
          resolution_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "policy_resolutions_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["distribution_id"]
          },
          {
            foreignKeyName: "policy_resolutions_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "policy_distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_rules: {
        Row: {
          context_id: string
          created_at: string | null
          id: string
          is_active: boolean
          priority: number
          rule: Json
          tenant_id: string
        }
        Insert: {
          context_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          priority: number
          rule: Json
          tenant_id: string
        }
        Update: {
          context_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule?: Json
          tenant_id?: string
        }
        Relationships: []
      }
      policy_templates: {
        Row: {
          base_pom: Json
          compliance_frameworks: string[]
          created_at: string
          description: string | null
          id: string
          industry: string
          policy_type: string
          title: string
          updated_at: string
        }
        Insert: {
          base_pom: Json
          compliance_frameworks?: string[]
          created_at?: string
          description?: string | null
          id?: string
          industry: string
          policy_type: string
          title: string
          updated_at?: string
        }
        Update: {
          base_pom?: Json
          compliance_frameworks?: string[]
          created_at?: string
          description?: string | null
          id?: string
          industry?: string
          policy_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_validation_events: {
        Row: {
          decision: string
          enterprise_id: string
          eps_hash: string | null
          eps_id: string | null
          event_metadata: Json | null
          id: string
          policy_instance_id: string
          response_time_ms: number | null
          scope_path: string | null
          timestamp: string
          tool_version_id: string
          usage_context: Json | null
          violations: Json
          warnings: Json
          workspace_id: string
        }
        Insert: {
          decision: string
          enterprise_id: string
          eps_hash?: string | null
          eps_id?: string | null
          event_metadata?: Json | null
          id?: string
          policy_instance_id: string
          response_time_ms?: number | null
          scope_path?: string | null
          timestamp?: string
          tool_version_id: string
          usage_context?: Json | null
          violations?: Json
          warnings?: Json
          workspace_id: string
        }
        Update: {
          decision?: string
          enterprise_id?: string
          eps_hash?: string | null
          eps_id?: string | null
          event_metadata?: Json | null
          id?: string
          policy_instance_id?: string
          response_time_ms?: number | null
          scope_path?: string | null
          timestamp?: string
          tool_version_id?: string
          usage_context?: Json | null
          violations?: Json
          warnings?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_validation_events_eps_id_fkey"
            columns: ["eps_id"]
            isOneToOne: false
            referencedRelation: "effective_policy_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_versions: {
        Row: {
          compliance_scoring_profile: Json | null
          control_mappings: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          distributed_at: string | null
          id: string
          jurisdictions: string[] | null
          policy_id: string
          published_at: string | null
          rfp_metadata: Json | null
          rules: Json | null
          status: Database["public"]["Enums"]["policy_status"] | null
          title: string
          tool_whitelist: Json | null
          version_number: number
        }
        Insert: {
          compliance_scoring_profile?: Json | null
          control_mappings?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          distributed_at?: string | null
          id?: string
          jurisdictions?: string[] | null
          policy_id: string
          published_at?: string | null
          rfp_metadata?: Json | null
          rules?: Json | null
          status?: Database["public"]["Enums"]["policy_status"] | null
          title: string
          tool_whitelist?: Json | null
          version_number: number
        }
        Update: {
          compliance_scoring_profile?: Json | null
          control_mappings?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          distributed_at?: string | null
          id?: string
          jurisdictions?: string[] | null
          policy_id?: string
          published_at?: string | null
          rfp_metadata?: Json | null
          rules?: Json | null
          status?: Database["public"]["Enums"]["policy_status"] | null
          title?: string
          tool_whitelist?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "policy_versions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_versions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_versions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
        ]
      }
      postrun_outcomes: {
        Row: {
          details: Json | null
          id: string
          outcome_key: string
          points: number
          recorded_at: string | null
          recorded_by: string | null
          workflow_id: string | null
        }
        Insert: {
          details?: Json | null
          id?: string
          outcome_key: string
          points: number
          recorded_at?: string | null
          recorded_by?: string | null
          workflow_id?: string | null
        }
        Update: {
          details?: Json | null
          id?: string
          outcome_key?: string
          points?: number
          recorded_at?: string | null
          recorded_by?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postrun_outcomes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postrun_outcomes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          compliance_streak: number | null
          compliance_streak_best: number | null
          created_at: string
          first_name: string | null
          id: string
          last_compliance_date: string | null
          last_name: string | null
          marketing_consent: boolean | null
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          compliance_streak?: number | null
          compliance_streak_best?: number | null
          created_at?: string
          first_name?: string | null
          id: string
          last_compliance_date?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          compliance_streak?: number | null
          compliance_streak_best?: number | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_compliance_date?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_ai_tool_usage: {
        Row: {
          compliance_status: string | null
          created_at: string | null
          enterprise_id: string
          first_used: string | null
          id: string
          last_used: string | null
          policy_violations: string[] | null
          project_id: string
          risk_level: string | null
          tool_name: string
          updated_at: string | null
          usage_count: number | null
          vendor_name: string | null
          workspace_id: string | null
        }
        Insert: {
          compliance_status?: string | null
          created_at?: string | null
          enterprise_id: string
          first_used?: string | null
          id?: string
          last_used?: string | null
          policy_violations?: string[] | null
          project_id: string
          risk_level?: string | null
          tool_name: string
          updated_at?: string | null
          usage_count?: number | null
          vendor_name?: string | null
          workspace_id?: string | null
        }
        Update: {
          compliance_status?: string | null
          created_at?: string | null
          enterprise_id?: string
          first_used?: string | null
          id?: string
          last_used?: string | null
          policy_violations?: string[] | null
          project_id?: string
          risk_level?: string | null
          tool_name?: string
          updated_at?: string | null
          usage_count?: number | null
          vendor_name?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          brand: string
          client_name: string
          created_at: string
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          project_description: string | null
          project_name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          brand: string
          client_name: string
          created_at?: string
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          project_description?: string | null
          project_name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          brand?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          project_description?: string | null
          project_name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      prompt_reflections: {
        Row: {
          agent_name: string
          created_at: string
          created_by: string | null
          id: string
          reflection: Json
          run_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          reflection: Json
          run_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reflection?: Json
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_reflections_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "optimization_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_reflections_v2: {
        Row: {
          created_at: string | null
          diagnosis: string
          failure_examples: Json | null
          id: string
          key_issues: Json | null
          optimization_run_id: string
          parent_prompt_id: string | null
          proposed_changes: string
          reasoning: string
          resulting_prompt_id: string | null
          success_examples: Json | null
        }
        Insert: {
          created_at?: string | null
          diagnosis: string
          failure_examples?: Json | null
          id?: string
          key_issues?: Json | null
          optimization_run_id: string
          parent_prompt_id?: string | null
          proposed_changes: string
          reasoning: string
          resulting_prompt_id?: string | null
          success_examples?: Json | null
        }
        Update: {
          created_at?: string | null
          diagnosis?: string
          failure_examples?: Json | null
          id?: string
          key_issues?: Json | null
          optimization_run_id?: string
          parent_prompt_id?: string | null
          proposed_changes?: string
          reasoning?: string
          resulting_prompt_id?: string | null
          success_examples?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_reflections_v2_optimization_run_id_fkey"
            columns: ["optimization_run_id"]
            isOneToOne: false
            referencedRelation: "optimization_runs_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_reflections_v2_parent_prompt_id_fkey"
            columns: ["parent_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_reflections_v2_resulting_prompt_id_fkey"
            columns: ["resulting_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_atoms: {
        Row: {
          category: string
          collection_method: string
          created_at: string | null
          data_type: string
          description: string | null
          enterprise_id: string | null
          id: string
          label: string
          schema: Json | null
          sensitivity_level: string
          updated_at: string | null
          version: string
        }
        Insert: {
          category: string
          collection_method: string
          created_at?: string | null
          data_type: string
          description?: string | null
          enterprise_id?: string | null
          id: string
          label: string
          schema?: Json | null
          sensitivity_level: string
          updated_at?: string | null
          version: string
        }
        Update: {
          category?: string
          collection_method?: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          enterprise_id?: string | null
          id?: string
          label?: string
          schema?: Json | null
          sensitivity_level?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_atoms_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "proof_atoms_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "proof_atoms_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_bundles: {
        Row: {
          artifacts: Json
          bundle_id: string
          client_name: string
          created_at: string
          created_by: string | null
          eps_hash: string | null
          eps_id: string | null
          hash: string
          metadata: Json | null
          rfp_id: string | null
          signature: string | null
          workflow_trace: Json
        }
        Insert: {
          artifacts?: Json
          bundle_id?: string
          client_name: string
          created_at?: string
          created_by?: string | null
          eps_hash?: string | null
          eps_id?: string | null
          hash: string
          metadata?: Json | null
          rfp_id?: string | null
          signature?: string | null
          workflow_trace?: Json
        }
        Update: {
          artifacts?: Json
          bundle_id?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          eps_hash?: string | null
          eps_id?: string | null
          hash?: string
          metadata?: Json | null
          rfp_id?: string | null
          signature?: string | null
          workflow_trace?: Json
        }
        Relationships: [
          {
            foreignKeyName: "proof_bundles_eps_id_fkey"
            columns: ["eps_id"]
            isOneToOne: false
            referencedRelation: "effective_policy_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_pack_atoms: {
        Row: {
          atom_id: string
          constraints: Json | null
          created_at: string | null
          id: string
          proof_pack_id: string
          required: boolean
          updated_at: string | null
        }
        Insert: {
          atom_id: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          proof_pack_id: string
          required?: boolean
          updated_at?: string | null
        }
        Update: {
          atom_id?: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          proof_pack_id?: string
          required?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proof_pack_atoms_atom_id_fkey"
            columns: ["atom_id"]
            isOneToOne: false
            referencedRelation: "proof_atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_pack_atoms_proof_pack_id_fkey"
            columns: ["proof_pack_id"]
            isOneToOne: false
            referencedRelation: "proof_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_packs: {
        Row: {
          applies_when: Json | null
          created_at: string | null
          description: string | null
          enterprise_id: string | null
          id: string
          label: string
          organization_id: string | null
          priority: number
          severity: string
          subtenant_id: string | null
          updated_at: string | null
          version: string
        }
        Insert: {
          applies_when?: Json | null
          created_at?: string | null
          description?: string | null
          enterprise_id?: string | null
          id: string
          label: string
          organization_id?: string | null
          priority?: number
          severity: string
          subtenant_id?: string | null
          updated_at?: string | null
          version: string
        }
        Update: {
          applies_when?: Json | null
          created_at?: string | null
          description?: string | null
          enterprise_id?: string | null
          id?: string
          label?: string
          organization_id?: string | null
          priority?: number
          severity?: string
          subtenant_id?: string | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_packs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "proof_packs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "proof_packs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_packs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_packs_subtenant_id_fkey"
            columns: ["subtenant_id"]
            isOneToOne: false
            referencedRelation: "subtenants"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements_profiles: {
        Row: {
          conflicts: string[] | null
          constraints: Json | null
          created_at: string | null
          enterprise_id: string
          id: string
          optional_atoms: string[]
          organization_id: string | null
          profile_key: string
          required_atoms: string[]
          source_packs: string[]
          submission_id: string
          subtenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          conflicts?: string[] | null
          constraints?: Json | null
          created_at?: string | null
          enterprise_id: string
          id?: string
          optional_atoms: string[]
          organization_id?: string | null
          profile_key: string
          required_atoms: string[]
          source_packs: string[]
          submission_id: string
          subtenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          conflicts?: string[] | null
          constraints?: Json | null
          created_at?: string | null
          enterprise_id?: string
          id?: string
          optional_atoms?: string[]
          organization_id?: string | null
          profile_key?: string
          required_atoms?: string[]
          source_packs?: string[]
          submission_id?: string
          subtenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirements_profiles_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "requirements_profiles_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "requirements_profiles_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_profiles_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_profiles_subtenant_id_fkey"
            columns: ["subtenant_id"]
            isOneToOne: false
            referencedRelation: "subtenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rfp_profiles: {
        Row: {
          client_name: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          profile_id: string
          requires: Json
          theme_weights: Json | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          profile_id: string
          requires?: Json
          theme_weights?: Json | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          profile_id?: string
          requires?: Json
          theme_weights?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      rfp_question_library: {
        Row: {
          answer_template_type: string | null
          auto_answerable: boolean | null
          created_at: string | null
          distribution_id: string
          id: string
          is_mandatory: boolean | null
          lane_confidence: number | null
          linked_policy_clause: string | null
          linked_policy_id: string | null
          metadata: Json | null
          question_lane: Database["public"]["Enums"]["rfp_question_lane"] | null
          question_number: number
          question_text: string
          question_type: string
          required_evidence: string[] | null
          routing_rationale: string | null
          section: string
          updated_at: string | null
        }
        Insert: {
          answer_template_type?: string | null
          auto_answerable?: boolean | null
          created_at?: string | null
          distribution_id: string
          id?: string
          is_mandatory?: boolean | null
          lane_confidence?: number | null
          linked_policy_clause?: string | null
          linked_policy_id?: string | null
          metadata?: Json | null
          question_lane?:
            | Database["public"]["Enums"]["rfp_question_lane"]
            | null
          question_number: number
          question_text: string
          question_type?: string
          required_evidence?: string[] | null
          routing_rationale?: string | null
          section: string
          updated_at?: string | null
        }
        Update: {
          answer_template_type?: string | null
          auto_answerable?: boolean | null
          created_at?: string | null
          distribution_id?: string
          id?: string
          is_mandatory?: boolean | null
          lane_confidence?: number | null
          linked_policy_clause?: string | null
          linked_policy_id?: string | null
          metadata?: Json | null
          question_lane?:
            | Database["public"]["Enums"]["rfp_question_lane"]
            | null
          question_number?: number
          question_text?: string
          question_type?: string
          required_evidence?: string[] | null
          routing_rationale?: string | null
          section?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfp_question_library_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["distribution_id"]
          },
          {
            foreignKeyName: "rfp_question_library_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "policy_distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfp_question_library_linked_policy_id_fkey"
            columns: ["linked_policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "rfp_question_library_linked_policy_id_fkey"
            columns: ["linked_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfp_question_library_linked_policy_id_fkey"
            columns: ["linked_policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
        ]
      }
      rfp_tool_disclosures: {
        Row: {
          connectors: string[] | null
          created_at: string
          data_scope: Json | null
          distribution_id: string
          id: string
          intended_use: string | null
          provider: string | null
          tool_id: string | null
          tool_name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          connectors?: string[] | null
          created_at?: string
          data_scope?: Json | null
          distribution_id: string
          id?: string
          intended_use?: string | null
          provider?: string | null
          tool_id?: string | null
          tool_name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          connectors?: string[] | null
          created_at?: string
          data_scope?: Json | null
          distribution_id?: string
          id?: string
          intended_use?: string | null
          provider?: string | null
          tool_id?: string | null
          tool_name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfp_tool_disclosures_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["distribution_id"]
          },
          {
            foreignKeyName: "rfp_tool_disclosures_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "policy_distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_profile_assessments: {
        Row: {
          assessed_at: string | null
          audit_checklist: Json
          created_at: string | null
          decision_id: number | null
          dimension_scores: Json
          enterprise_id: string | null
          id: string
          recommended_controls: Json | null
          risk_profile_tier: string
          tier_rationale: string | null
          tool_name: string
          vendor_name: string | null
        }
        Insert: {
          assessed_at?: string | null
          audit_checklist?: Json
          created_at?: string | null
          decision_id?: number | null
          dimension_scores?: Json
          enterprise_id?: string | null
          id?: string
          recommended_controls?: Json | null
          risk_profile_tier: string
          tier_rationale?: string | null
          tool_name: string
          vendor_name?: string | null
        }
        Update: {
          assessed_at?: string | null
          audit_checklist?: Json
          created_at?: string | null
          decision_id?: number | null
          dimension_scores?: Json
          enterprise_id?: string | null
          id?: string
          recommended_controls?: Json | null
          risk_profile_tier?: string
          tier_rationale?: string | null
          tool_name?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_profile_assessments_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_profile_assessments_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "risk_profile_assessments_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "risk_profile_assessments_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_scores: {
        Row: {
          band: Database["public"]["Enums"]["risk_band_t"]
          in_run: number
          last_calculated_at: string | null
          post_run: number
          pre_run: number
          total: number
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          band?: Database["public"]["Enums"]["risk_band_t"]
          in_run?: number
          last_calculated_at?: string | null
          post_run?: number
          pre_run?: number
          total?: number
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          band?: Database["public"]["Enums"]["risk_band_t"]
          in_run?: number
          last_calculated_at?: string | null
          post_run?: number
          pre_run?: number
          total?: number
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_scores_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: true
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_snapshot: {
        Row: {
          brand_id: string | null
          created_at: string
          enterprise_id: string | null
          id: string
          in_run: number
          post: number
          pre: number
          score: number
          sev1_cnt: number | null
          sev2_cnt: number | null
          sev3_cnt: number | null
          trend_30d: number | null
          trend_7d: number | null
          ts: string
          workspace_id: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          enterprise_id?: string | null
          id?: string
          in_run: number
          post: number
          pre: number
          score: number
          sev1_cnt?: number | null
          sev2_cnt?: number | null
          sev3_cnt?: number | null
          trend_30d?: number | null
          trend_7d?: number | null
          ts?: string
          workspace_id?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          enterprise_id?: string | null
          id?: string
          in_run?: number
          post?: number
          pre?: number
          score?: number
          sev1_cnt?: number | null
          sev2_cnt?: number | null
          sev3_cnt?: number | null
          trend_30d?: number | null
          trend_7d?: number | null
          ts?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_snapshot_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "risk_snapshot_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "risk_snapshot_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_snapshot_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_weights: {
        Row: {
          id: boolean
          regulatory_compliance_multiplier: number
          vendor_security_multiplier: number
          w_in: number
          w_post: number
          w_pre: number
        }
        Insert: {
          id?: boolean
          regulatory_compliance_multiplier?: number
          vendor_security_multiplier?: number
          w_in?: number
          w_post?: number
          w_pre?: number
        }
        Update: {
          id?: boolean
          regulatory_compliance_multiplier?: number
          vendor_security_multiplier?: number
          w_in?: number
          w_post?: number
          w_pre?: number
        }
        Relationships: []
      }
      runtime_bindings: {
        Row: {
          activated_at: string
          created_at: string
          deactivated_at: string | null
          enterprise_id: string
          id: string
          last_verified_at: string | null
          partner_id: string | null
          policy_instance_id: string
          scope_path: string | null
          status: string
          updated_at: string
          violation_count: number | null
          workspace_id: string | null
        }
        Insert: {
          activated_at?: string
          created_at?: string
          deactivated_at?: string | null
          enterprise_id: string
          id?: string
          last_verified_at?: string | null
          partner_id?: string | null
          policy_instance_id: string
          scope_path?: string | null
          status?: string
          updated_at?: string
          violation_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          activated_at?: string
          created_at?: string
          deactivated_at?: string | null
          enterprise_id?: string
          id?: string
          last_verified_at?: string | null
          partner_id?: string | null
          policy_instance_id?: string
          scope_path?: string | null
          status?: string
          updated_at?: string
          violation_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "runtime_bindings_policy_instance_id_fkey"
            columns: ["policy_instance_id"]
            isOneToOne: false
            referencedRelation: "policy_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_approvals: {
        Row: {
          approver_role: string | null
          created_at: string
          estimated_sla_hours: number | null
          id: string
          required: boolean
          run_id: string
          stage_name: string
          stage_order: number
          triggers_on: Json | null
        }
        Insert: {
          approver_role?: string | null
          created_at?: string
          estimated_sla_hours?: number | null
          id?: string
          required?: boolean
          run_id: string
          stage_name: string
          stage_order: number
          triggers_on?: Json | null
        }
        Update: {
          approver_role?: string | null
          created_at?: string
          estimated_sla_hours?: number | null
          id?: string
          required?: boolean
          run_id?: string
          stage_name?: string
          stage_order?: number
          triggers_on?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_approvals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandbox_approvals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_controls: {
        Row: {
          check_details: Json | null
          control_category: string
          control_id: string
          control_name: string
          created_at: string
          fix_effort_hours: number | null
          fix_suggestion: string | null
          id: string
          run_id: string
          severity: string | null
          status: string
        }
        Insert: {
          check_details?: Json | null
          control_category: string
          control_id: string
          control_name: string
          created_at?: string
          fix_effort_hours?: number | null
          fix_suggestion?: string | null
          id?: string
          run_id: string
          severity?: string | null
          status: string
        }
        Update: {
          check_details?: Json | null
          control_category?: string
          control_id?: string
          control_name?: string
          created_at?: string
          fix_effort_hours?: number | null
          fix_suggestion?: string | null
          id?: string
          run_id?: string
          severity?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_controls_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandbox_controls_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_projects: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          enterprise_id: string
          failed_runs: number | null
          id: string
          mode: string | null
          passed_runs: number | null
          project_description: string | null
          project_goal: string | null
          project_name: string
          settings: Json | null
          started_at: string | null
          status: string
          tags: Json | null
          target_completion_date: string | null
          total_runs: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          enterprise_id: string
          failed_runs?: number | null
          id?: string
          mode?: string | null
          passed_runs?: number | null
          project_description?: string | null
          project_goal?: string | null
          project_name: string
          settings?: Json | null
          started_at?: string | null
          status?: string
          tags?: Json | null
          target_completion_date?: string | null
          total_runs?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          enterprise_id?: string
          failed_runs?: number | null
          id?: string
          mode?: string | null
          passed_runs?: number | null
          project_description?: string | null
          project_goal?: string | null
          project_name?: string
          settings?: Json | null
          started_at?: string | null
          status?: string
          tags?: Json | null
          target_completion_date?: string | null
          total_runs?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_projects_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "sandbox_projects_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "sandbox_projects_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandbox_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_runs: {
        Row: {
          agent_confidence: number | null
          agent_metadata: Json | null
          agent_reasoning: string | null
          audit_checklist: Json | null
          control_coverage: number | null
          created_at: string
          created_by: string | null
          dimension_scores: Json | null
          error_message: string | null
          grade: string | null
          id: string
          inputs_json: Json
          outputs_json: Json
          project_id: string | null
          proof_hash: string | null
          risk_profile_tier: string | null
          risk_score: number | null
          run_status: string
          scenario_name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_confidence?: number | null
          agent_metadata?: Json | null
          agent_reasoning?: string | null
          audit_checklist?: Json | null
          control_coverage?: number | null
          created_at?: string
          created_by?: string | null
          dimension_scores?: Json | null
          error_message?: string | null
          grade?: string | null
          id?: string
          inputs_json?: Json
          outputs_json?: Json
          project_id?: string | null
          proof_hash?: string | null
          risk_profile_tier?: string | null
          risk_score?: number | null
          run_status?: string
          scenario_name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_confidence?: number | null
          agent_metadata?: Json | null
          agent_reasoning?: string | null
          audit_checklist?: Json | null
          control_coverage?: number | null
          created_at?: string
          created_by?: string | null
          dimension_scores?: Json | null
          error_message?: string | null
          grade?: string | null
          id?: string
          inputs_json?: Json
          outputs_json?: Json
          project_id?: string | null
          proof_hash?: string | null
          risk_profile_tier?: string | null
          risk_score?: number | null
          run_status?: string
          scenario_name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sandbox_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandbox_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scoped_policies: {
        Row: {
          created_at: string | null
          created_by: string | null
          enterprise_id: string
          id: string
          inheritance_mode: Database["public"]["Enums"]["policy_inheritance_mode"]
          override_rules: Json | null
          parent_policy_id: string | null
          policy_name: string
          rules: Json
          scope_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          enterprise_id: string
          id?: string
          inheritance_mode: Database["public"]["Enums"]["policy_inheritance_mode"]
          override_rules?: Json | null
          parent_policy_id?: string | null
          policy_name: string
          rules?: Json
          scope_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          enterprise_id?: string
          id?: string
          inheritance_mode?: Database["public"]["Enums"]["policy_inheritance_mode"]
          override_rules?: Json | null
          parent_policy_id?: string | null
          policy_name?: string
          rules?: Json
          scope_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoped_policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "scoped_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoped_policies_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_matrix_scope_first"
            referencedColumns: ["scope_id"]
          },
          {
            foreignKeyName: "scoped_policies_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      scopes: {
        Row: {
          compliance_frameworks: string[] | null
          country_code: string | null
          created_at: string | null
          data_class: string | null
          enterprise_id: string
          id: string
          metadata: Json | null
          parent_id: string | null
          region: string | null
          scope_name: string
          scope_path: unknown
          scope_type: string
          updated_at: string | null
        }
        Insert: {
          compliance_frameworks?: string[] | null
          country_code?: string | null
          created_at?: string | null
          data_class?: string | null
          enterprise_id: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          region?: string | null
          scope_name: string
          scope_path: unknown
          scope_type: string
          updated_at?: string | null
        }
        Update: {
          compliance_frameworks?: string[] | null
          country_code?: string | null
          created_at?: string | null
          data_class?: string | null
          enterprise_id?: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          region?: string | null
          scope_name?: string
          scope_path?: unknown
          scope_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scopes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "scopes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "scopes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scopes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "access_matrix_scope_first"
            referencedColumns: ["scope_id"]
          },
          {
            foreignKeyName: "scopes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          category_scores: Json | null
          created_at: string | null
          id: string
          overall_score: number | null
          run_id: string | null
          run_mode: string | null
          submission_id: string | null
          submission_item_id: string | null
        }
        Insert: {
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          overall_score?: number | null
          run_id?: string | null
          run_mode?: string | null
          submission_id?: string | null
          submission_item_id?: string | null
        }
        Update: {
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          overall_score?: number | null
          run_id?: string | null
          run_mode?: string | null
          submission_id?: string | null
          submission_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_submission_item_id_fkey"
            columns: ["submission_item_id"]
            isOneToOne: false
            referencedRelation: "submission_items"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_access_log: {
        Row: {
          action: string | null
          actor_id: string
          at: string | null
          id: string
          secret_id: string | null
        }
        Insert: {
          action?: string | null
          actor_id: string
          at?: string | null
          id?: string
          secret_id?: string | null
        }
        Update: {
          action?: string | null
          actor_id?: string
          at?: string | null
          id?: string
          secret_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secret_access_log_secret_id_fkey"
            columns: ["secret_id"]
            isOneToOne: false
            referencedRelation: "secrets"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets: {
        Row: {
          created_at: string | null
          enterprise_id: string
          id: string
          name: string
          rotated_at: string | null
          rotation_interval_days: number | null
          scope_id: string | null
          wrapped_key_ref: string
        }
        Insert: {
          created_at?: string | null
          enterprise_id: string
          id?: string
          name: string
          rotated_at?: string | null
          rotation_interval_days?: number | null
          scope_id?: string | null
          wrapped_key_ref: string
        }
        Update: {
          created_at?: string | null
          enterprise_id?: string
          id?: string
          name?: string
          rotated_at?: string | null
          rotation_interval_days?: number | null
          scope_id?: string | null
          wrapped_key_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "secrets_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "secrets_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "secrets_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secrets_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_matrix_scope_first"
            referencedColumns: ["scope_id"]
          },
          {
            foreignKeyName: "secrets_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      structured_policy_data: {
        Row: {
          approval_status: string | null
          approval_status_confidence: number | null
          created_at: string
          document_checksum: string
          document_format: string | null
          enterprise_id: string | null
          extraction_method: string | null
          human_validated_at: string | null
          id: string
          overall_confidence: number | null
          policy_type: string | null
          raw_extraction_data: Json | null
          restrictions: string[] | null
          restrictions_confidence: number | null
          tool_name: string | null
          tool_name_confidence: number | null
          updated_at: string
          use_cases: string[] | null
          use_cases_confidence: number | null
          validated_by: string | null
          vendor_name: string | null
          vendor_name_confidence: number | null
          workspace_id: string | null
        }
        Insert: {
          approval_status?: string | null
          approval_status_confidence?: number | null
          created_at?: string
          document_checksum: string
          document_format?: string | null
          enterprise_id?: string | null
          extraction_method?: string | null
          human_validated_at?: string | null
          id?: string
          overall_confidence?: number | null
          policy_type?: string | null
          raw_extraction_data?: Json | null
          restrictions?: string[] | null
          restrictions_confidence?: number | null
          tool_name?: string | null
          tool_name_confidence?: number | null
          updated_at?: string
          use_cases?: string[] | null
          use_cases_confidence?: number | null
          validated_by?: string | null
          vendor_name?: string | null
          vendor_name_confidence?: number | null
          workspace_id?: string | null
        }
        Update: {
          approval_status?: string | null
          approval_status_confidence?: number | null
          created_at?: string
          document_checksum?: string
          document_format?: string | null
          enterprise_id?: string | null
          extraction_method?: string | null
          human_validated_at?: string | null
          id?: string
          overall_confidence?: number | null
          policy_type?: string | null
          raw_extraction_data?: Json | null
          restrictions?: string[] | null
          restrictions_confidence?: number | null
          tool_name?: string | null
          tool_name_confidence?: number | null
          updated_at?: string
          use_cases?: string[] | null
          use_cases_confidence?: number | null
          validated_by?: string | null
          vendor_name?: string | null
          vendor_name_confidence?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structured_policy_data_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "structured_policy_data_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "structured_policy_data_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_atom_states: {
        Row: {
          atom_id: string
          created_at: string | null
          enterprise_id: string
          id: string
          notes: string | null
          organization_id: string | null
          source_packs: string[]
          status: string
          submission_id: string
          subtenant_id: string | null
          updated_at: string | null
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          atom_id: string
          created_at?: string | null
          enterprise_id: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          source_packs?: string[]
          status: string
          submission_id: string
          subtenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          atom_id?: string
          created_at?: string | null
          enterprise_id?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          source_packs?: string[]
          status?: string
          submission_id?: string
          subtenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_atom_states_atom_id_fkey"
            columns: ["atom_id"]
            isOneToOne: false
            referencedRelation: "proof_atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_atom_states_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "submission_atom_states_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "submission_atom_states_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_atom_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_atom_states_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_atom_states_subtenant_id_fkey"
            columns: ["subtenant_id"]
            isOneToOne: false
            referencedRelation: "subtenants"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_items: {
        Row: {
          ai_tool_name: string
          created_at: string | null
          decision_id: string | null
          description: string | null
          id: string
          risk_score: number | null
          submission_id: string
          vendor: string | null
        }
        Insert: {
          ai_tool_name: string
          created_at?: string | null
          decision_id?: string | null
          description?: string | null
          id?: string
          risk_score?: number | null
          submission_id: string
          vendor?: string | null
        }
        Update: {
          ai_tool_name?: string
          created_at?: string | null
          decision_id?: string | null
          description?: string | null
          id?: string
          risk_score?: number | null
          submission_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_submission_items_decision_id"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_items_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          compliance_breakdown: Json | null
          compliance_score: number | null
          created_at: string | null
          decided_at: string | null
          decision_id: string | null
          description: string | null
          enterprise_id: string | null
          id: string
          last_scored_at: string | null
          organization_id: string | null
          platform_sync_status: Json | null
          policy_version_id: string
          response_deadline: string | null
          rfp_response_data: Json | null
          risk_score: number | null
          status: Database["public"]["Enums"]["submission_status"] | null
          submission_type: string | null
          submitted_at: string | null
          submitted_by: string | null
          subtenant_id: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          compliance_breakdown?: Json | null
          compliance_score?: number | null
          created_at?: string | null
          decided_at?: string | null
          decision_id?: string | null
          description?: string | null
          enterprise_id?: string | null
          id?: string
          last_scored_at?: string | null
          organization_id?: string | null
          platform_sync_status?: Json | null
          policy_version_id: string
          response_deadline?: string | null
          rfp_response_data?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submission_type?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          subtenant_id?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          compliance_breakdown?: Json | null
          compliance_score?: number | null
          created_at?: string | null
          decided_at?: string | null
          decision_id?: string | null
          description?: string | null
          enterprise_id?: string | null
          id?: string
          last_scored_at?: string | null
          organization_id?: string | null
          platform_sync_status?: Json | null
          policy_version_id?: string
          response_deadline?: string | null
          rfp_response_data?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submission_type?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          subtenant_id?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_submissions_decision_id"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "submissions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "submissions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_policy_version_id_fkey"
            columns: ["policy_version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_subtenant_id_fkey"
            columns: ["subtenant_id"]
            isOneToOne: false
            referencedRelation: "subtenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tier_limits: {
        Row: {
          created_at: string
          features: Json
          max_partners: number
          max_workspaces: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string
          features?: Json
          max_partners: number
          max_workspaces: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string
          features?: Json
          max_partners?: number
          max_workspaces?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      subtenants: {
        Row: {
          created_at: string | null
          enterprise_id: string
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enterprise_id: string
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enterprise_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subtenants_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "subtenants_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "subtenants_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_health: {
        Row: {
          connector_status: Json | null
          connector_uptime: number | null
          created_at: string
          enterprise_id: string | null
          error_count_24h: number | null
          error_rate: number | null
          id: string
          job_latency_ms: number | null
          last_heartbeat: string
          mfa_enabled_users: number | null
          mfa_rate: number | null
          mfa_total_users: number | null
          rls_failures: Json | null
          rls_last_check: string | null
          rls_ok: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          connector_status?: Json | null
          connector_uptime?: number | null
          created_at?: string
          enterprise_id?: string | null
          error_count_24h?: number | null
          error_rate?: number | null
          id?: string
          job_latency_ms?: number | null
          last_heartbeat?: string
          mfa_enabled_users?: number | null
          mfa_rate?: number | null
          mfa_total_users?: number | null
          rls_failures?: Json | null
          rls_last_check?: string | null
          rls_ok?: boolean | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          connector_status?: Json | null
          connector_uptime?: number | null
          created_at?: string
          enterprise_id?: string | null
          error_count_24h?: number | null
          error_rate?: number | null
          id?: string
          job_latency_ms?: number | null
          last_heartbeat?: string
          mfa_enabled_users?: number | null
          mfa_rate?: number | null
          mfa_total_users?: number | null
          rls_failures?: Json | null
          rls_last_check?: string | null
          rls_ok?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_health_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "tenant_health_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tenant_health_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_health_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_compliance_history: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          id: string
          metadata: Json | null
          new_status: string
          previous_status: string | null
          project_id: string
          tool_name: string
          vendor_name: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          new_status: string
          previous_status?: string | null
          project_id: string
          tool_name: string
          vendor_name?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string
          previous_status?: string | null
          project_id?: string
          tool_name?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      tool_policy_links: {
        Row: {
          clause_id: string
          created_at: string | null
          id: string
          policy_id: string
          tool_id: number
        }
        Insert: {
          clause_id: string
          created_at?: string | null
          id?: string
          policy_id: string
          tool_id: number
        }
        Update: {
          clause_id?: string
          created_at?: string | null
          id?: string
          policy_id?: string
          tool_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_tpl_tool"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "marketplace_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_policy_scores: {
        Row: {
          cached_at: string
          enterprise_id: string
          policy_version_hash: string
          score: number
          tool_id: string
        }
        Insert: {
          cached_at?: string
          enterprise_id: string
          policy_version_hash: string
          score: number
          tool_id: string
        }
        Update: {
          cached_at?: string
          enterprise_id?: string
          policy_version_hash?: string
          score?: number
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_policy_scores_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "tool_policy_scores_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tool_policy_scores_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_requests: {
        Row: {
          business_justification: string | null
          compliance_requirements: string | null
          created_at: string
          enterprise_id: string
          expected_usage: string | null
          id: string
          rejection_reason: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tool_id: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          business_justification?: string | null
          compliance_requirements?: string | null
          created_at?: string
          enterprise_id: string
          expected_usage?: string | null
          id?: string
          rejection_reason?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tool_id: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          business_justification?: string | null
          compliance_requirements?: string | null
          created_at?: string
          enterprise_id?: string
          expected_usage?: string | null
          id?: string
          rejection_reason?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tool_id?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      tool_reviews: {
        Row: {
          created_at: string
          enterprise_id: string
          id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          tool_id: number
          updated_at: string
          verified_purchase: boolean | null
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          tool_id: number
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          tool_id?: number
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
      trusted_issuers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          issuer_did: string
          issuer_metadata: Json | null
          issuer_name: string | null
          partner_id: string
          public_key_jwk: Json
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          issuer_did: string
          issuer_metadata?: Json | null
          issuer_name?: string | null
          partner_id: string
          public_key_jwk: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          issuer_did?: string
          issuer_metadata?: Json | null
          issuer_name?: string | null
          partner_id?: string
          public_key_jwk?: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_issuers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "trusted_issuers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "trusted_issuers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          metadata: Json | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          enterprise_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          scope_id: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          enterprise_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          scope_id?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          enterprise_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          scope_id?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "user_roles_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "user_roles_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_matrix_scope_first"
            referencedColumns: ["scope_id"]
          },
          {
            foreignKeyName: "user_roles_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          id: string
          operation: string
          user_id: string | null
          validation_context: Json | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          operation: string
          user_id?: string | null
          validation_context?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          operation?: string
          user_id?: string | null
          validation_context?: Json | null
        }
        Relationships: []
      }
      vendor_marketplace_settings: {
        Row: {
          analytics_enabled: boolean | null
          auto_approve_submissions: boolean | null
          created_at: string
          id: string
          notification_preferences: Json | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          analytics_enabled?: boolean | null
          auto_approve_submissions?: boolean | null
          created_at?: string
          id?: string
          notification_preferences?: Json | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          analytics_enabled?: boolean | null
          auto_approve_submissions?: boolean | null
          created_at?: string
          id?: string
          notification_preferences?: Json | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_marketplace_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          company_description: string | null
          company_name: string
          contact_email: string | null
          created_at: string
          id: string
          logo_url: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
          website_url: string | null
        }
        Insert: {
          company_description?: string | null
          company_name: string
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          website_url?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      vendor_promotions: {
        Row: {
          amount_paid: number
          analytics_data: Json | null
          created_at: string | null
          duration_days: number
          expires_at: string
          id: string
          promotion_tier: string
          started_at: string
          status: string | null
          stripe_payment_intent_id: string | null
          tool_id: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          amount_paid: number
          analytics_data?: Json | null
          created_at?: string | null
          duration_days: number
          expires_at: string
          id?: string
          promotion_tier: string
          started_at?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          tool_id?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          amount_paid?: number
          analytics_data?: Json | null
          created_at?: string | null
          duration_days?: number
          expires_at?: string
          id?: string
          promotion_tier?: string
          started_at?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          tool_id?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_promotions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "marketplace_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      white_paper_downloads: {
        Row: {
          ai_tools_count: string | null
          company_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          industry: string | null
          last_name: string
          newsletter_optin: boolean | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          white_paper_id: string
          white_paper_title: string
        }
        Insert: {
          ai_tools_count?: string | null
          company_name: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          industry?: string | null
          last_name: string
          newsletter_optin?: boolean | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          white_paper_id: string
          white_paper_title: string
        }
        Update: {
          ai_tools_count?: string | null
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          industry?: string | null
          last_name?: string
          newsletter_optin?: boolean | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          white_paper_id?: string
          white_paper_title?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          enterprise_id: string | null
          id: number
          started_at: string | null
          status: string | null
          summary: Json | null
          trigger_data: Json
          workflow_id: number | null
        }
        Insert: {
          completed_at?: string | null
          enterprise_id?: string | null
          id?: never
          started_at?: string | null
          status?: string | null
          summary?: Json | null
          trigger_data: Json
          workflow_id?: number | null
        }
        Update: {
          completed_at?: string | null
          enterprise_id?: string | null
          id?: never
          started_at?: string | null
          status?: string | null
          summary?: Json | null
          trigger_data?: Json
          workflow_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "workflow_executions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "workflow_executions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "agent_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          brand: string | null
          created_at: string | null
          created_by: string
          data_classification: string | null
          enterprise_id: string
          id: string
          market: string | null
          status: string
          submission_id: string | null
          therapeutic_area: string | null
          tool_metadata: Json | null
          tool_name: string | null
          updated_at: string | null
          vendor_name: string | null
          workspace_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          created_by: string
          data_classification?: string | null
          enterprise_id: string
          id?: string
          market?: string | null
          status?: string
          submission_id?: string | null
          therapeutic_area?: string | null
          tool_metadata?: Json | null
          tool_name?: string | null
          updated_at?: string | null
          vendor_name?: string | null
          workspace_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          created_by?: string
          data_classification?: string | null
          enterprise_id?: string
          id?: string
          market?: string | null
          status?: string
          submission_id?: string | null
          therapeutic_area?: string | null
          tool_metadata?: Json | null
          tool_name?: string | null
          updated_at?: string | null
          vendor_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "workflows_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "workflows_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["enterprise_role_enum"]
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["enterprise_role_enum"]
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["enterprise_role_enum"]
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          enterprise_id: string | null
          enterprise_name: string
          id: string
          name: string
          policy_scope: string | null
          workspace_type: string | null
        }
        Insert: {
          created_at?: string | null
          enterprise_id?: string | null
          enterprise_name: string
          id?: string
          name: string
          policy_scope?: string | null
          workspace_type?: string | null
        }
        Update: {
          created_at?: string | null
          enterprise_id?: string | null
          enterprise_name?: string
          id?: string
          name?: string
          policy_scope?: string | null
          workspace_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "workspaces_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "workspaces_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      access_matrix_scope_first: {
        Row: {
          compliance_frameworks: string[] | null
          enterprise_id: string | null
          region: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          scope_id: string | null
          scope_name: string | null
          scope_path: string | null
          scope_type: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scopes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "scopes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "scopes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_policy_conflicts: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          client_id: string | null
          client_name: string | null
          conflict_type: string | null
          distribution_id: string | null
          policy_id: string | null
          target_workspace_id: string | null
          version_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_distributions_target_workspace_id_fkey"
            columns: ["target_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_declaration_summary: {
        Row: {
          aggregated_risk_tier: string | null
          approved_count: number | null
          critical_risk_count: number | null
          declaration_count: number | null
          enterprise_id: string | null
          first_declaration_at: string | null
          high_risk_count: number | null
          last_declaration_at: string | null
          partner_id: string | null
          pending_count: number | null
          project_id: string | null
          rejected_count: number | null
          unique_files: number | null
          validation_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_declarations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "asset_declarations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "asset_declarations_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_declarations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "policy_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs_view: {
        Row: {
          action_type: string | null
          actor_id: string | null
          created_at: string | null
          enterprise_id: string | null
          metadata: Json | null
          record_id: string | null
          record_type: string | null
          workspace_id: string | null
        }
        Relationships: []
      }
      middleware_activity_summary: {
        Row: {
          avg_response_time_ms: number | null
          enterprise_id: string | null
          enterprise_name: string | null
          model: string | null
          partner_id: string | null
          partner_name: string | null
          policy_decision: string | null
          request_count: number | null
          time_bucket: string | null
          total_cost_usd: number | null
        }
        Relationships: [
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      middleware_violations: {
        Row: {
          created_at: string | null
          enterprise_id: string | null
          id: string | null
          model: string | null
          partner_id: string | null
          policy_decision: string | null
          violated_rule_ids: string | null
          violation_reasons: string | null
        }
        Insert: {
          created_at?: string | null
          enterprise_id?: string | null
          id?: string | null
          model?: string | null
          partner_id?: string | null
          policy_decision?: string | null
          violated_rule_ids?: never
          violation_reasons?: never
        }
        Update: {
          created_at?: string | null
          enterprise_id?: string | null
          id?: string | null
          model?: string | null
          partner_id?: string | null
          policy_decision?: string | null
          violated_rule_ids?: never
          violation_reasons?: never
        }
        Relationships: [
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "middleware_requests_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "middleware_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_health_summary: {
        Row: {
          cleanup_recommendations: number | null
          critical_issues: number | null
          enterprise_id: string | null
          last_analysis_at: string | null
          optimization_suggestions: number | null
          warnings: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_insights_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "policy_insights_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "policy_insights_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_inheritance_tree: {
        Row: {
          created_at: string | null
          hierarchy_level: number | null
          id: string | null
          inheritance_mode:
            | Database["public"]["Enums"]["policy_inheritance_mode"]
            | null
          is_inherited: boolean | null
          parent_policy_id: string | null
          parent_policy_title: string | null
          scope_id: string | null
          scope_name: string | null
          scope_path: unknown
          title: string | null
          unresolved_conflicts: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policy_inheritance_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_matrix_scope_first"
            referencedColumns: ["scope_id"]
          },
          {
            foreignKeyName: "policies_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_runs_masked: {
        Row: {
          control_coverage: number | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          grade: string | null
          id: string | null
          inputs_json: Json | null
          outputs_json: Json | null
          proof_hash: string | null
          risk_score: number | null
          run_status: string | null
          scenario_name: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          control_coverage?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          grade?: string | null
          id?: string | null
          inputs_json?: never
          outputs_json?: never
          proof_hash?: never
          risk_score?: number | null
          run_status?: string | null
          scenario_name?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          control_coverage?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          grade?: string | null
          id?: string | null
          inputs_json?: never
          outputs_json?: never
          proof_hash?: never
          risk_score?: number | null
          run_status?: string | null
          scenario_name?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_policy_scores_fresh: {
        Row: {
          cached_at: string | null
          enterprise_id: string | null
          policy_version_hash: string | null
          score: number | null
          tool_id: string | null
        }
        Insert: {
          cached_at?: string | null
          enterprise_id?: string | null
          policy_version_hash?: string | null
          score?: number | null
          tool_id?: string | null
        }
        Update: {
          cached_at?: string | null
          enterprise_id?: string | null
          policy_version_hash?: string | null
          score?: number | null
          tool_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_policy_scores_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "tool_policy_scores_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "agency_policy_conflicts"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tool_policy_scores_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_users: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["enterprise_role_enum"] | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["enterprise_role_enum"] | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["enterprise_role_enum"] | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_enterprise_to_agency_invitation: {
        Args: { p_token: string }
        Returns: Json
      }
      accept_workspace_invitation: {
        Args: { p_token: string }
        Returns: boolean
      }
      activate_prompt_v2: {
        Args: { p_prompt_id: string; p_user_id?: string }
        Returns: boolean
      }
      analyze_deprecation_impact: {
        Args: {
          p_days_lookback?: number
          p_enterprise_id: string
          p_model_name: string
        }
        Returns: Json
      }
      analyze_historical_traffic: {
        Args: { p_enterprise_id: string; p_hours?: number; p_policy_id: string }
        Returns: {
          avg_latency_ms: number
          block_rate: number
          risk_distribution: Json
          top_models: Json
          total_cost_usd: number
          total_requests: number
        }[]
      }
      assign_reviewers_by_expertise: {
        Args: {
          enterprise_id_param: string
          policy_content: string
          workflow_type?: string
        }
        Returns: Json
      }
      bump_draft_version: {
        Args: {
          p_expected_version: number
          p_new_data: Json
          p_submission_id: string
        }
        Returns: {
          conflict_detected: boolean
          message: string
          new_version: number
          success: boolean
        }[]
      }
      can_enterprise_add_partner: {
        Args: { enterprise_id_param: string }
        Returns: boolean
      }
      check_model_metadata_consistency: {
        Args: { p_model_id: string }
        Returns: {
          affected_policies: string[]
          conflict_type: string
          message: string
          severity: string
        }[]
      }
      check_workflow_bottlenecks: { Args: never; Returns: undefined }
      cleanup_expired_assessment_progress: { Args: never; Returns: number }
      create_workspace_invitation: {
        Args: {
          p_email: string
          p_expiry_days?: number
          p_role?: Database["public"]["Enums"]["enterprise_role_enum"]
          p_workspace_id: string
        }
        Returns: string
      }
      current_actor: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      detect_cost_optimization_opportunities: {
        Args: { p_enterprise_id: string; p_min_savings_usd?: number }
        Returns: {
          current_cost_usd: number
          estimated_savings_usd: number
          model_name: string
          request_count: number
          risk_increase: number
          suggested_model: string
        }[]
      }
      detect_policy_conflicts: {
        Args: { p_child_policy_id: string }
        Returns: undefined
      }
      eps_next_version: {
        Args: { p_policy_instance_id: string }
        Returns: number
      }
      example_function: {
        Args: { workspace_id_param: string }
        Returns: {
          enterprise_name: string
          name: string
        }[]
      }
      generate_assessment_token: { Args: never; Returns: string }
      generate_magic_token: { Args: never; Returns: string }
      get_active_prompt_v2: {
        Args: { p_agent_type: string }
        Returns: {
          id: string
          prompt_version: number
          system_prompt: string
          user_prompt_template: string
        }[]
      }
      get_audit_logs: {
        Args: {
          p_action_contains?: string
          p_actor_id?: string
          p_bypass_security?: boolean
          p_end_date?: string
          p_enterprise_id?: string
          p_record_types?: string[]
          p_start_date?: string
          p_workspace_id?: string
        }
        Returns: {
          action_type: string
          actor_id: string
          created_at: string
          enterprise_id: string
          metadata: Json
          record_id: string
          record_type: string
          workspace_id: string
        }[]
      }
      get_current_eps: {
        Args: { p_policy_instance_id: string }
        Returns: {
          activated_at: string
          content_hash: string
          effective_pom: Json
          id: string
          version: number
        }[]
      }
      get_effective_demo_mode_state: {
        Args: { p_user_id: string }
        Returns: {
          account_type: string
          effective_enabled: boolean
          preference_source: string
        }[]
      }
      get_effective_policy: {
        Args: { p_scope_id: string; p_user_id?: string }
        Returns: Json
      }
      get_enterprise_partner_count: {
        Args: { enterprise_id_param: string }
        Returns: number
      }
      get_issuer_public_key: { Args: { p_issuer_did: string }; Returns: Json }
      get_middleware_hourly_stats: {
        Args: { p_enterprise_id: string; p_hours?: number }
        Returns: {
          avg_latency: number
          block_rate: number
          blocked_requests: number
          hour: string
          total_cost: number
          total_requests: number
        }[]
      }
      get_policy_effectiveness: {
        Args: {
          p_enterprise_id: string
          p_hours?: number
          p_policy_id?: string
        }
        Returns: {
          avg_cost: number
          block_rate: number
          policy_id: string
          request_count: number
        }[]
      }
      get_policy_usage_stats: {
        Args: { p_days?: number; p_enterprise_id: string }
        Returns: {
          last_used_at: string
          policy_id: string
          policy_name: string
          request_count: number
          updated_at: string
        }[]
      }
      get_user_enterprise_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_enterprises: { Args: { user_uuid: string }; Returns: string[] }
      get_user_workspaces: { Args: { user_uuid: string }; Returns: string[] }
      get_workspace_members: {
        Args: { workspace_id_param: string }
        Returns: {
          role: Database["public"]["Enums"]["enterprise_role_enum"]
          user_id: string
        }[]
      }
      gpa_improvement_delta: { Args: { metrics: Json }; Returns: number }
      gpa_latest_version: { Args: { p_agent: string }; Returns: number }
      has_enterprise_role: {
        Args: {
          _enterprise_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_context: {
        Args: {
          _enterprise_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workspace_id?: string
        }
        Returns: boolean
      }
      has_role_in_scope: {
        Args: {
          _enterprise_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _scope_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_role:
        | {
            Args: {
              required_role: Database["public"]["Enums"]["app_role"]
              user_uuid: string
              workspace_uuid: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["enterprise_role_enum"]
              _user_id: string
              _workspace_id: string
            }
            Returns: boolean
          }
      invalidate_tool_scores_for_policy: {
        Args: { p_enterprise: string; p_policy_hash: string }
        Returns: undefined
      }
      is_admin_of_enterprise_or_workspace:
        | { Args: never; Returns: boolean }
        | {
            Args: { enterprise_id?: string; workspace_id?: string }
            Returns: boolean
          }
        | {
            Args: {
              enterprise_id_param?: string
              user_id_param: string
              workspace_id_param?: string
            }
            Returns: boolean
          }
      is_demo_user: { Args: { check_user_id: string }; Returns: boolean }
      is_enterprise_member:
        | { Args: { _enterprise_id: string }; Returns: boolean }
        | {
            Args: { _enterprise_id: string; _user_id: string }
            Returns: boolean
          }
      is_member: { Args: { _workspace_id: string }; Returns: boolean }
      is_role_authorized: {
        Args: { p_api_key_id: string; p_role_claims: Json; p_scopes: Json }
        Returns: {
          authorized: boolean
          invalid_claims: Json
          message: string
          missing_scopes: Json
        }[]
      }
      is_user_in_enterprise:
        | { Args: { enterprise_id: string; user_id: string }; Returns: boolean }
        | { Args: { enterprise_id: string }; Returns: boolean }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      jsonb_deep_merge: { Args: { child: Json; parent: Json }; Returns: Json }
      jwt_has_enterprise: { Args: { enterprise_id: string }; Returns: boolean }
      jwt_has_workspace: { Args: { workspace_id: string }; Returns: boolean }
      jwt_is_admin: { Args: never; Returns: boolean }
      list_eps_versions: {
        Args: { p_limit?: number; p_policy_instance_id: string }
        Returns: {
          activated_at: string
          content_hash: string
          created_at: string
          id: string
          version: number
        }[]
      }
      log_dashboard_performance: {
        Args: {
          dashboard_type: string
          load_time_ms: number
          metadata?: Json
          user_id?: string
        }
        Returns: undefined
      }
      log_operation: {
        Args: {
          p_duration_ms?: number
          p_metadata?: Json
          p_operation: string
          p_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_validation_error: {
        Args: {
          p_context?: Json
          p_error_message: string
          p_error_type: string
          p_operation: string
          p_user_id: string
        }
        Returns: undefined
      }
      merge_policy_rules: {
        Args: {
          child_rules: Json
          mode: Database["public"]["Enums"]["policy_inheritance_mode"]
          parent_rules: Json
        }
        Returns: Json
      }
      my_function: { Args: never; Returns: undefined }
      recalc_risk_score: { Args: { p_workflow: string }; Returns: undefined }
      rpc_get_rfp_badges: {
        Args: { p_workspace_id: string }
        Returns: {
          badge_text: string
          badge_variant: string
          distribution_id: string
          urgency_score: number
        }[]
      }
      rpc_get_rfp_distributions: {
        Args: { p_workspace_id: string }
        Returns: {
          created_at: string
          distribution_type: string
          id: string
          metadata: Json
          overall_score: number
          policy_name: string
          policy_version: number
          policy_version_id: string
          questions_count: number
          response_deadline: string
          response_status: string
          submission_id: string
          submitted_at: string
          target_workspace_id: string
        }[]
      }
      rpc_get_submission_progress: {
        Args: { p_submission_id: string }
        Returns: {
          answered_questions: number
          estimated_completion_time: number
          last_updated: string
          progress_percentage: number
          total_questions: number
        }[]
      }
      set_current_context: {
        Args: {
          p_enterprise_id: string
          p_partner_id: string
          p_workspace_id?: string
        }
        Returns: number
      }
      set_default_workspace: {
        Args: { p_workspace_id: string }
        Returns: undefined
      }
      text2ltree: { Args: { "": string }; Returns: unknown }
      update_promotion_analytics: {
        Args: { p_count?: number; p_event_type: string; p_tool_id: number }
        Returns: undefined
      }
      user_has_access_to_agent_activity: {
        Args: { activity_id: number }
        Returns: boolean
      }
      user_has_access_to_workspace_or_enterprise: {
        Args: { p_enterprise_id: string; p_workspace_id: string }
        Returns: boolean
      }
      user_has_enterprise_access: {
        Args: { p_enterprise_id: string }
        Returns: boolean
      }
      validate_boundary_pom: { Args: { pom_data: Json }; Returns: boolean }
      verify_rls_restrictive: {
        Args: never
        Returns: {
          details: string
          status: string
          test_name: string
        }[]
      }
    }
    Enums: {
      account_type: "enterprise" | "partner" | "vendor"
      app_role:
        | "owner"
        | "admin"
        | "member"
        | "viewer"
        | "compliance_officer"
        | "audit_viewer"
      decision_outcome: "approved" | "approved_with_conditions" | "rejected"
      distribution_status_enum: "assigned" | "active" | "revoked"
      enterprise_role_enum: "owner" | "admin" | "member" | "viewer" | "editor"
      evidence_scan_status: "pending" | "clean" | "infected" | "quarantined"
      policy_inheritance_mode: "replace" | "merge" | "append"
      policy_status: "draft" | "published" | "archived"
      policy_status_enum: "draft" | "review" | "published" | "archived"
      rfp_question_lane:
        | "governance_compliance"
        | "security_access"
        | "integration_scalability"
        | "business_ops"
      risk_band_t: "low" | "medium" | "high"
      stage_t: "pre_run" | "in_run" | "post_run"
      submission_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "changes_requested"
      subscription_tier: "foundation" | "enterprise" | "network_command"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["enterprise", "partner", "vendor"],
      app_role: [
        "owner",
        "admin",
        "member",
        "viewer",
        "compliance_officer",
        "audit_viewer",
      ],
      decision_outcome: ["approved", "approved_with_conditions", "rejected"],
      distribution_status_enum: ["assigned", "active", "revoked"],
      enterprise_role_enum: ["owner", "admin", "member", "viewer", "editor"],
      evidence_scan_status: ["pending", "clean", "infected", "quarantined"],
      policy_inheritance_mode: ["replace", "merge", "append"],
      policy_status: ["draft", "published", "archived"],
      policy_status_enum: ["draft", "review", "published", "archived"],
      rfp_question_lane: [
        "governance_compliance",
        "security_access",
        "integration_scalability",
        "business_ops",
      ],
      risk_band_t: ["low", "medium", "high"],
      stage_t: ["pre_run", "in_run", "post_run"],
      submission_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "changes_requested",
      ],
      subscription_tier: ["foundation", "enterprise", "network_command"],
    },
  },
} as const
