/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fdfbf7',
          100: '#f7f2e8',
          200: '#eee3cf',
          300: '#e0cfae',
          400: '#ceb485',
          500: '#b89961',
          600: '#9e7c4a',
          700: '#7f603c',
          800: '#674d34',
          900: '#553f2c',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(22, 101, 52, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 10px 30px -4px rgba(22, 101, 52, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
