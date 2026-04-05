/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Terminal palette — matches CSS variables
        terminal: {
          base:    '#010409',
          panel:   '#0D1117',
          surface: '#161B22',
          raised:  '#1C2128',
          border:  '#2A313C',
          dim:     '#21262D',
        },
        term: {
          text:    '#E6EDF3',
          muted:   '#9DA7B3',
          micro:   '#6E7681',
          blue:    '#4C9AFF',
          green:   '#2FBF71',
          red:     '#F05D5E',
          yellow:  '#D29922',
          purple:  '#A78BFA',
        }
      },
      borderRadius: {
        'terminal': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
