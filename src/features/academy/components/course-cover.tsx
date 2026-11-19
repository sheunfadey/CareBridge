"use client";

import * as React from "react";
import { ExpandIcon, ImageIcon } from "lucide-react";
import { cn } from "cn";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CoverProps = {
  src: string | null;
  alt: string;
  className?: string;
};

/**
 * Card media in the style product catalogues use today: a fixed 4:3 frame,
 * edge-to-edge image and a gentle zoom on hover. The frame is consistent even
 * when no image has been uploaded yet.
 */
export function CourseCoverCard({ src, alt, className }: CoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden bg-portal-lavender/45",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-portal-lavender/80 via-portal-sky/50 to-portal-mint/40 text-brand-navy/60">
          <ImageIcon className="size-7" aria-hidden="true" />
          <span className="text-[11px] font-medium">Course image</span>
        </div>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/35 via-transparent to-transparent"
      />
    </div>
  );
}

/**
 * Wide hero used on course detail pages. Clicking opens the full image so the
 * artwork can be inspected without cropping.
 */
export function CourseCoverBanner({ src, alt, className }: CoverProps) {
  if (!src) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative block w-full overflow-hidden rounded-[var(--radius-2xl)] bg-brand-navy/5 ring-1 ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label={`View ${alt} image`}
        >
          <div className="aspect-[16/7] w-full sm:aspect-[16/6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-sm">
            <ExpandIcon className="size-3.5" aria-hidden="true" />
            View image
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl border-none bg-black/95 p-2 sm:p-4">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="mx-auto max-h-[80vh] w-auto max-w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
