"use client";

import type { ReactNode } from "react";
import { AlertCircle, Compass, Loader2, Sparkles } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { cn } from "@/lib/utils";
import type { UserFacingError } from "@/lib/user-errors";

type FallbackTone = "loading" | "error" | "empty" | "blocked";

type FallbackStateProps = {
  tone?: FallbackTone;
  eyebrow?: string;
  niche?: string;
  title: string;
  message: string;
  tip?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: ReactNode;
  className?: string;
};

const TONE_ICON = {
  loading: Loader2,
  error: AlertCircle,
  empty: Compass,
  blocked: Sparkles,
} as const;

export function FallbackStateFromError({
  error,
  tone = "error",
  niche,
  ...rest
}: {
  error: UserFacingError;
  tone?: FallbackTone;
  niche?: string;
} & Omit<FallbackStateProps, "title" | "message" | "tip" | "tone">) {
  return (
    <FallbackState
      tone={tone}
      niche={niche}
      title={error.title}
      message={error.message}
      tip={error.tip}
      {...rest}
    />
  );
}

export default function FallbackState({
  tone = "empty",
  eyebrow,
  niche,
  title,
  message,
  tip,
  primaryLabel,
  onPrimary,
  primaryLoading,
  secondaryLabel,
  onSecondary,
  children,
  className,
}: FallbackStateProps) {
  const Icon = TONE_ICON[tone];
  const label =
    eyebrow ||
    (niche ? `For your ${niche} store` : undefined) ||
    (tone === "loading"
      ? "Working on it"
      : tone === "error"
        ? "Let’s fix this"
        : "A clearer path");

  return (
    <section
      className={cn(
        "screen-enter soft-card overflow-hidden",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="relative overflow-hidden border-b border-sage-mid/70 bg-gradient-to-br from-sage-soft via-surface to-paper-warm px-5 pb-6 pt-5 sm:px-6">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-pine/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-ochre-soft/80"
          aria-hidden
        />

        <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">
          {label}
        </p>

        <div className="relative mt-4 flex items-start gap-3.5">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs",
              tone === "error"
                ? "border-[#f0c7c0] bg-[#fef3f2] text-error"
                : "border-sage-mid bg-surface text-pine",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                tone === "loading" && "animate-spin",
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[1.45rem] font-semibold leading-snug tracking-tight text-pine-ink sm:text-[1.6rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              {message}
            </p>
          </div>
        </div>

        {tip ? (
          <p className="relative mt-4 rounded-2xl border border-line/80 bg-surface/90 px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
            <span className="font-semibold text-pine">Tip · </span>
            {tip}
          </p>
        ) : null}
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {children}

        {tone === "loading" ? (
          <div className="space-y-2" aria-hidden>
            <div className="h-2 w-full animate-pulse rounded-full bg-sage-soft" />
            <div className="h-2 w-[82%] animate-pulse rounded-full bg-sage-soft/80" />
            <div className="h-2 w-[58%] animate-pulse rounded-full bg-sage-soft/60" />
          </div>
        ) : null}

        {(onPrimary && primaryLabel) || (onSecondary && secondaryLabel) ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onPrimary && primaryLabel ? (
              <PrimaryButton
                type="button"
                className="flex-1"
                loading={primaryLoading}
                onClick={onPrimary}
              >
                {primaryLabel}
              </PrimaryButton>
            ) : null}
            {onSecondary && secondaryLabel ? (
              <button
                type="button"
                onClick={onSecondary}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-pine hover:bg-sage-soft/60"
              >
                {secondaryLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
