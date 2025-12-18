/**
 * Feature Flags for EPS Rollout
 */

export const FeatureFlags = {
  USE_EPS_VALIDATION: import.meta.env.VITE_USE_EPS_VALIDATION === 'true',
  EPS_DUAL_WRITE: import.meta.env.VITE_EPS_DUAL_WRITE === 'true',
  EPS_FALLBACK_ENABLED: import.meta.env.VITE_EPS_FALLBACK_ENABLED === 'true',
} as const;
