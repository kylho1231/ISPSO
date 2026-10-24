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
        sac: {
          maroon: {
            50: '#fdf4f4',
            100: '#fbe7e7',
            200: '#f7d3d4',
            300: '#efb1b3',
            400: '#e18285',
            500: '#cc5256',
            600: '#ab3337',
            700: '#8c2428',
            800: '#6b1113', // Official St. Anthony's College Deep Maroon
            900: '#520b0d', // Official Institutional Masthead Maroon
            950: '#380607',
          },
          gold: {
            50: '#fefef8',
            100: '#fdfbef',
            200: '#faf4d5',
            300: '#f5e9ae',
            400: '#edd87a',
            500: '#d4af37', // Official St. Anthony's College Seal Gold
            600: '#b8860b', // Antique Gold Accent
            700: '#946607',
            800: '#754f0a',
            900: '#5b3d0a',
          },
        },
        academic: {
          paper: '#ffffff',
          cream: '#faf8f5',
          parchment: '#f4ede4',
          border: '#e2e8f0',
          text: '#0f172a',
          muted: '#475569',
        },
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
