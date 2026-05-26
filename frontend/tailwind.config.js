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
        accent: '#6366f1', // Indigo color for buttons/links
        theme1: 'var(--color1)',
        theme2: 'var(--color2)',
        theme3: 'var(--color3)',
        theme4: 'var(--color4)',
      },
    },
  },
  plugins: [],
}