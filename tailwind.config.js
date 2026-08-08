/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Theme palette gets wired up as CSS variables (see src/index.css) once
      // the theming task is mocked up and approved — left empty for now.
    },
  },
  plugins: [],
};
