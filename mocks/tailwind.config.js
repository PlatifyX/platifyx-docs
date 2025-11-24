/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#748cab',
          dark: '#3e5c76',
        },
        secondary: '#3e5c76',
        background: '#1e1e1e',
        surface: {
          DEFAULT: '#1d2d44',
          light: '#1d2d44',
        },
        text: {
          DEFAULT: '#f0ebd8',
          secondary: '#f0ebd8',
        },
        border: '#748cab',
        link: '#748cab',
        button: {
          DEFAULT: '#748cab',
          alt: '#3e5c76',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      spacing: {
        'sidebar': '260px',
        'header': '64px',
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fadeIn': 'fadeIn 0.3s ease',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fadeIn': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
