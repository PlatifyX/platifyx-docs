/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3e5c76',
        'primary-dark': '#2d4456',
        secondary: '#3e5c76',
      },
    },
  },
  plugins: [],
}
