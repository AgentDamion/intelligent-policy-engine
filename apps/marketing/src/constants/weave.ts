/**
 * Weave Layout Constants (W0 Guardrails + W4 Documentation)
 * 
 * Standardized dimensions for the Weave agent-first split-panel interface.
 * Do not hardcode these values in components - always import from this file.
 * 
 * @see docs/weave-readme.md for complete documentation
 */

export const WEAVE_LAYOUT = {
  /** Header height in pixels (W4 confirmed) */
  HEADER_HEIGHT: 64,
  
  /** Left inbox rail width in pixels (W4 confirmed) */
  INBOX_WIDTH: 360,
  
  /** Maximum width for message content in pixels (W4 confirmed) */
  MESSAGE_MAX_WIDTH: 640,
  
  /** Base spacing unit in pixels (8px baseline grid per W4) */
  SPACING_UNIT: 8,
} as const;
