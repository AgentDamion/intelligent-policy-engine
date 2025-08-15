/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./ui/src/**/*.{js,jsx,ts,tsx}",
    "./ui/public/index.html",
    "./ui/src/components/**/*.{js,jsx}",
    "./ui/src/stores/**/*.js",
    "./ui/src/services/**/*.js",
    "./ui/src/contexts/**/*.js",
  ],
  theme: {
    extend: {
      // AICOMPLYR Brand Colors
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#EDF5FA',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#4B4BFF', // Main Indigo
          600: '#3730A3',
          700: '#1E3A8A',
          800: '#1E40AF',
          900: '#0C4A6E',
        },
        
        // Success Colors (Teal)
        success: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#25B7A5', // Main Teal
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        
        // Warning Colors (Orange)
        warning: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F18C25', // Main Orange
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        
        // Sky Colors (Light Blue)
        sky: {
          50: '#EDF5FA',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        
        // Slate Colors (Dark Text)
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#1F2937', // Main Dark Text
        },
        
        // Custom Semantic Colors
        brand: {
          indigo: '#4B4BFF',
          teal: '#25B7A5',
          orange: '#F18C25',
          sky: '#EDF5FA',
          slate: '#1F2937',
        },
      },
      
      // Typography
      fontFamily: {
        'inter': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      
      // Font Sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.4' }], // 12px
        'sm': ['0.875rem', { lineHeight: '1.5' }], // 14px
        'base': ['1rem', { lineHeight: '1.5' }], // 16px
        'lg': ['1.125rem', { lineHeight: '1.4' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.4' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '1.2' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '1.2' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }], // 36px
      },
      
      // Font Weights
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      
      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Border Radius
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      // Shadows
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        
        // Brand-specific shadows
        'brand': '0 4px 12px rgba(75, 75, 255, 0.3)',
        'success': '0 4px 12px rgba(37, 183, 165, 0.3)',
        'warning': '0 4px 12px rgba(241, 140, 37, 0.3)',
      },
      
      // Transitions
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
      },
      
      transitionTimingFunction: {
        'geometric': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Animations
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'typing': 'typing 1.4s ease-in-out infinite',
        'connection-pulse': 'connectionPulse 2s ease-in-out infinite',
        'message-slide': 'messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        typing: {
          '0%, 80%, 100%': {
            transform: 'scale(0.8)',
            opacity: '0.5',
          },
          '40%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        connectionPulse: {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'scale(1.1)',
          },
        },
        messageSlideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px) scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
      },
      
      // Background Images
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #4B4BFF 0%, #25B7A5 100%)',
        'gradient-primary': 'linear-gradient(135deg, #4B4BFF 0%, #6366f1 100%)',
        'gradient-success': 'linear-gradient(135deg, #25B7A5 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F18C25 0%, #EA580C 100%)',
        'gradient-sky': 'linear-gradient(135deg, #EDF5FA 0%, #E0F2FE 100%)',
      },
      
      // Custom Utilities
      backdropBlur: {
        xs: '2px',
      },
      
      // Z-Index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Custom plugin for brand utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-brand-indigo': {
          color: theme('colors.brand.indigo'),
        },
        '.text-brand-teal': {
          color: theme('colors.brand.teal'),
        },
        '.text-brand-orange': {
          color: theme('colors.brand.orange'),
        },
        '.bg-brand-indigo': {
          backgroundColor: theme('colors.brand.indigo'),
        },
        '.bg-brand-teal': {
          backgroundColor: theme('colors.brand.teal'),
        },
        '.bg-brand-orange': {
          backgroundColor: theme('colors.brand.orange'),
        },
        '.border-brand-indigo': {
          borderColor: theme('colors.brand.indigo'),
        },
        '.border-brand-teal': {
          borderColor: theme('colors.brand.teal'),
        },
        '.border-brand-orange': {
          borderColor: theme('colors.brand.orange'),
        },
        '.shadow-brand': {
          boxShadow: theme('boxShadow.brand'),
        },
        '.shadow-success': {
          boxShadow: theme('boxShadow.success'),
        },
        '.shadow-warning': {
          boxShadow: theme('boxShadow.warning'),
        },
        '.transition-geometric': {
          transitionTimingFunction: theme('transitionTimingFunction.geometric'),
        },
      }
      addUtilities(newUtilities)
    },
    
    // Custom plugin for component-specific utilities
    function({ addComponents, theme }) {
      const components = {
        '.btn-primary': {
          backgroundColor: theme('colors.brand.indigo'),
          color: theme('colors.white'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.semibold'),
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.geometric')}`,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.brand'),
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.white'),
          color: theme('colors.slate.700'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          border: `1px solid ${theme('colors.slate.300')}`,
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.geometric')}`,
          '&:hover': {
            backgroundColor: theme('colors.slate.50'),
            transform: 'translateY(-1px)'
          },
          '&:disabled': {
            opacity: '0.6',
            cursor: 'not-allowed',
            transform: 'none'
          }
        },
        '.btn-success': {
          backgroundColor: theme('colors.brand.teal'),
          color: theme('colors.white'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.semibold'),
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.geometric')}`,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.success'),
          },
        },
        '.card-modern': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.md'),
          border: `1px solid ${theme('colors.slate.200')}`,
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.geometric')}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.lg'),
          },
        },
        '.input-modern': {
          backgroundColor: theme('colors.white'),
          border: `1px solid ${theme('colors.slate.300')}`,
          borderRadius: theme('borderRadius.lg'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm'),
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.geometric')}`,
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.brand.indigo'),
            boxShadow: `0 0 0 3px ${theme('colors.brand.indigo')}20`,
          },
        },
      }
      addComponents(components)
    },
  ],
} 