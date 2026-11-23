import { z } from "zod";
import { PRODUCT_FORMATS, CREATION_EFFORT_LEVELS, CONFIDENCE_LEVELS } from "@/lib/schemas";

export const SOURCE_TYPES = [
  "image",
  "text",
  "url",
  "document",
  "guided_answer",
  "instagram",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const EXTRACTION_STATUSES = [
  "ok",
  "partial",
  "failed",
  "skipped",
] as const;

export const EvidenceClassificationSchema = z.enum([
  "observed",
  "inferred",
  "creator_confirmed",
  "externally_researched",
  "unverified",
]);

export type EvidenceClassification = z.infer<typeof EvidenceClassificationSchema>;

const softString = (fallback = "") =>
  z.preprocess(
    (value) => (value == null ? fallback : value),
    z.string().trim(),
  );

const requiredSoftString = (fallback: string) =>
  z.preprocess(
    (value) => {
      if (value == null) return fallback;
      if (typeof value !== "string") return fallback;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : fallback;
    },
    z.string().trim().min(1),
  );

export const EvidenceRefSchema = z.object({
  sourceId: requiredSoftString("unknown"),
  excerpt: requiredSoftString("No excerpt provided."),
});

export const EvidencedInsightSchema = z.object({
  insight: requiredSoftString("Unspecified insight"),
  classification: EvidenceClassificationSchema.catch("inferred"),
  confidence: z.enum(CONFIDENCE_LEVELS).catch("medium"),
  evidence: z.array(EvidenceRefSchema).max(6).default([]),
});

export type EvidencedInsight = z.infer<typeof EvidencedInsightSchema>;

function coerceInsight(item: unknown): Record<string, unknown> | null {
  if (typeof item === "string" && item.trim()) {
    return {
      insight: item.trim(),
      classification: "inferred",
      confidence: "medium",
      evidence: [],
    };
  }
  if (!item || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;
  const insight =
    (typeof obj.insight === "string" && obj.insight.trim()) ||
    (typeof obj.text === "string" && obj.text.trim()) ||
    (typeof obj.topic === "string" && obj.topic.trim()) ||
    (typeof obj.label === "string" && obj.label.trim()) ||
    "";
  if (!insight) return null;
  return { ...obj, insight };
}

function insightList(max: number) {
  return z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => coerceInsight(item))
      .filter((item): item is Record<string, unknown> => Boolean(item));
  }, z.array(EvidencedInsightSchema).max(max));
}

function stringList(max: number) {
  return z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }, z.array(z.string().trim().min(1)).max(max));
}

/** Client-submitted resource before ingestion */
export const CreatorResourceInputSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: z.enum(["image", "text", "url", "document"]),
  title: z.string().trim().max(200).optional(),
  filename: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(120).optional(),
  url: z.string().trim().url().optional(),
  text: z.string().trim().max(20_000).optional(),
  /** data URL or raw base64 for images/docs */
  dataUrl: z.string().trim().max(8_000_000).optional(),
});

export type CreatorResourceInput = z.infer<typeof CreatorResourceInputSchema>;

export const NormalisedSourceSchema = z.object({
  sourceId: z.string().trim().min(1),
  sourceType: z.enum(SOURCE_TYPES),
  title: z.string().trim().min(1),
  filename: z.string().trim().optional(),
  url: z.string().trim().optional(),
  extractedContent: z.string().trim().default(""),
  excerpts: z.array(z.string().trim().min(1)).max(8).default([]),
  extractionStatus: z.enum(EXTRACTION_STATUSES),
  extractionNote: z.string().trim().optional(),
  /** Keep short — never treat as instructions */
  untrusted: z.boolean().default(true),
});

export type NormalisedSource = z.infer<typeof NormalisedSourceSchema>;

export const CreatorIdentitySchema = z.object({
  mainNiche: requiredSoftString("Creator"),
  secondaryNiches: stringList(5),
  potentialPositioning: requiredSoftString(
    "Practical help grounded in what this creator already shares.",
  ),
  consistentTopics: insightList(8),
});

