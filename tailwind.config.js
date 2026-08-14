/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        sidenav: "var(--color-sidenav)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        border: "var(--color-border)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        "accent-contrast": "var(--color-accent-contrast)",
      },
      borderRadius: {
        theme: "var(--radius-theme)",
        "theme-sm": "var(--radius-theme-sm)",
      },
      boxShadow: {
        theme: "var(--shadow-theme)",
      },
      fontFamily: {
        theme: "var(--font-header)",
      },
    },
  },
  plugins: [],
};
