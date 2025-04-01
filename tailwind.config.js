/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soft-white': '#F8FAFC',
        'cool-gray': '#6B7280',
        'muted-green': '#22C55E',
        'teal': '#0D9488',
        'dark-gray': '#374151',
      },
    },
  },
  plugins: [],
}