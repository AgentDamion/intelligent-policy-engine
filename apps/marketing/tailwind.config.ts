import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'heading': ['Sora', 'system-ui', 'sans-serif'],
				'sans': ['Inter', 'system-ui', 'sans-serif'],
				'brand': ['Montserrat', 'system-ui', 'sans-serif'],
				'body': ['Inter', 'system-ui', 'sans-serif'],
				'manifesto': ['Crimson Pro', 'Georgia', 'serif'],
				'solution': ['Inter Tight', 'Inter', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Agentic UI grayscale palette
				ink: {
					100: '0 0% 92%',  // Hairline borders
					200: '0 0% 79%',  // Default borders  
					300: '0 0% 65%',  // Borders hover
					500: '0 0% 40%',  // Meta text, timestamps
					700: '0 0% 17%',  // Hover state, secondary text
					800: '0 0% 10%',  // Pressed state
					900: '0 0% 7%',   // Primary text, buttons, agents
				},
				surface: {
					0: '0 0% 100%',   // Base background
					25: '0 0% 98%',   // Light hover
					50: '0 0% 95%',   // Message bubbles, hover states
					100: '0 0% 90%',  // Hairline borders
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'brand-teal': 'hsl(var(--brand-teal))',
				'brand-coral': 'hsl(var(--brand-coral))',
				'brand-green': 'hsl(var(--brand-green))',
				'brand-purple': 'hsl(var(--brand-purple))',
				'brand-orange': 'hsl(var(--brand-orange))',
				'brand-gray': 'hsl(var(--brand-gray))',
				'brand-dark': 'hsl(var(--brand-dark))',
				manifesto: {
					enterprise: 'hsl(214, 95%, 50%)',
					partner: 'hsl(142, 71%, 45%)',
					seam: 'hsl(0, 84%, 60%)',
					bridge: 'hsl(262, 83%, 58%)',
					problem: 'hsl(222, 47%, 11%)',
					solution: 'hsl(0, 0%, 98%)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				r1: '6px',
				r2: '10px',
				r3: '14px',
			},
			spacing: {
				s1: '4px',
				s2: '8px',
				s3: '12px',
				s4: '16px',
				s5: '24px',
				s6: '32px',
			},
			boxShadow: {
				'e0': 'none',
				'e1': '0 1px 0 rgba(0,0,0,.04)',
				'focus-ring': '0 0 0 2px #000',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'typing-dot': {
					'0%, 60%, 100%': { 
						opacity: '0.2', 
						transform: 'translateY(0)' 
					},
					'30%': { 
						opacity: '1', 
						transform: 'translateY(-2px)' 
					}
				},
				'seam-pulse': {
					'0%, 100%': { 
						opacity: '0.4', 
						boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)' 
					},
					'50%': { 
						opacity: '1', 
						boxShadow: '0 0 16px rgba(239, 68, 68, 0.6)' 
					}
				},
				'bridge-cross': {
					'0%': { transform: 'translateX(-50%)' },
					'100%': { transform: 'translateX(50%)' }
				},
				'panel-enter-left': {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'panel-enter-right': {
					'0%': { opacity: '0', transform: 'translateX(20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'seam-pulse': 'seam-pulse 3s ease-in-out infinite',
				'bridge-cross': 'bridge-cross 0.6s ease-out forwards',
				'panel-enter-left': 'panel-enter-left 0.6s ease-out',
				'panel-enter-right': 'panel-enter-right 0.6s ease-out',
				'typing-dot-1': 'typing-dot 1.5s ease-in-out infinite',
				'typing-dot-2': 'typing-dot 1.5s ease-in-out 0.15s infinite',
				'typing-dot-3': 'typing-dot 1.5s ease-in-out 0.3s infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
