/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        custom: {
          'bharat-dark': '#333333',
          'bharat-gold': '#B8860B',
          'bharat-red': '#A52A2A',
          'bharat-white': '#FFFFFF',
          'bharat-light-gray': '#F5F5F5',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
} 