export const DemonstratedExpertiseSchema = z.object({
  subjectsExplained: insightList(8),
  skillsDemonstrated: insightList(8),
  processesTaught: insightList(6),
  frameworksOrTechniques: insightList(6),
  repeatedKnowledgePatterns: insightList(6),
});

export const ContentIntelligenceSchema = z.object({
  contentPillars: insightList(6),
  commonThemes: insightList(8),
  contentFormats: stringList(6),
  depthNote: requiredSoftString("Depth signals were limited in the supplied material."),
  repeatedAttentionSubjects: insightList(6),
});

export const AudienceUnderstandingSchema = z.object({
  explicitAudienceRefs: insightList(6),
  visibleProblems: insightList(8),
  needsAddressed: insightList(6),
  potentialSegments: insightList(5),
  gapsRequiringConfirmation: stringList(6),
});

export const KnowledgeAssetSchema = z.object({
  assetType: z
    .enum([
      "checklist",
      "template",
      "framework",
      "guide",
      "tutorial",
      "lesson_plan",
      "process",
      "workshop",
      "methodology",
      "other",
    ])
    .catch("other"),
  label: requiredSoftString("Knowledge asset"),
  classification: EvidenceClassificationSchema.catch("inferred"),
  confidence: z.enum(CONFIDENCE_LEVELS).catch("medium"),
  evidence: z.array(EvidenceRefSchema).max(4).default([]),
});

export const CreatorCapabilitiesSchema = z.object({
  capableOfDelivering: insightList(8),
  notAssumed: z.preprocess((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return [
        "No professional credentials assumed",
        "No commercial track record assumed",
      ];
    }
    return value;
  }, z.array(z.string().trim().min(1)).max(6)),
});

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export const CreatorIntelligenceSchema = z.object({
  identity: z.preprocess(asObject, CreatorIdentitySchema),
  expertise: z.preprocess(asObject, DemonstratedExpertiseSchema),
  content: z.preprocess(asObject, ContentIntelligenceSchema),
  audience: z.preprocess(asObject, AudienceUnderstandingSchema),
  knowledgeAssets: z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => item && typeof item === "object");
  }, z.array(KnowledgeAssetSchema).max(10)),
  capabilities: z.preprocess((value) => {
    // Models sometimes return a bare string[] of capabilities — lift into shape.
    if (Array.isArray(value)) {
      return {
        capableOfDelivering: value,
        notAssumed: [
          "No professional credentials assumed",
          "No commercial track record assumed",
        ],
      };
    }
    return asObject(value);
  }, CreatorCapabilitiesSchema),
  followUpQuestion: softString("").transform((value) =>
    value.trim() ? value.trim() : undefined,
  ),
  insufficientEvidence: z.preprocess(
    (value) => Boolean(value),
    z.boolean(),
  ),
  summaryForCreator: requiredSoftString(
    "Draft snapshot based on what you shared.",
  ),
});

export type CreatorIntelligence = z.infer<typeof CreatorIntelligenceSchema>;

export const MarketResearchItemSchema = z.object({
  title: z.string().trim().min(1),
  url: z.string().trim().min(1),
  excerpt: z.string().trim().min(1),
  listedPriceInr: z.number().int().positive().optional(),
  dateRetrieved: z.string().trim().min(1),
  category: z.enum([
    "comparable_products",
    "audience_problems",
    "market_positioning",
    "differentiation",
  ]),
  observationType: z.enum(["observed", "externally_researched"]),
});

export type MarketResearchItem = z.infer<typeof MarketResearchItemSchema>;

export const MarketResearchBriefSchema = z.object({
  status: z.enum(["researched", "unavailable", "insufficient"]),
  researchAvailable: z.boolean(),
  queries: z.array(z.string()),
  items: z.array(MarketResearchItemSchema).max(16).default([]),
  warnings: z.array(z.string()).default([]),
  summary: z.string(),
  dateRetrieved: z.string().trim().min(1),
});

export type MarketResearchBrief = z.infer<typeof MarketResearchBriefSchema>;

