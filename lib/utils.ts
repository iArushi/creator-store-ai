import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isHandleLike(value: string) {
  const cleaned = value.replace(/^@/, "").trim();
  return Boolean(cleaned) && /^[a-z0-9._]+$/i.test(cleaned) && !/\s/.test(cleaned);
}

/**
 * Instagram-style handles look uneven in title case (e.g. IARushri).
 * Keep usernames / single-token handles in ALL CAPS everywhere.
 */
export function formatCreatorBrandName(
  name: string,
  handle?: string | null,
): string {
  const cleaned = name.replace(/^@/, "").trim();
  const handleClean = (handle || "").replace(/^@/, "").trim();

  if (handleClean && isHandleLike(handleClean)) {
    if (!cleaned || cleaned.toLowerCase() === handleClean.toLowerCase()) {
      return handleClean.toUpperCase();
    }
  }

  if (isHandleLike(cleaned)) {
    return cleaned.toUpperCase();
  }

  return cleaned;
}

export function formatCreatorHandle(handle?: string | null): string | undefined {
  const cleaned = (handle || "").replace(/^@/, "").trim();
  if (!cleaned) return undefined;
  return cleaned.toUpperCase();
}

/**
 * Force the creator username to ALL CAPS inside any free-text copy (bio, intro, etc.).
 */
export function applyCreatorCapsInCopy(
  text: string,
  name: string,
  handle?: string | null,
): string {
  if (!text) return text;
  const brand = formatCreatorBrandName(name, handle);
  if (!brand) return text;

  const candidates = [
    name.replace(/^@/, "").trim(),
    (handle || "").replace(/^@/, "").trim(),
    brand,
  ].filter((value, index, arr) => value && arr.indexOf(value) === index);

  let out = text;
  for (const candidate of candidates) {
    const re = new RegExp(`\\b${escapeRegExp(candidate)}\\b`, "gi");
    out = out.replace(re, brand);
  }
  return out;
}

/** Visual path only — real slug stays lowercase for routing. */
export function formatStorefrontPathDisplay(
  slug: string,
  name?: string | null,
  handle?: string | null,
): string {
  const brand = formatCreatorBrandName(name || handle || "", handle);
  const seed = (handle || name || "")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();
  if (brand && seed && slug.toLowerCase().startsWith(seed)) {
    return `/s/${brand}${slug.slice(seed.length)}`;
  }
  return `/s/${slug}`;
}
