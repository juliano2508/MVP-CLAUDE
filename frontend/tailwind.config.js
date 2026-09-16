/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f0ff',
          100: '#e6e2ff',
          200: '#c9c0ff',
          300: '#aa9bff',
          400: '#8a72ff',
          500: '#6d4dff',
          600: '#5934e6',
          700: '#4527b3',
          800: '#331d80',
          900: '#211257',
        },
      },
    },
  },
  plugins: [],
}

