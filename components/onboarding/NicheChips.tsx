"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { NICHE_OPTIONS, type NicheOption } from "@/lib/schemas";
import { nicheImage } from "@/lib/media";
import { cn } from "@/lib/utils";

type NicheChipsProps = {
  value: NicheOption | "";
  onChange: (value: NicheOption) => void;
  error?: string;
  label?: string;
};

export default function NicheChips({
  value,
  onChange,
  error,
  label = "What do you create content about?",
}: NicheChipsProps) {
  const mainOptions = NICHE_OPTIONS.filter((option) => option !== "Other");
  const hasOther = NICHE_OPTIONS.includes("Other");

  return (
    <div>
      {label ? (
        <p className="mb-3 text-sm font-semibold text-pine-ink">{label}</p>
      ) : null}
      <div
        className="grid grid-cols-2 gap-3"
        role="group"
        aria-label={label || "Niche options"}
      >
        {mainOptions.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-2xl text-left transition-all duration-200",
                selected
                  ? "scale-[1.01] shadow-[0_0_0_3px_var(--pine)] ring-4 ring-sage-soft"
                  : "shadow-xs ring-1 ring-line hover:ring-pine/35",
              )}
              aria-pressed={selected}
            >
              <Image
                src={nicheImage(option)}
                alt=""
                fill
                className={cn(
                  "object-cover transition duration-200",
                  selected ? "brightness-[0.72]" : "brightness-[0.85]",
                )}
                sizes="180px"
              />
              <span
                className={cn(
                  "absolute inset-0 bg-gradient-to-t transition",
                  selected
                    ? "from-pine/90 via-pine/35 to-transparent"
                    : "from-pine-ink/80 via-pine-ink/25 to-transparent",
                )}
              />

              {selected ? (
                <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-pine shadow-sm">
                  <Check className="h-4 w-4 stroke-[2.5]" aria-hidden />
                </span>
              ) : null}

              <span className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-8">
                <span
                  className={cn(
                    "block text-[15px] font-semibold leading-tight tracking-tight text-white",
                    selected ? "drop-shadow-sm" : "",
                  )}
                >
                  {option}
                </span>
                {selected ? (
                  <span className="mt-0.5 block text-[11px] font-medium text-emerald-100">
                    Selected
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}

        {hasOther ? (
          <button
            type="button"
            onClick={() => onChange("Other")}
            className={cn(
              "col-span-2 flex min-h-[56px] items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
              value === "Other"
                ? "border-pine bg-sage-soft shadow-[0_0_0_2px_var(--pine)]"
                : "border-line bg-paper hover:border-pine/40",
            )}
            aria-pressed={value === "Other"}
          >
            <div>
              <p className="text-sm font-semibold text-pine-ink">Other</p>
              <p className="text-xs text-ink-muted">
                Something else — you can describe it next
              </p>
            </div>
            {value === "Other" ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-white">
                <Check className="h-4 w-4 stroke-[2.5]" aria-hidden />
              </span>
            ) : (
              <span className="h-7 w-7 rounded-full border border-line bg-surface" />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
