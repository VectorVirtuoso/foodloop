/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Our Premium Palette
        brand: {
          50: '#f0fdf4',   // Emerald light wash
          100: '#dcfce7',  // Emerald light accent
          200: '#bbf7d0',
          300: '#86efac',
          500: '#10b981',  // Smooth, premium emerald green (core logo)
          600: '#059669',  // Medium green
          700: '#047857',  // Rich leaf green
          800: '#064e3b',  // Deep forest green
          900: '#022c22',  // Dark jade/headers
        },
        surface: '#fafaf6', // Warm alabaster cream background
        card: '#ffffff',
        navy: {
          900: '#0b1329',  // Deep navy for analytics or contrast accents
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'], // For impactful headers
      },
      boxShadow: {
        'soft': '0 10px 40px -6px rgba(6, 78, 59, 0.04)', // Smooth organic jade shadow
        'glow': '0 0 20px rgba(16, 185, 129, 0.15)', // Neon emerald glow
        'glow-lg': '0 0 30px rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'pulse-radar': 'pulse-radar 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float-slow': 'float-slow 15s ease-in-out infinite',
        'float-reverse': 'float-reverse 18s ease-in-out infinite',
      },
      keyframes: {
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-radar': {
          '0%': { transform: 'scale(0.85)', opacity: '0.9' },
          '50%': { transform: 'scale(1.2)', opacity: '0.3' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(-40px, 40px) scale(0.95)' },
          '66%': { transform: 'translate(30px, -30px) scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}