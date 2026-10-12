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
        cricket: {
          dark: '#080c14',
          card: '#0f172a',
          cardBorder: '#1e293b',
          lightBg: '#f8fafc',
          lightCard: '#ffffff',
          orange: '#f97316',
          orangeHover: '#ea580c',
          orangeGlow: 'rgba(249, 115, 22, 0.25)',
          teal: '#06b6d4',
          accent: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
