/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      width: {
        '68': '17rem', // Custom width class
      }
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: '#6d28d9', // purple-700
          borderRadius: '8px',
          transition: 'background 0.2s',
        },
        '::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#a78bfa', // purple-300
        },
        '::-webkit-scrollbar-track': {
          backgroundColor: '#18181b', // zinc-900
        },
        'html': {
          scrollbarColor: '#6d28d9 #18181b',
          scrollbarWidth: 'thin',
        },
      });
    })
  ],
};
