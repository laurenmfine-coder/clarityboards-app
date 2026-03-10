/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#1B4F8A',
        teal:  '#2E9E8F',
        amber: '#F5A623',
        dark:  '#1A2B3C',
        mid:   '#5A7A94',
        soft:  '#EBF3FB',
        ice:   '#D4E6F1',
      },
      fontFamily: {
        georgia: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
