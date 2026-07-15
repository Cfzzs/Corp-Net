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
        background: "#0A1333", // Azul escuro inspirado no teto da base
        card: "rgba(16, 29, 73, 0.8)", // Azul royal para os cards
        primary: {
          DEFAULT: "#FFD500", // Amarelo bem vivo igual às paredes da base
          hover: "#E6C000",
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
          dark: "#0C173D", // Fundo interno ainda mais escuro do azul da base
          border: "rgba(255, 213, 0, 0.3)",
          borderGreen: "rgba(16, 185, 129, 0.15)",
          borderRed: "rgba(239, 68, 68, 0.15)",
          glow: "rgba(255, 213, 0, 0.15)",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "tactical-glow": "0 0 15px rgba(255, 213, 0, 0.2)",
        "tactical-glow-green": "0 0 15px rgba(16, 185, 129, 0.1)",
        "tactical-glow-red": "0 0 15px rgba(239, 68, 68, 0.15)",
      }
    },
  },
  plugins: [],
}
