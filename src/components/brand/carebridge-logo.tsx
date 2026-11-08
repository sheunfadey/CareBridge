import { cn } from "cn";

import { AnimatedHillCrestLogo } from "@/components/brand/animated-carebridge-logo";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  logoSizeMap,
  type LogoSize,
  type LogoTone,
} from "@/components/brand/logo-geometry";
import { brand } from "@/config/brand";

type HillCrestLogoProps = {
  variant?: "full" | "stacked" | "icon" | "light" | "dark";
  size?: LogoSize;
  tone?: LogoTone;
  animated?: boolean;
  showTagline?: boolean;
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
};

export function HillCrestLogo({
  variant = "full",
  size = "md",
  tone = "default",
  animated = false,
  showTagline = false,
  showWordmark = true,
  className,
  markClassName,
}: HillCrestLogoProps) {
  const scale = logoSizeMap[size];
  const resolvedTone: LogoTone =
    variant === "light"
      ? "onDark"
      : variant === "dark"
        ? "default"
        : tone;
  const isIcon = variant === "icon" || !showWordmark;
  const isStacked = variant === "stacked";
  const wordmarkColor =
    resolvedTone === "mono"
      ? "text-current"
      : resolvedTone === "onDark"
        ? "text-white"
        : "text-brand-strong";
  const bridgeColor =
    resolvedTone === "mono" ? "text-current" : "text-brand-green";
  const taglineColor =
    resolvedTone === "onDark" ? "text-white/75" : "text-brand-slate";

  if (animated && !isIcon) {
    return (
      <AnimatedHillCrestLogo
        size={size}
        tone={resolvedTone}
        showTagline={showTagline}
        className={className}
      />
    );
  }

  if (isIcon) {
    return (
      <span
        role="img"
        aria-label={brand.name}
        className={cn("inline-flex items-center", className)}
      >
        <LogoMark size={scale.icon} tone={resolvedTone} className={markClassName} />
      </span>
    );
  }

  const wordmark = (
    <span
      className={cn(
        "font-heading font-semibold tracking-[-0.035em]",
        scale.wordmark,
        wordmarkColor,
      )}
    >
      Hill
      <span className={bridgeColor}>Crest</span>
    </span>
  );

  if (isStacked) {
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
        <LogoMark size={scale.icon} tone={resolvedTone} className={markClassName} />
        <span className="flex flex-col items-center gap-1">
          {wordmark}
          {showTagline ? (
            <span
              className={cn(
                "max-w-[22rem] text-balance leading-snug",
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
      <LogoMark size={scale.icon} tone={resolvedTone} className={markClassName} />
      <span className="flex flex-col leading-none">
        {wordmark}
        {showTagline ? (
          <span className={cn("mt-1.5", scale.tagline, taglineColor)}>
            {brand.tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
