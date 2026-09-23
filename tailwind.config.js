/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38abf8',
          500: '#0e8df2',
          600: '#026ed3',
          700: '#0357aa',
          800: '#074a8c',
          900: '#0c3e74',
          950: '#07274c',
        },
        darkBg: {
          50: '#212d45',
          100: '#151e30',
          150: '#101726',
          200: '#0b111c',
          300: '#070b13'
        },
        app: {
          bg: '#0b111c',
          surface: '#151e30',
          muted: '#1c2840'
        },
        slate: {
          850: '#121b2b',
          925: '#0a0f19',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 24px -4px rgba(14, 141, 242, 0.35)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.35)',
        'glass-card': '0 12px 36px 0 rgba(0, 0, 0, 0.45)',
        'subtle-glow': '0 0 15px rgba(56, 171, 248, 0.15)'
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
