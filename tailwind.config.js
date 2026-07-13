/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080B11",
        card: "rgba(17, 24, 39, 0.7)",
        primary: {
          DEFAULT: "#FFB800", // Tactical Amber
          hover: "#E0A200",
        },
        success: {
          DEFAULT: "#10B981", // Tactical Green
          hover: "#059669",
        },
        danger: {
          DEFAULT: "#EF4444", // Tactical Red
          hover: "#DC2626",
        },
        tactical: {
          dark: "#0F131D",
          border: "rgba(255, 184, 0, 0.15)",
          borderGreen: "rgba(16, 185, 129, 0.15)",
          borderRed: "rgba(239, 68, 68, 0.15)",
          glow: "rgba(255, 184, 0, 0.05)",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "tactical-glow": "0 0 15px rgba(255, 184, 0, 0.1)",
        "tactical-glow-green": "0 0 15px rgba(16, 185, 129, 0.1)",
        "tactical-glow-red": "0 0 15px rgba(239, 68, 68, 0.15)",
      }
    },
  },
  plugins: [],
}
