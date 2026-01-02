export const designTokens = {
  colors: {
    yellow: '#FFE500',
    black: '#000000',
    white: '#FFFFFF',
    success: '#16A34A',
    denied: '#DC2626',
    escalated: '#F59E0B',
    gray100: '#F5F5F5',
    gray200: '#E5E5E5',
    gray400: '#A3A3A3',
    gray600: '#525252',
    brandmarkGray: '#5A5A5A',
  },
  edge: {
    structural: '4px',
    divider: '1px',
  },
  timing: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  fonts: {
    display: "'Archivo Black', sans-serif",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'SF Mono', 'Menlo', monospace",
  },
} as const;

// Status badge configurations
export const statusConfig = {
  approved: { bg: '#16A34A', text: '#FFFFFF', label: 'APPROVED' },
  conditional: { bg: '#FFE500', text: '#000000', label: 'CONDITIONAL' },
  denied: { bg: '#DC2626', text: '#FFFFFF', label: 'DENIED' },
  escalated: { bg: '#F59E0B', text: '#FFFFFF', label: 'ESCALATED' },
  pending: { bg: '#A3A3A3', text: '#FFFFFF', label: 'PENDING' },
  unknown: { bg: '#5A5A5A', text: '#FFFFFF', label: 'UNKNOWN' },
  analyzing: { bg: '#000000', text: '#FFE500', label: 'ANALYZING' },
} as const;

