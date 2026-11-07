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
    navy: "#102B5C",
    deepNavy: "#071A3A",
    blue: "#087FE5",
    brightBlue: "#08B7F0",
    green: "#20C840",
    deepGreen: "#078B38",
    lightGreen: "#EAF8EE",
    white: "#FFFFFF",
    // Legacy aliases retained for existing class names.
    teal: "#087FE5",
    coral: "#08B7F0",
    sky: "#EAF8EE",
    ivory: "#F7FAFC",
    ink: "#172B4D",
    slate: "#64748B",
    border: "#E2E8F0",
    warning: "#D97706",
    error: "#DC4545",
    success: "#078B38",
    dark: "#071A3A",
    darkSurface: "#102B5C",
  },
} as const;

export type Brand = typeof brand;
