// Design tokens synced from Stitch
// Updated palette: Green/Lime/Red (No Purple!)

export const colors = {
    // Core
    background: "#0A0A0F",
    surface: "rgba(255, 255, 255, 0.03)",
    surfaceHover: "rgba(255, 255, 255, 0.07)",

    // Brand
    primary: "#07cc00", // Stitch Green
    primaryHover: "#06ad00",
    accentGold: "#F59E0B", // Gold

    // Semantic
    success: "#07cc00",
    danger: "#FF3F33",
    warning: "#F59E0B",
    info: "#06ad00",

    // Text
    text: "#FFFFFF",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",

    // Borders
    border: "rgba(255, 255, 255, 0.08)",
    borderHover: "rgba(7, 204, 0, 0.3)",

    // Effects
    glow: "rgba(7, 204, 0, 0.5)",
    glowGold: "rgba(245, 158, 11, 0.4)",
} as const;

export const typography = {
    fontFamily: {
        sans: "'Inter', system-ui, sans-serif",
        mono: "'JetBrains Mono', monospace",
    },
    fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
    },
    fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
    },
} as const;

export const spacing = {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
} as const;

export const borderRadius = {
    none: "0",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    card: "1rem", // 16px for cards
    button: "0.5rem", // 8px for buttons
    full: "9999px",
} as const;

export const shadows = {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    glow: "0 0 20px rgba(8, 203, 0, 0.3)", // Green glow
    glowGold: "0 0 20px rgba(245, 158, 11, 0.3)",
    glowLime: "0 0 20px rgba(180, 229, 13, 0.3)",
} as const;

// Glassmorphism utility
export const glass = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
} as const;

// Forbidden colors check
export const FORBIDDEN_COLORS = ["#8B5CF6", "#7C3AED", "purple", "violet"];
