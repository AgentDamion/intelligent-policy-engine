export type SubmissionType = 'standard' | 'rfp_response' | 'policy_review';

export type SubmissionStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'changes_requested';

export interface Submission {
  id: string;
  workspace_id: string;
  policy_version_id?: string;
  submission_type: SubmissionType;
  status: SubmissionStatus;
  title: string;
  description?: string;
  content?: any;
  rfp_response_data?: any;
  compliance_score?: number;
  compliance_breakdown?: any;
  response_deadline?: string;
  submitted_by?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}
