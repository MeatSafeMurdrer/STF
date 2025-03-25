/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9945FF',
          dark: '#7B38CC',
          light: '#B76FFF'
        },
        secondary: {
          DEFAULT: '#14F195',
          dark: '#10C278',
          light: '#3FFFA9'
        },
        accent: {
          DEFAULT: '#FF6B35',
          dark: '#E55A2A',
          light: '#FF8B5F'
        },
        background: {
          dark: '#121212',
          DEFAULT: '#1E1E2E',
          light: '#2D2D3F'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
};