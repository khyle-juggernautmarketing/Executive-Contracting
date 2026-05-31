import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        executive: {
          dark: '#1A2332',
          deeper: '#121820',
          accent: '#C4A962',
          'accent-dark': '#A88B45',
          muted: '#6B7280',
          surface: '#F7F6F3',
          border: '#D4D0C8',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px -4px rgba(26, 35, 50, 0.1)',
        'card-lg': '0 20px 50px -12px rgba(26, 35, 50, 0.18)',
        elevated: '0 25px 60px -15px rgba(26, 35, 50, 0.22)',
        glow: '0 0 0 1px rgba(212, 208, 200, 0.6), 0 8px 32px rgba(26, 35, 50, 0.1)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(212,208,200,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(212,208,200,0.35) 1px, transparent 1px)',
        'hero-gradient': 'linear-gradient(135deg, #1A2332 0%, #121820 55%, #1A2332 100%)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
    },
  },
  plugins: [],
}
export default config
