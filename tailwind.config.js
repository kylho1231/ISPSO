/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        anthonian: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9ec',
          300: '#94bfe0',
          400: '#5e9ed0',
          500: '#3880be',
          600: '#2766a3',
          700: '#205184',
          800: '#1b365d', // Primary SAC Blue
          900: '#152945',
          950: '#0c1a2d',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Primary SAC Gold
          600: '#d97706',
          700: '#b45309',
        }
      },
    },
  },
  plugins: [],
};
