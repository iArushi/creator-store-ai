import type { ReactNode } from "react";
import { AlertCircle, Info, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusBannerProps = {
  variant?: "notice" | "research" | "estimate" | "error";
  title?: string;
  children: ReactNode;
  className?: string;
};

const VARIANT = {
  notice: {
    box: "border-line bg-sage-soft/70 text-pine-ink",
    title: "text-pine",
    Icon: Info,
  },
  research: {
    box: "border-pine/20 bg-sage-soft text-pine-ink",
    title: "text-pine",
    Icon: Search,
  },
  estimate: {
    box: "border-line bg-paper text-ink-muted",
    title: "text-ink-muted",
    Icon: Sparkles,
  },
  error: {
    box: "border-[#f0c7c0] bg-[#fef3f2] text-[#7a271a]",
    title: "text-error",
    Icon: AlertCircle,
  },
} as const;

export default function StatusBanner({
  variant = "notice",
  title,
  children,
  className = "",
}: StatusBannerProps) {
  const cfg = VARIANT[variant];
  const Icon = cfg.Icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-3.5 py-3 text-sm leading-relaxed",
        cfg.box,
        className,
      )}
    >
      <div className="flex gap-2.5">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            variant === "error" ? "text-error" : "text-pine",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {title ? (
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.12em]",
                cfg.title,
              )}
            >
              {title}
            </p>
          ) : null}
          <div className={title ? "mt-1" : ""}>{children}</div>
        </div>
      </div>
    </div>
  );
}
