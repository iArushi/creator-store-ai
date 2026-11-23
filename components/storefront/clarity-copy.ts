import {
  PRODUCT_FORMAT_META,
  type ProductFormat,
  type StorefrontProduct,
} from "@/lib/schemas";

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDurationHint(format: StorefrontProduct["format"] | string) {
  const key = format.toLowerCase();
  if (key.includes("1-on-1") || key.includes("1:1") || key.includes("session")) {
    return "45–60 min";
  }
  if (key.includes("event") || key.includes("webinar") || key.includes("workshop")) {
    return "90m Live + Replay";
  }
  if (key.includes("membership") || key.includes("community")) return "Ongoing";
  if (key.includes("course") || key.includes("cohort") || key.includes("mini")) {
    return "Self-paced";
  }
  if (key.includes("locked")) return "Instant unlock";
  if (key.includes("digital") || key.includes("ebook") || key.includes("template")) {
    return "Instant download";
  }
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
  if (format.includes("event") || format.includes("webinar") || format.includes("workshop")) {
    return `Reserve My Seat · ${price}`;
  }
  if (format.includes("digital") || format.includes("template") || format.includes("ebook")) {
    return `Download · ${price}`;
  }
  if (format.includes("locked")) return `Unlock · ${price}`;
  if (format.includes("1-on-1") || format.includes("1:1") || format.includes("session")) {
    return `Book Session · ${price}`;
  }
  if (format.includes("membership") || format.includes("community")) {
    return `Join · ${price}`;
  }
  if (format.includes("course")) return `Start Learning · ${price}`;
  return `Get Access · ${price}`;
}

export function heroCtaLabel(count: number) {
  return `Explore ${count} ways to start`;
}

/** Niche-agnostic filters based on SuperProfile product types */
export function filterIdForProduct(product: StorefrontProduct): string {
  const f = product.format.toLowerCase();
  if (f.includes("1-on-1") || f.includes("1:1") || f.includes("session")) return "call";
  if (f.includes("membership") || f.includes("community")) return "membership";
  if (f.includes("event") || f.includes("webinar") || f.includes("workshop")) {
    return "live";
  }
  if (f.includes("course") || f.includes("cohort") || f.includes("mini")) return "course";
  if (f.includes("locked")) return "locked";
  return "diy";
}

export const STOREFRONT_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "diy", label: "Digital files" },
  { id: "course", label: "Courses" },
  { id: "live", label: "Events" },
  { id: "call", label: "1-on-1" },
  { id: "membership", label: "Membership" },
  { id: "locked", label: "Locked" },
];

/** Max “what’s included” lines a creator can keep on one offer. */
export const MAX_DELIVERABLES = 5;
export const MIN_DELIVERABLES = 2;

/** How many product offerings one storefront can hold. */
export const MAX_OFFERS = 6;
export const MIN_OFFERS = 2;

export type OfferTemplate = {
  /** Short chip label shown under Add another offer */
  label: string;
  title: string;
  format: ProductFormat;
  description: string;
  targetAudience: string;
  problemSolved: string;
  outcome: string;
  deliverables: string[];
  priceInr: number;
  priceRationale: string;
  whyFitsCreator: string;
  coverMotif: StorefrontProduct["coverMotif"];
};

/**
 * Ready-made “what’s included” lines by format.
 * Filter out ones already on the offer so Add more stays useful.
 */
export function deliverableSuggestionsFor(product: StorefrontProduct): string[] {
  const format = product.format.toLowerCase();
  const taken = new Set(
    product.deliverables.map((item) => item.trim().toLowerCase()).filter(Boolean),
  );

  const common = [
    "Quick-start checklist",
    "Common mistakes to avoid",
    "One filled example",
  ];

  let pool: string[] = common;
  if (format.includes("digital") || format.includes("ebook") || format.includes("template")) {
    pool = [
      "Downloadable PDF / file",
      "Editable tracker sheet",
      "Filled sample",
      "How-to notes (1 page)",
      ...common,
    ];
  } else if (format.includes("locked")) {
    pool = [
      "Locked file / drop",
      "Unlock instructions",
      "Bonus tip sheet",
      ...common,
    ];
  } else if (
    format.includes("event") ||
    format.includes("webinar") ||
    format.includes("workshop")
  ) {
    pool = [
      "Live session seat",
      "Replay access",
      "Slide deck PDF",
      "Action worksheet",
      ...common,
    ];
  } else if (format.includes("membership") || format.includes("community")) {
    pool = [
      "Private group access",
      "Weekly prompts",
      "Welcome guide",
      "Resource folder",
      ...common,
    ];
  } else if (
    format.includes("1-on-1") ||
    format.includes("1:1") ||
    format.includes("session")
  ) {
    pool = [
      "Prep questionnaire",
      "Session summary notes",
      "30-day action plan",
      "Personal resource list",
      ...common,
    ];
  } else if (format.includes("course") || format.includes("cohort") || format.includes("mini")) {
    pool = [
      "Lesson outline",
      "Video modules",
      "Practice worksheet",
      "Progress tracker",
      ...common,
    ];
  }

  return [...new Set(pool)]
    .filter((item) => !taken.has(item.toLowerCase()))
    .slice(0, 6);
}

