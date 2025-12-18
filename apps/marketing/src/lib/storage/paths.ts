/**
 * Storage Path Utilities
 * Centralizes all storage path building to ensure consistency with RLS policies
 */

/**
 * Sanitize a filename for safe storage
 */
export const sanitizeFileName = (name: string): string => {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-') // replace non-word/.- with dashes
    .replace(/-+/g, '-')       // collapse multiple dashes
    .replace(/^-|-$/g, '')     // trim leading/trailing dashes
    .toLowerCase();
};

/**
 * Build a storage path for the evidence bucket
 * 
 * @param base - Base folder (e.g., 'policy-requests', 'general-evidence')
 * @param workspaceId - The workspace UUID (required for RLS)
 * @param originalName - Original filename
 * @returns Fully qualified storage path
 * 
 * @example
 * buildEvidencePath('policy-requests', 'abc-123', 'my document.pdf')
 * // Returns: 'policy-requests/abc-123/1234567890-my-document.pdf'
 */
export const buildEvidencePath = (
  base: string,
  workspaceId: string,
  originalName: string
): string => {
  if (!workspaceId || workspaceId.trim() === '') {
    throw new Error('workspaceId is required for evidence storage paths');
  }

  const timestamp = Date.now();
  const safeName = sanitizeFileName(originalName);
  
  return `${base}/${workspaceId}/${timestamp}-${safeName}`;
};

/**
 * Extract workspace ID from a storage path
 * Useful for debugging and validation
 */
export const extractWorkspaceFromPath = (path: string): string | null => {
  const segments = path.split('/');
  // Expected: base/workspace_id/filename
  return segments.length >= 2 ? segments[1] : null;
};

/**
 * Validate that a path matches expected RLS policy structure
 */
export const validateEvidencePath = (path: string): { valid: boolean; error?: string } => {
  const segments = path.split('/');
  
  if (segments.length < 3) {
    return {
      valid: false,
      error: `Path must have at least 3 segments (base/workspace_id/filename), got: ${path}`
    };
  }

  const [base, workspaceId, ...filenameParts] = segments;
  
  if (!base || base.trim() === '') {
    return { valid: false, error: 'Base folder cannot be empty' };
  }

  // Basic UUID validation (simplified)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(workspaceId)) {
    return {
      valid: false,
      error: `Workspace ID must be a valid UUID, got: ${workspaceId}`
    };
  }

  if (filenameParts.length === 0 || filenameParts.join('/').trim() === '') {
    return { valid: false, error: 'Filename cannot be empty' };
  }

  return { valid: true };
};
