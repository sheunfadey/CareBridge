"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";

import {
  logoGeometry,
  logoTones,
  type LogoSize,
  type LogoTone,
} from "@/components/brand/logo-geometry";
import { brand } from "@/config/brand";

type AnimatedCareBridgeLogoProps = {
  size?: LogoSize;
  tone?: LogoTone;
  showTagline?: boolean;
  className?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const iconSizes: Record<LogoSize, number> = {
  sm: 40,
  md: 48,
  lg: 64,
  xl: 88,
};

export function AnimatedCareBridgeLogo({
  size = "lg",
  tone = "default",
  showTagline = true,
  className,
}: AnimatedCareBridgeLogoProps) {
  const reduceMotion = useReducedMotion();
  const colors = logoTones[tone === "mono" ? "default" : tone];
  const figure = tone === "mono" ? "currentColor" : colors.figure;
  const arch = tone === "mono" ? "currentColor" : colors.arch;
  const iconSize = iconSizes[size];
  const wordmarkClass =
    size === "xl" ? "text-4xl" : size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-xl";
  const wordmarkColor =
    tone === "onDark"
      ? "text-white"
      : tone === "mono"
        ? "text-current"
        : "text-brand-navy";
  const taglineColor = tone === "onDark" ? "text-white/70" : "text-brand-slate";

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex flex-col items-center text-center",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        className="inline-flex"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox={logoGeometry.viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {logoGeometry.bodies.map((body, index) => (
            <motion.rect
              key={`body-${index}`}
              fill={figure}
              {...body}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15, ease }}
            />
          ))}
          {logoGeometry.heads.map((head, index) => (
            <motion.circle
              key={`head-${index}`}
              fill={figure}
              {...head}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2, ease }}
            />
          ))}
          <motion.path
            d={logoGeometry.archPath}
            stroke={arch}
            strokeWidth={logoGeometry.archStrokeWidth}
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0.9 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.7, delay: 0.35, ease: "easeInOut" },
              opacity: { duration: 0.2, delay: 0.35 },
            }}
          />
          {reduceMotion ? null : (
            <motion.path
              d={logoGeometry.archPath}
              stroke={arch}
              strokeWidth={logoGeometry.archStrokeWidth + 3}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{ duration: 0.6, delay: 1.05, times: [0, 0.45, 1] }}
            />
          )}
        </svg>
      </motion.span>

      <motion.span
        className={cn(
          "mt-4 font-heading font-semibold tracking-tight",
          wordmarkClass,
          wordmarkColor,
        )}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1, ease }}
      >
        {brand.name}
      </motion.span>

      {showTagline ? (
        <motion.span
          className={cn("mt-2 max-w-sm text-sm", taglineColor)}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2, ease }}
        >
          {brand.tagline}
        </motion.span>
      ) : null}
    </span>
  );
}