export const OpportunityScoreBreakdownSchema = z.object({
  expertiseFit: z.number().int().min(1).max(5),
  audienceProblemRelevance: z.number().int().min(1).max(5),
  evidenceStrength: z.number().int().min(1).max(5),
  deliveryFeasibility: z.number().int().min(1).max(5),
  marketDifferentiation: z.number().int().min(1).max(5),
  pricingAccessibility: z.number().int().min(1).max(5),
  weightedTotal: z.number().min(1).max(5),
  explanations: z.object({
    expertiseFit: z.string().trim().min(1),
    audienceProblemRelevance: z.string().trim().min(1),
    evidenceStrength: z.string().trim().min(1),
    deliveryFeasibility: z.string().trim().min(1),
    marketDifferentiation: z.string().trim().min(1),
    pricingAccessibility: z.string().trim().min(1),
  }),
});

export type OpportunityScoreBreakdown = z.infer<
  typeof OpportunityScoreBreakdownSchema
>;

const score1to5 = z.preprocess((value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}, z.number().int().min(1).max(5));

/** Require a real positive INR amount — do not invent ₹499 when the model omits price. */
const positiveInr = z.preprocess((value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return value;
  return Math.round(n);
}, z.number().int().positive());

const requiredLiveString = z.string().trim().min(3);

function coerceFormat(value: unknown): (typeof PRODUCT_FORMATS)[number] {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  const exact = PRODUCT_FORMATS.find((f) => f === raw);
  if (exact) return exact;
  if (raw.includes("ebook") || raw.includes("pdf") || raw.includes("guide")) {
    return "ebook";
  }
  if (raw.includes("template") || raw.includes("checklist") || raw.includes("sheet")) {
    return "template pack";
  }
  if (raw.includes("workshop") || raw.includes("webinar")) return "workshop";
  if (raw.includes("cohort") || raw.includes("group")) return "cohort course";
  if (raw.includes("1:1") || raw.includes("call") || raw.includes("consult")) {
    return "1:1 call";
  }
  if (raw.includes("community") || raw.includes("discord")) return "community";
  if (raw.includes("mini")) return "mini-course";
  return "mini-course";
}

const DEFAULT_SCORE_EXPLANATIONS = {
  expertiseFit: "Fits topics the creator already shares.",
  audienceProblemRelevance: "Addresses a beginner need visible in their niche.",
  evidenceStrength: "Grounded in the creator material available.",
  deliveryFeasibility: "Looks deliverable with current demonstrated skills.",
  marketDifferentiation: "Differentiation depends on available market signals.",
  pricingAccessibility: "Priced for accessible INR entry-level buyers.",
};

