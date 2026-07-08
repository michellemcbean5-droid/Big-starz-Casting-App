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
        background: "#0F0F1A",
        foreground: "#FFFFFF",
        card: "#1E1E2F",
        "card-foreground": "#FFFFFF",
        popover: "#1E1E2F",
        "popover-foreground": "#FFFFFF",
        primary: "#D4AF37",
        "primary-foreground": "#0F0F1A",
        secondary: "#1A1A2E",
        "secondary-foreground": "#FFFFFF",
        muted: "#1E1E2F",
        "muted-foreground": "#A0A0B0",
        accent: "#C0A062",
        "accent-foreground": "#0F0F1A",
        destructive: "#ef4444",
        border: "#2A2A3F",
        input: "#2A2A3F",
        ring: "#D4AF37",
        gold: "#D4AF37",
        "light-gold": "#C0A062",
        navy: "#1A1A2E",
        surface: "#1E1E2F",
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};
export default config;
