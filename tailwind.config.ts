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
        // Design System Colors
        primary: "#0F172A", // Abyss Navy (Dark Mode BG)
        secondary: "#F1F5F9", // Cool Grey (Light Mode BG)
        accent: "#00DC82", // Neon Mint (Action)
        error: "#FF6B6B", // Alert Coral
        
        // Text Colors
        darkText: "#1E293B",
        lightText: "#F8FAFC",
        muted: "#94A3B8",
        
        // Semantic aliases
        success: "#00DC82",
        danger: "#FF6B6B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-jakarta)", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
        'glow': '0 0 15px rgba(0, 220, 130, 0.3)', // Neon glow for accent
      },
      borderRadius: {
        'xl': '16px', // Cartões
        'lg': '8px',  // Botões
      }
    },
  },
  plugins: [],
};
export default config;