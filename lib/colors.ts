// Centralized color configuration
// Change these values to update the entire site's color scheme
export const colors = {
  // Primary colors
  primary: {
    50: "#D4EBF8", // Light blue - backgrounds, highlights
    500: "#1F509A", // Medium blue - primary buttons, links
    700: "#0A3981", // Dark blue - headers, main text
    accent: "#FF9B2F", // Orange - accents, special elements
  },

  // Semantic color mappings
  background: {
    primary: "#D4EBF8",
    header: "#0A3981",
    footer: "#0A3981",
    card: "#D4EBF8",
    highlight: "#D4EBF8",
  },

  text: {
    primary: "#0A3981",
    secondary: "#1F509A",
    light: "#ffffff",
    muted: "#6b7280",
  },

  button: {
    primary: "#1F509A",
    primaryHover: "#0A3981",
    secondary: "#FF9B2F",
    secondaryHover: "#1F509A",
  },

  border: {
    primary: "#1F509A",
    secondary: "#FF9B2F",
    light: "#D4EBF8",
  },

  accent: {
    primary: "#FF9B2F",
    secondary: "#D4EBF8",
  },
} as const

// Helper function to get color values
export const getColor = (path: string) => {
  const keys = path.split(".")
  let value: any = colors

  for (const key of keys) {
    value = value[key]
    if (!value) return "#000000" // fallback
  }

  return value
}

// CSS custom properties for dynamic theming
export const cssVariables = {
  "--color-primary-50": colors.primary[50],
  "--color-primary-500": colors.primary[500],
  "--color-primary-700": colors.primary[700],
  "--color-accent": colors.primary.accent,
  "--color-bg-primary": colors.background.primary,
  "--color-bg-header": colors.background.header,
  "--color-text-primary": colors.text.primary,
  "--color-text-secondary": colors.text.secondary,
  "--color-button-primary": colors.button.primary,
  "--color-button-secondary": colors.button.secondary,
  "--color-border-primary": colors.border.primary,
  "--color-accent-primary": colors.accent.primary,
}
