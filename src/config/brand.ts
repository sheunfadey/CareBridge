export const brand = {
  name: "CareBridge",
  legalName: "CareBridge",
  tagline: "Learn to Care. Grow Your Career. Make a Difference.",
  shortDescription:
    "Caregiver training, verified practical experience, employment pathways and care-home operations in one platform.",
  locale: "en-NG",
  timeZone: "Africa/Lagos",
  currency: "NGN",
  supportEmail: "support@carebridge.ng",
  colors: {
    navy: "#12304A",
    teal: "#0F8B8D",
    green: "#2E9D68",
    coral: "#F28C75",
    sky: "#EAF4F7",
    ivory: "#FAFAF7",
    white: "#FFFFFF",
    ink: "#192B3A",
    slate: "#64748B",
    border: "#E2E8F0",
    warning: "#D97706",
    error: "#DC4545",
    success: "#218653",
    dark: "#101D2A",
    darkSurface: "#172839",
  },
} as const;

export type Brand = typeof brand;
