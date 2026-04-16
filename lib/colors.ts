export const colors = {
  surface: {
    primary: "#F7F3EE",
    secondary: "#EFE7DD",
    card: "#FFFFFF",
    footer: "#2A1F14",
  },
  text: {
    primary: "#2B2B2B",
    secondary: "#6F6F6F",
    muted: "#8A8580",
    onFooter: "#F3E9DC",
  },
  accent: {
    main: "#A47148",
    hover: "#8C5C36",
    highlight: "#D6A77A",
  },
  background: {
    primary: "#F7F3EE",
    secondary: "#EFE7DD",
    card: "#FFFFFF",
    cardText: "#2B2B2B",
  },
  button: {
    primary: "#A47148",
    primaryHover: "#8C5C36",
    secondary: "transparent",
    secondaryHover: "#EFE7DD",
  },
  border: {
    primary: "#E2D8CC",
    surface: "#E2D8CC",
    subtle: "rgba(43, 43, 43, 0.08)",
  },
} as const;

export const getColor = (path: string) => {
  const keys = path.split(".");
  let value: unknown = colors;
  for (const key of keys) {
    value = (value as Record<string, unknown>)?.[key];
    if (value === undefined) return "#000000";
  }
  return value as string;
};

export const cssVariables = {
  "--color-bg-primary": colors.surface.primary,
  "--color-bg-secondary": colors.surface.secondary,
  "--color-bg-card": colors.surface.card,
  "--color-text-primary": colors.text.primary,
  "--color-text-secondary": colors.text.secondary,
  "--color-accent-main": colors.accent.main,
  "--color-accent-hover": colors.accent.hover,
  "--color-highlight": colors.accent.highlight,
  "--color-surface-border": colors.border.surface,
  "--color-button-primary": colors.button.primary,
  "--color-button-secondary": colors.button.secondary,
};
