import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        card: "var(--card-background)",
        foreground: "var(--foreground)",
        secondary: "var(--secondary)",
        success: "var(--success)",
        error: "var(--error)",
        primary: {
          DEFAULT: 'var(--primary)',
          dark: '#1f1f1f'
        }
      },
    },
  },
  plugins: [],
};
export default config;
