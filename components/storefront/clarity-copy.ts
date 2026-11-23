import type { StorefrontProduct } from "@/lib/schemas";

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDurationHint(format: StorefrontProduct["format"] | string) {
  const key = format.toLowerCase();
  if (key.includes("1:1") || key.includes("call")) return "45–60 min";
  if (key.includes("workshop")) return "90m Live + Replay";
  if (key.includes("cohort")) return "2–4 weeks";
  if (key.includes("mini")) return "Self-paced · ~1 afternoon";
  if (key.includes("ebook")) return "Instant PDF";
  if (key.includes("template")) return "Sheets + Excel";
  if (key.includes("community")) return "Ongoing";
  return format;
}

export function oneLinerFor(product: StorefrontProduct) {
  const text = product.description.trim();
  if (text.length <= 110) return text;
  const cut = text.slice(0, 107);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : 107).trim()}…`;
}

/** Single clear CTA style — outcome-led with price. */
export function ctaLabelForProduct(product: StorefrontProduct) {
  const price = formatInr(product.priceInr);
  const format = product.format.toLowerCase();
  if (format.includes("workshop")) return `Reserve My Seat · ${price}`;
  if (format.includes("template")) return `Grab Templates · ${price}`;
  if (format.includes("call")) return `Book My Plan · ${price}`;
  if (format.includes("mini") || format.includes("course")) {
    return `Start Learning · ${price}`;
  }
  return `Get Access · ${price}`;
}

export function heroCtaLabel(count: number) {
  return `Explore ${count} ways to start`;
}

/** Niche-agnostic filters based on product format */
export function filterIdForProduct(product: StorefrontProduct): string {
  const f = product.format.toLowerCase();
  if (f.includes("call") || f.includes("1:1")) return "call";
  if (f.includes("template") || f.includes("ebook")) return "diy";
  if (f.includes("workshop") || f.includes("cohort") || f.includes("community")) {
    return "live";
  }
  if (f.includes("mini") || f.includes("course")) return "course";
  return "diy";
}

export const STOREFRONT_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live / group" },
  { id: "course", label: "Self-paced" },
  { id: "diy", label: "DIY / downloads" },
  { id: "call", label: "1:1" },
];
