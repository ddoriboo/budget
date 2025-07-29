/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 네이버 가계부 스타일 컬러 팔레트
        primary: {
          DEFAULT: '#03C75A',
          50: '#E8F5E8',
          100: '#D1EBD1',
          200: '#A3D7A3',
          300: '#75C375',
          400: '#47AF47',
          500: '#03C75A',
          600: '#039F48',
          700: '#027736',
          800: '#025024',
          900: '#012812',
        },
        gray: {
          50: '#F7F7F7',
          100: '#E8E8E8',
          200: '#D9D9D9',
          300: '#C0C0C0',
          400: '#999999',
          500: '#666666',
          600: '#4A4A4A',
          700: '#333333',
          800: '#1A1A1A',
          900: '#0D0D0D',
        },
        success: '#0066CC',
        danger: '#FF4444',
        warning: '#FF6600',
        info: '#03C75A',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Malgun Gothic', '맑은 고딕', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'typing': 'typing 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        typing: {
          '0%, 60%': { transform: 'translateY(0px)' },
          '30%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}