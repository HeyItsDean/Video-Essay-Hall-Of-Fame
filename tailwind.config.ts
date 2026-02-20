import type { Config } from "tailwindcss";
import aspectRatio from "@tailwindcss/aspect-ratio";
import lineClamp from "@tailwindcss/line-clamp";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Inter", "Roboto", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,0.22)"
      }
    }
  },
  plugins: [aspectRatio, lineClamp]
} satisfies Config;
