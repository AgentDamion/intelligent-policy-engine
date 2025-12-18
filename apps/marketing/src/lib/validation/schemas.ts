import { z } from 'zod';

/**
 * Centralized validation schemas for the entire application
 * Provides consistent validation rules and error messages
 */

// ============================================
// Common Validation Rules
// ============================================

export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');
export const nonEmptyStringSchema = z.string().min(1, 'This field is required');
export const urlSchema = z.string().url('Invalid URL format');

// ============================================
// Platform Integration Schemas
// ============================================

export const platformConfigSchema = z.object({
  platform_type: z.enum(['veeva', 'box', 'sharepoint', 'custom']),
  config_name: z.string().min(1, 'Configuration name is required').max(100),
  credentials: z.object({
    api_key: z.string().optional(),
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    base_url: urlSchema.optional(),
  }),
  settings: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().default(true),
  workspace_id: uuidSchema,
  enterprise_id: uuidSchema,
  owner_user_id: uuidSchema.optional(),
});

export type PlatformConfigInput = z.infer<typeof platformConfigSchema>;

// ============================================
// Submission Schemas
// ============================================

export const submissionCreateSchema = z.object({
  workspace_id: uuidSchema,
  policy_version_id: uuidSchema,
  submission_type: z.enum(['vendor_submission', 'rfp_response', 'policy_review']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'rejected', 'changes_requested']).default('draft'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SubmissionCreateInput = z.infer<typeof submissionCreateSchema>;

export const submissionUpdateSchema = submissionCreateSchema.partial().extend({
  id: uuidSchema,
});

export type SubmissionUpdateInput = z.infer<typeof submissionUpdateSchema>;

// ============================================
// Policy Schemas
// ============================================

export const policyCreateSchema = z.object({
  title: z.string().min(1, 'Policy title is required').max(200),
  description: z.string().max(2000).optional(),
  enterprise_id: uuidSchema,
  policy_type: z.string().min(1, 'Policy type is required'),
  content: z.string().min(1, 'Policy content is required'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PolicyCreateInput = z.infer<typeof policyCreateSchema>;

// ============================================
// User Input Schemas
// ============================================

export const userProfileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50).optional(),
  last_name: z.string().min(1, 'Last name is required').max(50).optional(),
  account_type: z.enum(['enterprise', 'partner', 'vendor']).optional(),
}).strict();

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;

// ============================================
// Workspace Schemas
// ============================================

export const workspaceCreateSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
  enterprise_id: uuidSchema,
  workspace_type: z.enum(['enterprise', 'agency_client', 'brand']).default('enterprise'),
  description: z.string().max(500).optional(),
});

export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>;

// ============================================
// Validation Error Types
// ============================================

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Helper to convert Zod errors to our ValidationError format
 */
export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map(err => ({
    field: err.path.join('.'),
    code: err.code,
    message: err.message,
    context: { received: (err as any).received }
  }));
}

/**
 * Generic validation wrapper
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}
