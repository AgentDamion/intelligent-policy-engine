/** @type {import('tailwindcss').Config} */
const base = require('../tailwind.config.js')

module.exports = {
  // Combine UI source with base content globs
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    ...((base && base.content) ? base.content : []),
  ],
  // Merge base theme with UI-specific extensions
  theme: {
    ...(base && base.theme ? base.theme : {}),
    extend: {
      ...(((base && base.theme && base.theme.extend) ? base.theme.extend : {})),
      // Preserve UI-specific animations
      animation: {
        ...(((base && base.theme && base.theme.extend && base.theme.extend.animation) ? base.theme.extend.animation : {})),
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        ...(((base && base.theme && base.theme.extend && base.theme.extend.keyframes) ? base.theme.extend.keyframes : {})),
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: base && base.plugins ? base.plugins : [],
}