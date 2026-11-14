/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: { 50: '#FDF8F3', 100: '#FAF3EB', 200: '#F5E6D8' },
        warm: { white: '#FFFCF9' },
        brown: { soft: '#8B7355', DEFAULT: '#6B5344', dark: '#4A3728' },
        terracotta: { DEFAULT: '#C67B5C', light: '#E8A88A', dark: '#A65D42' },
        orange: { pastel: '#F4A574', soft: '#FFD4B8' },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(107, 83, 68, 0.08)',
        card: '0 8px 30px rgba(107, 83, 68, 0.12)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
