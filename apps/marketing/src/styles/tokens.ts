/**
 * AI-native design tokens for Lovable 2.0
 * Consumer-grade visual language with enterprise credibility
 */

export const aiGradients = {
  // Primary AI signature gradient (teal → coral)
  primary: 'linear-gradient(135deg, hsl(174 100% 37%) 0%, hsl(14 100% 63%) 100%)',
  
  // Trust gradient (teal → green)
  trust: 'linear-gradient(135deg, hsl(174 100% 37%) 0%, hsl(122 39% 57%) 100%)',
  
  // Risk gradient (coral → red)
  risk: 'linear-gradient(135deg, hsl(14 100% 63%) 0%, hsl(4 90% 65%) 100%)',
  
  // Subtle background gradients
  subtleTeal: 'linear-gradient(180deg, hsl(174 100% 97%) 0%, hsl(174 100% 99%) 100%)',
  subtleCoral: 'linear-gradient(180deg, hsl(14 100% 97%) 0%, hsl(14 100% 99%) 100%)',
} as const;

export const animations = {
  // Natural, organic easing for AI interfaces
  governance: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Bouncy, playful for success states
  pulse: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  
  // Smooth entrance
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  
  // Quick exit
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

export const durations = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  verySlow: '500ms',
} as const;

export const shadows = {
  // Glow effects for AI elements
  aiGlow: '0 0 40px hsla(174, 100%, 37%, 0.15)',
  aiGlowHover: '0 0 60px hsla(174, 100%, 37%, 0.25)',
  
  // Elegant depth shadows
  elegant: '0 10px 30px -10px hsla(0, 0%, 0%, 0.1)',
  elegantHover: '0 15px 40px -10px hsla(0, 0%, 0%, 0.15)',
} as const;
