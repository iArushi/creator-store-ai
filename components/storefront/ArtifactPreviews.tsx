"use client";

import {
  BookOpen,
  Calendar,
  CheckSquare,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import type { ProductFormat, StorefrontProduct } from "@/lib/schemas";

export type ProductPreviewInput = Pick<
  StorefrontProduct,
  | "title"
  | "format"
  | "description"
  | "problemSolved"
  | "outcome"
  | "deliverables"
  | "priceInr"
> & {
  niche?: string;
  expertiseTags?: string[];
};

function shortLabel(text: string, max = 22): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 10 ? space : max - 1).trim()}…`;
}

function firstWords(text: string, count = 3): string {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .join(" ");
}

function formatIcon(format: ProductFormat | string) {
  const key = format.toLowerCase();
  if (key.includes("1:1") || key.includes("call")) return Calendar;
  if (key.includes("workshop") || key.includes("cohort") || key.includes("community")) {
    return Users;
  }
  if (key.includes("course")) return BookOpen;
  if (key.includes("template") || key.includes("ebook")) return CheckSquare;
  return Layers;
}

function previewTitle(format: string, niche?: string): string {
  const key = format.toLowerCase();
  const nicheBit = niche?.trim() ? shortLabel(niche, 16) : null;
  if (key.includes("1:1") || key.includes("call")) {
    return nicheBit ? `${nicheBit} 1:1` : "Session path";
  }
  if (key.includes("workshop") || key.includes("cohort")) {
    return nicheBit ? `${nicheBit} session` : "Live path";
  }
  if (key.includes("course")) {
    return nicheBit ? `${nicheBit} path` : "Learning path";
  }
  if (key.includes("template") || key.includes("ebook")) {
    return nicheBit ? `${nicheBit} kit` : "What's inside";
  }
  return nicheBit ? `${nicheBit} preview` : "What's inside";
}

function buildSteps(product: ProductPreviewInput): string[] {
  const fromDeliverables = product.deliverables
    .map((item) => shortLabel(item, 24))
    .filter(Boolean);

  if (fromDeliverables.length >= 3) return fromDeliverables.slice(0, 3);
  if (fromDeliverables.length === 2) {
    return [
      ...fromDeliverables,
      shortLabel(product.outcome || "Clear next step", 24),
    ];
  }
  if (fromDeliverables.length === 1) {
    return [
      fromDeliverables[0],
      shortLabel(product.problemSolved || "Core practice", 24),
      shortLabel(product.outcome || "Clear next step", 24),
    ];
  }

  return [
    shortLabel(firstWords(product.title, 3) || "Start here", 24),
    shortLabel(product.problemSolved || "Guided practice", 24),
    shortLabel(product.outcome || "Clear next step", 24),
  ];
}

function buildMetricChips(product: ProductPreviewInput): Array<{
  label: string;
  value: string;
}> {
  const tags = (product.expertiseTags || [])
    .map((t) => shortLabel(t, 14))
    .filter(Boolean)
    .slice(0, 2);

  const chips: Array<{ label: string; value: string }> = [
    {
      label: "Format",
      value: shortLabel(product.format, 14),
    },
  ];

  if (tags[0]) {
    chips.push({ label: "Focus", value: tags[0] });
  } else {
    chips.push({
      label: "Focus",
      value: shortLabel(firstWords(product.problemSolved || product.title, 2), 14),
    });
  }

  chips.push({
    label: "Outcome",
    value: shortLabel(firstWords(product.outcome || product.description, 2), 14),
  });

  return chips.slice(0, 3);
}

/**
 * Dynamic micro-preview built only from this product + creator context.
 * No hardcoded finance / exam / niche demo data.
 */
export function ProductArtifactPreview({
  product,
}: {
  product: ProductPreviewInput;
}) {
  const Icon = formatIcon(product.format);
  const steps = buildSteps(product);
  const chips = buildMetricChips(product);
  const heading = previewTitle(product.format, product.niche);
  const key = product.format.toLowerCase();
  const isSession = key.includes("1:1") || key.includes("call");
  const isLive =
    key.includes("workshop") ||
    key.includes("cohort") ||
    key.includes("community");

  if (isSession || isLive) {
    return (
      <div
        className={`rounded-xl border p-3 ${
          isSession
            ? "border-amber-200/80 bg-ochre-soft/65"
            : "border-line/90 bg-paper"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
          <span
            className={`flex items-center gap-1.5 font-semibold uppercase tracking-wider ${
              isSession ? "text-ochre-ink" : "text-pine"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {heading}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium ${
              isSession
                ? "border-amber-200/70 bg-white/80 text-ochre-ink"
                : "border-line bg-surface text-ink-muted"
            }`}
          >
            {shortLabel(product.format, 12)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {steps.map((step, index) => (
            <div
              key={`${step}-${index}`}
              className={`rounded-lg border px-2.5 py-1.5 ${
                isSession
                  ? "border-amber-200/60 bg-surface/95"
                  : "border-line/70 bg-surface"
              }`}
            >
              <div
                className={`font-mono text-[10px] font-semibold ${
                  isSession ? "text-ochre-ink" : "text-pine"
                }`}
              >
                0{index + 1}
              </div>
              <div className="text-xs font-medium leading-snug text-pine-ink">
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (key.includes("course") || key.includes("mini")) {
    return (
      <div className="rounded-xl border border-sage-mid/70 bg-sage-soft/65 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pine">
            <Icon className="h-3.5 w-3.5" />
            {heading}
          </span>
          <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-muted">
            {steps.length} steps
          </span>
        </div>
        <div className="mb-2.5 flex h-2 overflow-hidden rounded-full bg-surface/80">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-full ${
                index === 0
                  ? "bg-pine"
                  : index === 1
                    ? "bg-emerald-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${100 / steps.length}%` }}
            />
          ))}
        </div>
        <div className="space-y-1.5">
          {steps.map((step, index) => (
            <div
              key={`${step}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-line/60 bg-surface/90 px-2.5 py-1.5"
            >
              <span className="font-mono text-[10px] font-semibold text-pine">
                0{index + 1}
              </span>
              <span className="text-xs font-medium text-pine-ink">{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Templates, ebooks, community, default — checklist + persona chips
  return (
    <div className="rounded-xl border border-line bg-paper p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-pine">
          <Icon className="h-3.5 w-3.5" />
          {heading}
        </span>
        <span className="inline-flex items-center gap-1 text-ink-muted">
          <Sparkles className="h-3 w-3" />
          From this offer
        </span>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {chips.map((chip) => (
          <div
            key={chip.label}
            className="rounded-lg border border-line/70 bg-surface px-2.5 py-1.5"
          >
            <div className="font-sans text-[10px] text-ink-muted">{chip.label}</div>
            <div className="truncate text-xs font-semibold text-pine-ink">
              {chip.value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {steps.map((step, index) => (
          <div
            key={`${step}-${index}`}
            className="flex items-center gap-2 rounded-lg border border-line/70 bg-surface px-2.5 py-1.5 text-xs"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pine text-[10px] font-bold text-white">
              ✓
            </span>
            <span className="font-medium text-pine-ink">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Prefer ProductArtifactPreview with full product context */
export function previewForFormat(
  format: string,
  niche?: string,
  product?: ProductPreviewInput,
) {
  if (product) {
    return (
      <ProductArtifactPreview
        product={{
          ...product,
          format: product.format || (format as ProductFormat),
          niche: product.niche || niche,
        }}
      />
    );
  }

  return (
    <ProductArtifactPreview
      product={{
        title: niche ? `${niche} offer` : "Creator offer",
        format: format as ProductFormat,
        description: "",
        problemSolved: niche ? `Clearer progress in ${niche}` : "Clearer next steps",
        outcome: "A practical next step",
        deliverables: ["Core resource", "Action checklist", "Guided next step"],
        priceInr: 499,
        niche,
      }}
    />
  );
}
