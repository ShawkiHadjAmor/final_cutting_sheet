/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  purge: [
    "./src/app/dashboard/sidebar/**/*.{html,ts,css,scss}",
    "./src/app/dashboard/dashboard/**/*.{html,ts,css,scss}",
    "./src/app/dashboard/header/**/*.{html,ts,css,scss}",
    "./src/**/*.{html,ts,css,scss}"
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        beautiful: ["'Poppins'", "sans-serif"],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