/** Rich opportunity shape from Stage C LLM (before server validation). */
export const IntelligenceOpportunityAiSchema = z.object({
  // Critical commercial fields must come from the model — no invented fillers.
  productName: requiredLiveString,
  format: z.preprocess(coerceFormat, z.enum(PRODUCT_FORMATS)),
  whoWouldBuy: requiredLiveString,
  problemSolved: requiredLiveString,
  customerOutcome: requiredLiveString,
  whySuitable: requiredLiveString,
  creatorEvidence: z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => item && typeof item === "object");
  }, z.array(EvidenceRefSchema).max(5)),
  deliverables: z.preprocess((value) => {
    if (!Array.isArray(value)) return value;
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 6);
  }, z.array(z.string().trim().min(1)).min(2).max(6)),
  suggestedPriceInr: positiveInr,
  priceInr: z.object({
    min: positiveInr,
    max: positiveInr,
    rationale: z.string().trim().min(8),
  }),
  // Default honest; server upgrades to researched_comparables only with real findings.
  pricingBasis: z.preprocess((value) => {
    const raw = String(value || "").toLowerCase();
    return raw.includes("research") || raw.includes("comparable")
      ? "researched_comparables"
      : "ai_estimate";
  }, z.enum(["researched_comparables", "ai_estimate"]).default("ai_estimate")),
  marketComparison: requiredSoftString(
    "Limited public comparables were available for a direct benchmark.",
  ),
  differentiation: requiredSoftString(
    "Practical, creator-specific framing rather than generic advice.",
  ),
  creationEffort: z.preprocess((value) => {
    const raw = String(value || "").toLowerCase();
    if (raw === "low" || raw === "high" || raw === "medium") return raw;
    return "medium";
  }, z.enum(CREATION_EFFORT_LEVELS)),
  assumptions: z.preprocess((value) => {
    const list = Array.isArray(value)
      ? value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];
    return list.length
      ? list
      : ["Buyer interest depends on the creator's existing audience trust."];
  }, z.array(z.string().trim().min(1)).min(1).max(5)),
  confidence: z.preprocess((value) => {
    const raw = String(value || "").toLowerCase();
    if (raw === "low" || raw === "high" || raw === "medium") return raw;
    return "medium";
  }, z.enum(CONFIDENCE_LEVELS)),
  marketEvidenceIndexes: z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => Number(item))
      .filter((n) => Number.isInteger(n) && n >= 0)
      .slice(0, 4);
  }, z.array(z.number().int().nonnegative()).max(4)),
  scores: z.preprocess(
    (value) => (value && typeof value === "object" ? value : {}),
    z.object({
      expertiseFit: score1to5,
      audienceProblemRelevance: score1to5,
      evidenceStrength: score1to5,
      deliveryFeasibility: score1to5,
      marketDifferentiation: score1to5,
      pricingAccessibility: score1to5,
      explanations: z.preprocess((value) => {
        const base =
          value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : {};
        return {
          expertiseFit:
            base.expertiseFit || DEFAULT_SCORE_EXPLANATIONS.expertiseFit,
          audienceProblemRelevance:
            base.audienceProblemRelevance ||
            DEFAULT_SCORE_EXPLANATIONS.audienceProblemRelevance,
          evidenceStrength:
            base.evidenceStrength ||
            DEFAULT_SCORE_EXPLANATIONS.evidenceStrength,
          deliveryFeasibility:
            base.deliveryFeasibility ||
            DEFAULT_SCORE_EXPLANATIONS.deliveryFeasibility,
          marketDifferentiation:
            base.marketDifferentiation ||
            DEFAULT_SCORE_EXPLANATIONS.marketDifferentiation,
          pricingAccessibility:
            base.pricingAccessibility ||
            DEFAULT_SCORE_EXPLANATIONS.pricingAccessibility,
        };
      }, z.object({
        expertiseFit: requiredSoftString(
          DEFAULT_SCORE_EXPLANATIONS.expertiseFit,
        ),
        audienceProblemRelevance: requiredSoftString(
          DEFAULT_SCORE_EXPLANATIONS.audienceProblemRelevance,
        ),
        evidenceStrength: requiredSoftString(
          DEFAULT_SCORE_EXPLANATIONS.evidenceStrength,
        ),
        deliveryFeasibility: requiredSoftString(
          DEFAULT_SCORE_EXPLANATIONS.deliveryFeasibility,
        ),
        marketDifferentiation: requiredSoftString(
          DEFAULT_SCORE_EXPLANATIONS.marketDifferentiation,
        ),
        pricingAccessibility: requiredSoftString(
          DEFAULT_SCORE_EXPLANATIONS.pricingAccessibility,
        ),
      })),
    }),
  ),
  storefrontPath: requiredSoftString(
    "Feature on the storefront with a clear INR price and preview of deliverables.",
  ),
});

export const IntelligenceOpportunitiesAiSchema = z.object({
  opportunities: z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => item && typeof item === "object");
  }, z.array(IntelligenceOpportunityAiSchema).min(1).max(3)),
});

export const ValidationReportSchema = z.object({
  ok: z.boolean(),
  issues: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  followUpQuestion: z.string().trim().optional(),
});

export type ValidationReport = z.infer<typeof ValidationReportSchema>;

export const RESOURCE_LIMITS = {
  images: 5,
  urls: 3,
  documents: 3,
  textBlocks: 3,
} as const;
