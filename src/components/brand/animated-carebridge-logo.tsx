"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";

import {
  emblemPalette,
  emblemPaths,
  type EmblemTone,
} from "@/components/brand/logo-emblem";
import type { LogoSize, LogoTone } from "@/components/brand/logo-geometry";
import { brand } from "@/config/brand";

type AnimatedHillCrestLogoProps = {
  size?: LogoSize;
  tone?: LogoTone;
  showTagline?: boolean;
  className?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const iconSizes: Record<LogoSize, number> = {
  sm: 40,
  md: 52,
  lg: 76,
  xl: 112,
};

const wordmarkSizes: Record<LogoSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl sm:text-5xl",
};

export function AnimatedHillCrestLogo({
  size = "lg",
  tone = "default",
  showTagline = true,
  className,
}: AnimatedHillCrestLogoProps) {
  const reduceMotion = useReducedMotion();
  const emblemTone: EmblemTone =
    tone === "onDark" ? "light" : tone === "mono" ? "mono" : "dark";
  const colors = emblemPalette[emblemTone];
  const iconSize = iconSizes[size];
  const wordmarkColor =
    tone === "onDark"
      ? "text-white"
      : tone === "mono"
        ? "text-current"
        : "text-brand-strong";
  const taglineColor = tone === "onDark" ? "text-white/75" : "text-brand-slate";

  const animate = (delay: number) =>
    reduceMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease },
        };

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`${brand.name}. ${brand.tagline}`}
      className={cn("inline-flex flex-col items-center text-center", className)}
    >
      <motion.span
        aria-hidden="true"
        className="inline-flex"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        style={{ transformOrigin: "50% 50%" }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.g
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease }}
          >
            <path d={emblemPaths.heartLeft} stroke={colors.blue} strokeWidth={30} />
            <path d={emblemPaths.heartRight} stroke={colors.green} strokeWidth={30} />
            <path
              d={emblemPaths.heartLeft}
              stroke={colors.bright}
              strokeWidth={7}
              opacity={0.22}
            />
            <path
              d={emblemPaths.heartRight}
              stroke={colors.white}
              strokeWidth={6}
              opacity={0.14}
            />
          </motion.g>

          <motion.g
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease }}
          >
            <circle cx={198} cy={246} r={36} fill={colors.blue} />
            <path d={emblemPaths.caregiverBody} fill={colors.blue} />
            <path
              d={emblemPaths.caregiverArm}
              stroke={colors.blue}
              strokeWidth={22}
            />
            <circle cx={326} cy={266} r={32} fill={colors.green} />
            <path d={emblemPaths.recipientBody} fill={colors.green} />
            <path
              d={emblemPaths.recipientArch}
              stroke={colors.white}
              strokeWidth={10}
            />
          </motion.g>

          <motion.g
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.62, ease }}
          >
            <motion.path
              d={emblemPaths.roof}
              stroke={colors.navy}
              strokeWidth={20}
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.62, ease: "easeInOut" }}
            />
            <g fill={colors.navy}>
              <rect x={244} y={198} width={11} height={11} rx={2} />
              <rect x={261} y={198} width={11} height={11} rx={2} />
              <rect x={244} y={215} width={11} height={11} rx={2} />
              <rect x={261} y={215} width={11} height={11} rx={2} />
            </g>
          </motion.g>

          <motion.g
            strokeLinecap="round"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.72, ease }}
          >
            <motion.path
              d={emblemPaths.bridge}
              stroke={colors.white}
              strokeWidth={42}
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.72, ease: "easeInOut" }}
            />
            <motion.path
              d={emblemPaths.bridge}
              stroke={colors.blue}
              strokeWidth={26}
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.72, ease: "easeInOut" }}
            />
            <path
              d="M104 407C206 367 320 367 408 407"
              stroke={colors.bright}
              strokeWidth={6}
              opacity={0.5}
            />
          </motion.g>
        </svg>
      </motion.span>

      <motion.span
        className={cn(
          "font-heading font-semibold tracking-[-0.035em]",
          size === "sm" ? "mt-3" : "mt-4",
          wordmarkSizes[size],
          wordmarkColor,
        )}
        {...(animate(0.98) ?? {})}
      >
        Hill
        <span className={tone === "mono" ? "text-current" : "text-brand-green"}>
          Crest
        </span>
      </motion.span>

      {showTagline ? (
        <motion.span
          className={cn(
            "mt-2 max-w-sm text-balance leading-snug",
            size === "xl" ? "text-sm sm:text-base" : "text-xs sm:text-sm",
            taglineColor,
          )}
          {...(animate(1.45) ?? {})}
        >
          {brand.tagline}
        </motion.span>
      ) : null}
    </span>
  );
}
