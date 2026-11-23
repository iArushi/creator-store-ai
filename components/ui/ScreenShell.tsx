import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScreenShellProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Extra classes for the sticky footer dock (e.g. progress panel). */
  footerClassName?: string;
  className?: string;
};

export default function ScreenShell({
  kicker,
  title,
  subtitle,
  onBack,
  backLabel = "← Back",
  children,
  footer,
  footerClassName,
  className = "",
}: ScreenShellProps) {
  return (
    <>
      <section
        className={cn(
          "screen-enter soft-card screen-with-dock p-4 sm:p-5",
          className,
        )}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex min-h-10 items-center text-sm font-medium text-muted transition hover:text-ink"
          >
            {backLabel}
          </button>
        ) : null}

        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">
            {kicker}
          </p>
        ) : null}

        <h1
          className={cn(
            "font-display text-[1.45rem] font-semibold leading-[1.15] tracking-tight text-pine-ink sm:text-[1.65rem]",
            kicker ? "mt-1.5" : "",
          )}
        >
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-ink-secondary">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-4">{children}</div>
      </section>

      {footer ? (
        <div className={cn("sticky-actions", footerClassName)}>{footer}</div>
      ) : null}
    </>
  );
}
