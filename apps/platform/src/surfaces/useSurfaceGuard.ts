import { useLocation } from 'react-router-dom';
import { SURFACE_REGISTRY, SurfaceNoun } from './registry';

/**
 * Hook to enforce Surface-First compliance boundaries in the UI.
 * Used to conditionally disable or hide UI elements (like "Sign" buttons)
 * if they are rendered on a surface that doesn't own them.
 */
export const useSurfaceGuard = () => {
  const location = useLocation();

  // Helper to determine the current surface based on the URL path
  const getCurrentSurface = (): SurfaceNoun | null => {
    const path = location.pathname;
    const match = Object.values(SURFACE_REGISTRY).find(s => path.startsWith(s.basePath));
    return match ? match.id : null;
  };

  const currentSurfaceId = getCurrentSurface();
  const currentSurface = currentSurfaceId ? SURFACE_REGISTRY[currentSurfaceId] : null;

  /**
   * Checks if an action is permitted on the current surface.
   * @param action The action identifier (e.g., 'sign_signature')
   */
  const canPerformAction = (action: string): { 
    allowed: boolean; 
    reason?: string;
    requiresStepUp: boolean;
  } => {
    if (!currentSurface) {
      return { allowed: false, reason: 'Unknown surface context', requiresStepUp: false };
    }

    // Is it explicitly forbidden?
    if (currentSurface.forbiddenActions.includes(action)) {
      return { 
        allowed: false, 
        reason: `Action '${action}' is forbidden on the ${currentSurface.label} surface.`,
        requiresStepUp: false 
      };
    }

    // Is it owned by this surface? (Golden standard for regulated actions)
    const isOwned = currentSurface.ownedActions.includes(action);
    const isAllowed = currentSurface.allowedActions.includes(action) || isOwned;

    if (!isAllowed) {
      return { 
        allowed: false, 
        reason: `Action '${action}' must be performed on its designated surface.`,
        requiresStepUp: false 
      };
    }

    const requiresStepUp = currentSurface.stepUpAuthActions.includes(action);

    return { allowed: true, requiresStepUp };
  };

  return {
    currentSurfaceId,
    currentSurface,
    canPerformAction,
  };
};