/**
 * SuperProfile-style product templates for Add another offer.
 * One ready draft per product type the creator doesn’t already use.
 */
export function offerTemplatesFor(input: {
  niche: string;
  existing: StorefrontProduct[];
}): OfferTemplate[] {
  const niche = (input.niche || "your topic").trim() || "your topic";
  const usedFormats = new Set(input.existing.map((p) => p.format));
  const usedTitles = new Set(
    input.existing.map((p) => p.title.trim().toLowerCase()),
  );

  const pool: OfferTemplate[] = [
    {
      label: PRODUCT_FORMAT_META["digital files"].label,
      title: `${niche} Digital Starter Pack`,
      format: "digital files",
      description: PRODUCT_FORMAT_META["digital files"].blurb,
      targetAudience: `Beginners who want a downloadable start in ${niche}`,
      problemSolved: "They don't know where to start and stall on day one",
      outcome: "A usable file pack and a clear first-week plan",
      deliverables: [
        "PDF / template pack",
        "Filled example",
        "7-day checklist",
      ],
      priceInr: 299,
      priceRationale:
        "Low-friction digital-file price so first-time buyers can try your work.",
      whyFitsCreator: `Packages what you already share about ${niche} into files.`,
      coverMotif: "grid",
    },
    {
      label: PRODUCT_FORMAT_META["1-on-1 session"].label,
      title: `${niche} 1-on-1 Session`,
      format: "1-on-1 session",
      description: PRODUCT_FORMAT_META["1-on-1 session"].blurb,
      targetAudience: `People stuck on a personal ${niche} decision`,
      problemSolved: "Generic advice doesn't fit their situation",
      outcome: "A tailored plan for the next 30 days",
      deliverables: [
        "Prep questionnaire",
        "45–60 min session",
        "Written next-step summary",
      ],
      priceInr: 1499,
      priceRationale: "1-on-1 time priced accessibly for first-time service buyers.",
      whyFitsCreator: `Uses your ${niche} judgment in a high-trust format.`,
      coverMotif: "compass",
    },
    {
      label: PRODUCT_FORMAT_META.membership.label,
      title: `${niche} Membership Circle`,
      format: "membership",
      description: PRODUCT_FORMAT_META.membership.blurb,
      targetAudience: `Learners who want ongoing accountability in ${niche}`,
      problemSolved: "One-off tips fade without community follow-through",
      outcome: "Weekly support and a habit of showing up",
      deliverables: [
        "Private group access",
        "Weekly prompts",
        "Welcome guide",
      ],
      priceInr: 499,
      priceRationale: "Accessible recurring entry for Indian audiences.",
      whyFitsCreator: `Turns your ongoing ${niche} tips into a membership.`,
      coverMotif: "wave",
    },
    {
      label: PRODUCT_FORMAT_META["event / webinar"].label,
      title: `${niche} Live Workshop`,
      format: "event / webinar",
      description: PRODUCT_FORMAT_META["event / webinar"].blurb,
      targetAudience: `Learners who prefer live practice in ${niche}`,
      problemSolved: "They learn passively but never apply it",
      outcome: "A worked example and a personal next-step plan",
      deliverables: [
        "Live seat",
        "Replay access",
        "Action worksheet",
      ],
      priceInr: 1999,
      priceRationale: "Live time + replay justifies a fair INR event price.",
      whyFitsCreator: `Turns your ${niche} explanations into a live event.`,
      coverMotif: "spark",
    },
    {
      label: PRODUCT_FORMAT_META["locked content"].label,
      title: `${niche} Locked Drop`,
      format: "locked content",
      description: PRODUCT_FORMAT_META["locked content"].blurb,
      targetAudience: `Followers ready to pay for one specific ${niche} resource`,
      problemSolved: "Your best file is free-floating with no clear offer",
      outcome: "Instant access to a paid unlockable resource",
      deliverables: [
        "Locked file / drop",
        "Unlock instructions",
        "Bonus tip sheet",
      ],
      priceInr: 199,
      priceRationale: "Small unlock price for a single high-value file.",
      whyFitsCreator: `Monetises one concrete ${niche} asset you already make.`,
      coverMotif: "ledger",
    },
    {
      label: PRODUCT_FORMAT_META.course.label,
      title: `${niche} Self-Paced Course`,
      format: "course",
      description: PRODUCT_FORMAT_META.course.blurb,
      targetAudience: `Busy learners who want a structured ${niche} path`,
      problemSolved: "Tips feel random; they need a path",
      outcome: "Complete one small project with a clear checklist",
      deliverables: [
        "Video / lesson modules",
        "Practice worksheet",
        "Progress tracker",
      ],
      priceInr: 999,
      priceRationale: "Mid-tier course price for a complete self-paced path.",
      whyFitsCreator: `Structures your ${niche} content into a course.`,
      coverMotif: "stack",
    },
  ];

  const unusedTitles = pool.filter(
    (template) => !usedTitles.has(template.title.toLowerCase()),
  );
  const preferNewFormat = unusedTitles.filter(
    (template) => !usedFormats.has(template.format),
  );
  // Always surface SuperProfile's six types when possible (up to remaining slots).
  return (preferNewFormat.length ? preferNewFormat : unusedTitles).slice(0, 6);
}
