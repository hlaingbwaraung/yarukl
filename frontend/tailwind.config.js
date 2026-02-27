/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          50: '#fef7f7',
          100: '#fdeef0',
          200: '#fbd5db',
          300: '#f7acb8',
          400: '#f2788f',
          500: '#e84d6d',
          600: '#d42a53',
          700: '#b21e43',
          800: '#951b3c',
          900: '#7f1a38',
        },
        matcha: {
          50: '#f4f9f4',
          100: '#e6f2e6',
          200: '#cee5cf',
          300: '#a6ceaa',
          400: '#78b17e',
          500: '#55955c',
          600: '#437a48',
          700: '#37613b',
          800: '#2f4f32',
          900: '#28412b',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Myanmar', 'Noto Sans JP', 'sans-serif'],
        japanese: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
