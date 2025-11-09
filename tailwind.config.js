/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			border: 'hsl(217.2 32.6% 17.5%)',
  			input: 'hsl(217.2 32.6% 17.5%)',
  			ring: 'hsl(212.7 26.8% 83.9%)',
  			background: 'hsl(222.2 84% 4.9%)',
  			foreground: 'hsl(210 40% 98%)',
  			primary: {
  				DEFAULT: 'hsl(217.2 91.2% 59.8%)',
  				foreground: 'hsl(222.2 47.4% 11.2%)'
  			},
  			secondary: {
  				DEFAULT: 'hsl(217.2 32.6% 17.5%)',
  				foreground: 'hsl(210 40% 98%)'
  			},
  			destructive: {
  				DEFAULT: 'hsl(0 62.8% 30.6%)',
  				foreground: 'hsl(210 40% 98%)'
  			},
  			muted: {
  				DEFAULT: 'hsl(217.2 32.6% 17.5%)',
  				foreground: 'hsl(215 20.2% 65.1%)'
  			},
  			accent: {
  				DEFAULT: 'hsl(217.2 32.6% 17.5%)',
  				foreground: 'hsl(210 40% 98%)'
  			},
  			popover: {
  				DEFAULT: 'hsl(222.2 84% 4.9%)',
  				foreground: 'hsl(210 40% 98%)'
  			},
  			card: {
  				DEFAULT: 'hsl(222.2 84% 4.9%)',
  				foreground: 'hsl(210 40% 98%)'
  			},
  			'dark-bg': '#1a1a1a',
  			'dark-sidebar': '#252525',
  			'dark-content': '#2a2a2a',
  			'dark-border': '#333333',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: '0.5rem',
  			md: 'calc(0.5rem - 2px)',
  			sm: 'calc(0.5rem - 4px)'
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
}

