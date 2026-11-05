import { cn } from "cn";

import { LogoMark } from "@/components/brand/logo-mark";
import {
  logoSizeMap,
  type LogoSize,
  type LogoTone,
} from "@/components/brand/logo-geometry";
import { brand } from "@/config/brand";

type CareBridgeLogoProps = {
  variant?: "full" | "stacked" | "icon";
  size?: LogoSize;
  tone?: LogoTone;
  showTagline?: boolean;
  className?: string;
  markClassName?: string;
};

export function CareBridgeLogo({
  variant = "full",
  size = "md",
  tone = "default",
  showTagline = false,
  className,
  markClassName,
}: CareBridgeLogoProps) {
  const scale = logoSizeMap[size];
  const wordmarkColor =
    tone === "mono"
      ? "currentColor"
      : tone === "onDark"
        ? "text-white"
        : "text-brand-strong";
  const taglineColor =
    tone === "onDark" ? "text-white/70" : "text-brand-slate";

  if (variant === "icon") {
    return (
      <span
        role="img"
        aria-label={brand.name}
        className={cn("inline-flex items-center", className)}
      >
        <LogoMark size={scale.icon} tone={tone} className={markClassName} />
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <span
        role="img"
        aria-label={brand.name}
        className={cn(
          "inline-flex flex-col items-center text-center",
          scale.gap,
          className,
        )}
      >
        <LogoMark size={scale.icon} tone={tone} className={markClassName} />
        <span className="flex flex-col items-center gap-1">
          <span
            className={cn(
              "font-heading font-semibold tracking-tight",
              scale.wordmark,
              wordmarkColor,
            )}
          >
            {brand.name}
          </span>
          {showTagline ? (
            <span
              className={cn(
                "max-w-[18rem] text-balance leading-snug",
                scale.tagline,
                taglineColor,
              )}
            >
              {brand.tagline}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={brand.name}
      className={cn("inline-flex items-center", scale.gap, className)}
    >
      <LogoMark size={scale.icon} tone={tone} className={markClassName} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading font-semibold tracking-tight",
            scale.wordmark,
            wordmarkColor,
          )}
        >
          {brand.name}
        </span>
        {showTagline ? (
          <span className={cn("mt-1.5", scale.tagline, taglineColor)}>
            {brand.tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
