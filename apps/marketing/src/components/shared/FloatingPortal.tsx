import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface FloatingPortalProps {
  children: ReactNode;
}

/**
 * Renders children into document.body using a portal
 * This ensures fixed-positioned elements are not clipped by overflow/transform contexts
 */
export const FloatingPortal = ({ children }: FloatingPortalProps) => {
  return createPortal(children, document.body);
};
