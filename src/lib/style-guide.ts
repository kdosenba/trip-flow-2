/**
 * Central TypeScript Style Guide Design Tokens.
 * Matches CSS properties declared in theme.css for unified configuration.
 */
export const STYLE_TOKENS = {
  colors: {
    bgDarker: "#07070a",
    bgDark: "#0d0e14",
    bgCard: "rgba(18, 19, 29, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderHover: "rgba(255, 255, 255, 0.15)",

    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",

    origin: "#8b5cf6",
    hub: "#a855f7",
    event: "#ec4899",
    transit: "#3b82f6",
    suggest: "#eab308",

    budgetSafe: "#10b981",
    budgetWarn: "#f97316",
    budgetDanger: "#ef4444",
  },
  glows: {
    origin: "rgba(139, 92, 246, 0.15)",
    hub: "rgba(168, 85, 247, 0.15)",
    event: "rgba(236, 72, 153, 0.15)",
    transit: "rgba(59, 130, 246, 0.15)",
    suggest: "rgba(234, 179, 8, 0.15)",
    budgetSafe: "rgba(16, 185, 129, 0.15)",
    budgetWarn: "rgba(249, 115, 22, 0.15)",
    budgetDanger: "rgba(239, 68, 68, 0.15)",
  },
  radii: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  transitions: {
    smooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export type StyleTokens = typeof STYLE_TOKENS;
export type StyleColor = keyof typeof STYLE_TOKENS.colors;
