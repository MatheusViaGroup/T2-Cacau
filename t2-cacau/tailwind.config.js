/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#a18072', // Cocoa-ish primary
          600: '#8a6a5c',
          700: '#735448',
          800: '#5e4238',
          900: '#4a332a',
        }
      }
    }
  },
  plugins: [],
}