export const logoGeometry = {
  viewBox: "0 0 40 40",
  archPath: "M10.5 25C10.5 10 29.5 10 29.5 25",
  archStrokeWidth: 4,
  heads: [
    { cx: 10.5, cy: 12.5, r: 3.75 },
    { cx: 29.5, cy: 12.5, r: 3.75 },
  ],
  bodies: [
    { x: 6, y: 17.5, width: 9, height: 18, rx: 4.5 },
    { x: 25, y: 17.5, width: 9, height: 18, rx: 4.5 },
  ],
} as const;

export const logoTones = {
  default: { figure: "#102B5C", arch: "#087FE5", wordmark: "#102B5C" },
  onDark: { figure: "#FFFFFF", arch: "#08B7F0", wordmark: "#FFFFFF" },
} as const;

export type LogoSize = "sm" | "md" | "lg" | "xl";
export type LogoTone = "default" | "onDark" | "mono";

export const logoSizeMap: Record<
  LogoSize,
  { icon: number; wordmark: string; tagline: string; gap: string }
> = {
  sm: { icon: 34, wordmark: "text-base", tagline: "text-[10px]", gap: "gap-2" },
  md: { icon: 42, wordmark: "text-lg", tagline: "text-[11px]", gap: "gap-2.5" },
  lg: { icon: 54, wordmark: "text-2xl", tagline: "text-xs", gap: "gap-3" },
  xl: { icon: 72, wordmark: "text-4xl", tagline: "text-sm", gap: "gap-4" },
};
