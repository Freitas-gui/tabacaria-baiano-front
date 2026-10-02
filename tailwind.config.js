/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Centered, 16px gutter, capped at 1280px — what the old hand-written
    // `.container` fallback in globals.css enforced.
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },
    extend: {
      // Storefront type scale, larger than Tailwind's defaults. It is what the
      // old hand-written overrides in globals.css gave un-prefixed classes, and
      // the mobile layout was tuned against it.
      fontSize: {
        sm: ["1rem", "1.25rem"],
        lg: ["1.25rem", "1.75rem"],
        xl: ["1.5rem", "1.75rem"],
        "2xl": ["1.6rem", "2rem"],
        // UI labels and buttons. The old `.font-medium` override silently forced
        // this size on every medium-weight element; it is now explicit.
        label: ["0.9rem", "1.25rem"],
      },
      colors: {
        // The storefront remaps these grays to the warm theme tokens.
        gray: {
          50: "color-mix(in srgb, var(--bg-secondary) 88%, #ffffff 12%)",
          200: "var(--surface-border)",
          500: "var(--text-secondary)",
          600: "var(--text-secondary)",
          700: "var(--text-primary)",
        },
        theme: {
          primary: "#F7F3EE",
          primaryBrown: "#EFE7DD",
          accent: "#A47148",
          accentCaramel: "#8C5C36",
          secondary: "#EFE7DD",
          header: "#F7F3EE",
          smokeHighlight: "#D6A77A",
          smokeSoft: "#6F6F6F",
          smoke: "#A47148",
          charcoal: "#2B2B2B",
          highlight: "#D6A77A",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
