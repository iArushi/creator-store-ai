import { z } from "zod";

export const NICHE_OPTIONS = [
  "Fitness",
  "Cooking",
  "Finance",
  "Exam prep",
  "Astrology",
  "Fashion",
  "Design",
  "Education",
  "Other",
] as const;

export type NicheOption = (typeof NICHE_OPTIONS)[number];

export const LANGUAGE_OPTIONS = ["English", "Hinglish", "Hindi"] as const;
export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];

export const GOAL_OPTIONS = [
  "Help me figure out what to sell",
  "Earn from existing expertise",
  "Build a digital product business",
  "Offer personalised services",
  "Build a learning community",
] as const;

export type GoalOption = (typeof GOAL_OPTIONS)[number];

export const SHARING_STYLES = [
  "Tips and tutorials",
  "Personal experiences",
  "Things I've learned",
  "Product recommendations",
  "How-to guides",
  "Daily routines",
  "Opinions and insights",
  "Something else",
] as const;

export type SharingStyle = (typeof SHARING_STYLES)[number];

export const ContentInsightsSchema = z.object({
  recurringThemes: z.array(z.string().trim().min(1)).max(8).default([]),
  topicsDiscussed: z.array(z.string().trim().min(1)).max(8).default([]),
  expertiseDemonstrated: z.array(z.string().trim().min(1)).max(8).default([]),
  problemsAddressed: z.array(z.string().trim().min(1)).max(8).default([]),
  potentialAudienceNeeds: z.array(z.string().trim().min(1)).max(8).default([]),
  observedNotes: z.array(z.string().trim().min(1)).max(8).default([]),
  inferredNotes: z.array(z.string().trim().min(1)).max(8).default([]),
  summary: z.string().trim().min(1),
});

export type ContentInsights = z.infer<typeof ContentInsightsSchema>;

/** Compact intelligence card for onboarding UI (not the full Stage A dossier). */
export const IntelligenceBriefSchema = z.object({
  summary: z.string().trim().min(1),
  mainNiche: z.string().trim().min(1),
  expertise: z.array(z.string().trim().min(1)).max(6).default([]),
  themes: z.array(z.string().trim().min(1)).max(6).default([]),
  knowledgeAssets: z.array(z.string().trim().min(1)).max(6).default([]),
  audienceProblems: z.array(z.string().trim().min(1)).max(6).default([]),
  needsConfirmation: z.array(z.string().trim().min(1)).max(4).default([]),
  observed: z.array(z.string().trim().min(1)).max(6).default([]),
  inferred: z.array(z.string().trim().min(1)).max(6).default([]),
  insufficientEvidence: z.boolean().default(false),
  followUpQuestion: z.string().trim().optional(),
});

export type IntelligenceBrief = z.infer<typeof IntelligenceBriefSchema>;

export const CreatorResourceClientSchema = z.object({
  id: z.string().trim().min(1),
  type: z.enum(["image", "text", "url", "document"]),
  title: z.string().trim().max(200).optional(),
  filename: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(120).optional(),
  url: z.string().trim().url().optional(),
  text: z.string().trim().max(20_000).optional(),
  dataUrl: z.string().trim().max(8_000_000).optional(),
  previewUrl: z.string().trim().optional(),
});

export type CreatorResourceClient = z.infer<typeof CreatorResourceClientSchema>;

export const GuidedAnswersSchema = z
  .object({
    whatTheyDo: z.enum(NICHE_OPTIONS),
    customWhatTheyDo: z.string().trim().optional(),
    /** Multi-select: what they naturally love sharing */
    sharingStyles: z.array(z.string().trim().min(1)).max(8).default([]),
    customSharingStyle: z.string().trim().optional(),
    /** Concrete: what people ask them about */
    peopleAskAbout: z.string().trim().optional().default(""),
    /** Optional: what they enjoy helping with */
    enjoyHelpingWith: z.string().trim().optional().default(""),
    /** Set when they used conversational discovery */
    usedConversationDiscovery: z.boolean().default(false),
    conversationSummary: z.string().trim().optional(),
    /** Vision analysis of uploaded posts/captions/screenshots */
    contentInsights: ContentInsightsSchema.optional(),
    /** Raw resources retained for Stage A/B/C (images, urls, docs, text) */
    resources: z.array(CreatorResourceClientSchema).max(11).optional(),
    /**
     * Derived synthesis fields (filled client/server for analyse-profile).
     * Kept for compatibility with existing prompts.
     */
    expertise: z.string().trim().min(3, "Add a bit more about what you share."),
    whoTheyHelp: z.string().trim().min(3, "Add a bit more about who you help."),
    audienceComesFor: z
      .string()
      .trim()
      .min(3, "Add a bit more about what people come to you for."),
    instagramHandle: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.whatTheyDo === "Other" && !value.customWhatTheyDo?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["customWhatTheyDo"],
        message: "Please describe what you do.",
      });
    }
    const hasSharing =
      value.sharingStyles.length > 0 ||
      Boolean(value.customSharingStyle?.trim()) ||
      value.usedConversationDiscovery ||
      Boolean(value.contentInsights?.summary);
    if (!hasSharing) {
      ctx.addIssue({
        code: "custom",
        path: ["sharingStyles"],
        message: "Pick what you love sharing, or use Help me figure it out.",
      });
    }
    if (
      value.sharingStyles.includes("Something else") &&
      !value.customSharingStyle?.trim() &&
      !value.usedConversationDiscovery
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customSharingStyle"],
        message: "Tell us what else you love sharing.",
      });
    }
  });

export type GuidedAnswers = z.infer<typeof GuidedAnswersSchema>;

/**
 * AI brand synthesis shown on the confirmation screen.
 * Built from creator-provided answers — never invented Instagram facts.
 */
export const CreatorProfileSchema = z.object({
  positioningStatement: z
    .string()
    .trim()
    .min(1, "Creator identity is required."),
  expertiseTags: z
    .array(z.string().trim().min(1))
    .min(2, "Add at least two expertise tags.")
    .max(8),
  potentialAudience: z
    .string()
    .trim()
    .min(1, "Potential audience is required."),
  contentValue: z.string().trim().min(1, "Content value is required."),
  potentialPositioning: z
    .string()
    .trim()
    .min(1, "Potential positioning is required."),
  /** Grounding note: what this analysis is based on */
  insightBasis: z.string().trim().min(1),
  /** Observed from creator answers / content — not guessed */
  observedSignals: z.array(z.string().trim().min(1)).max(8).default([]),
  /** AI inferences — must be labelled as such in the UI */
  inferredSignals: z.array(z.string().trim().min(1)).max(8).default([]),
  /** True when AI lacks enough signal and should not overclaim */
  needsClarification: z.boolean().default(false),
  clarificationPrompt: z.string().trim().optional(),
  /** Compact Stage A brief for discovery UI */
  intelligenceBrief: IntelligenceBriefSchema.optional(),
});

export type CreatorProfile = z.infer<typeof CreatorProfileSchema>;

export const QuickDescriptionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(12, "Add a short description of what you do (at least a sentence).")
    .max(600, "Keep it under 600 characters."),
  instagramHandle: z.string().trim().optional(),
});

export type QuickDescription = z.infer<typeof QuickDescriptionSchema>;

export const AnalyseProfileRequestSchema = z.object({
  source: z.enum(["guided", "instagram", "instagram_connected", "description"]),
  instagramHandle: z.string().trim().optional(),
  description: z.string().trim().optional(),
  language: z.enum(LANGUAGE_OPTIONS).optional(),
  guided: GuidedAnswersSchema.optional(),
  /** Optional creator resources for Stage A intelligence */
  resources: z.array(CreatorResourceClientSchema).max(11).optional(),
  /** Optional client-provided snapshot; server prefers live session fetch when connected */
  useConnectedSession: z.boolean().optional(),
});

export type AnalyseProfileRequest = z.infer<typeof AnalyseProfileRequestSchema>;

export const AnalyseProfileResponseSchema = z.object({
  profile: CreatorProfileSchema,
  /** Full Stage A dossier — optional; used to skip re-extraction later */
  intelligence: z.unknown().optional(),
});

export type AnalyseProfileResponse = z.infer<
  typeof AnalyseProfileResponseSchema
>;

export const CreatorGoalsSchema = z.object({
  goals: z
    .array(z.enum(GOAL_OPTIONS))
    .min(1, "Pick at least one goal to continue."),
});

export type CreatorGoals = z.infer<typeof CreatorGoalsSchema>;

export const PRODUCT_FORMATS = [
  "ebook",
  "cohort course",
  "1:1 call",
  "community",
  "template pack",
  "workshop",
  "mini-course",
] as const;

export type ProductFormat = (typeof PRODUCT_FORMATS)[number];

export const CREATION_EFFORT_LEVELS = ["low", "medium", "high"] as const;
export type CreationEffort = (typeof CREATION_EFFORT_LEVELS)[number];

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const OpportunityEvidenceSchema = z.object({
  finding: z.string().trim().min(1),
  sourceTitle: z.string().trim().min(1),
  sourceUrl: z.string().trim().min(1),
  excerpt: z.string().trim().min(1),
  category: z.enum([
    "audience_problems",
    "comparable_products",
    "market_positioning",
  ]),
  observationType: z.enum(["observed", "inferred"]),
});

export type OpportunityEvidence = z.infer<typeof OpportunityEvidenceSchema>;

export const OpportunityScoresSchema = z.object({
  expertiseFit: z.number().int().min(1).max(5),
  audienceProblemRelevance: z.number().int().min(1).max(5),
  /** @deprecated Prefer evidenceStrength + marketDifferentiation; kept for UI compat */
  marketEvidence: z.number().int().min(1).max(5),
  evidenceStrength: z.number().int().min(1).max(5).optional(),
  deliveryFeasibility: z.number().int().min(1).max(5),
  marketDifferentiation: z.number().int().min(1).max(5).optional(),
  pricingAccessibility: z.number().int().min(1).max(5),
  weightedTotal: z.number().min(1).max(5),
  reasoning: z.string().trim().min(1),
});

export type OpportunityScores = z.infer<typeof OpportunityScoresSchema>;

export const MonetisationOpportunitySchema = z.object({
  id: z.string().trim().min(1).optional(),
  productName: z.string().trim().min(1),
  format: z.enum(PRODUCT_FORMATS).default("ebook"),
  /** Target audience (kept as whoWouldBuy for storefront compatibility) */
  whoWouldBuy: z.string().trim().min(1),
  problemSolved: z.string().trim().min(1),
  customerOutcome: z
    .string()
    .trim()
    .min(1)
    .default("A clearer next step the buyer can apply immediately."),
  whySuitable: z.string().trim().min(1),
  deliverables: z.array(z.string().trim().min(1)).min(1).default([
    "Core resource or session",
  ]),
  creationEffort: z.enum(CREATION_EFFORT_LEVELS).default("medium"),
  suggestedPriceInr: z.number().int().positive().optional(),
  priceInr: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
    rationale: z.string().trim().min(1),
  }),
  pricingBasis: z
    .enum(["researched_comparables", "ai_estimate"])
    .default("ai_estimate"),
  marketComparison: z
    .string()
    .trim()
    .min(1)
    .default("Limited public comparables were available for a direct benchmark."),
  evidence: z.array(OpportunityEvidenceSchema).default([]),
  assumptions: z.array(z.string().trim().min(1)).default([
    "Buyer interest depends on the creator's existing audience trust.",
  ]),
  confidence: z.enum(CONFIDENCE_LEVELS).default("medium"),
  scores: OpportunityScoresSchema.optional(),
  storefrontPath: z.string().trim().min(1),
});

export type MonetisationOpportunity = z.infer<
  typeof MonetisationOpportunitySchema
>;

export const ResearchMetaSchema = z.object({
  mode: z.enum(["external_research", "ai_estimate_only"]),
  status: z.enum(["researched", "unavailable", "insufficient"]),
  message: z.string(),
  queriesExecuted: z.array(z.string()),
  findingCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()).default([]),
});

export type ResearchMeta = z.infer<typeof ResearchMetaSchema>;

export const GenerateOpportunitiesRequestSchema = z.object({
  profile: CreatorProfileSchema,
  goals: z.array(z.enum(GOAL_OPTIONS)).min(1),
  instagramHandle: z.string().trim().optional(),
  niche: z.string().trim().optional(),
  language: z.string().trim().optional(),
  resources: z.array(CreatorResourceClientSchema).max(11).optional(),
  guidedContext: z
    .object({
      niche: z.string().optional(),
      sharingStyles: z.array(z.string()).optional(),
      peopleAskAbout: z.string().optional(),
      enjoyHelpingWith: z.string().optional(),
      conversationSummary: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  /** Pass Stage A output from analyse-profile to avoid a second extraction */
  existingIntelligence: z.unknown().optional(),
  /** Replace only this index; preserve the rest from existingOpportunities */
  regenerateIndex: z.number().int().min(0).max(2).optional(),
  existingOpportunities: z
    .array(MonetisationOpportunitySchema)
    .max(3)
    .optional(),
});

export type GenerateOpportunitiesRequest = z.infer<
  typeof GenerateOpportunitiesRequestSchema
>;

/** Strict shape expected from the LLM (before server-side score finalisation). */
export const MonetisationOpportunityAiSchema = z.object({
  productName: z.string().trim().min(1),
  format: z.enum(PRODUCT_FORMATS),
  whoWouldBuy: z.string().trim().min(1),
  problemSolved: z.string().trim().min(1),
  customerOutcome: z.string().trim().min(1),
  whySuitable: z.string().trim().min(1),
  deliverables: z.array(z.string().trim().min(1)).min(2).max(5),
  creationEffort: z.enum(CREATION_EFFORT_LEVELS),
  suggestedPriceInr: z.number().int().positive(),
  priceInr: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
    rationale: z.string().trim().min(1),
  }),
  pricingBasis: z.enum(["researched_comparables", "ai_estimate"]),
  marketComparison: z.string().trim().min(1),
  evidenceIndexes: z
    .array(z.number().int().nonnegative())
    .max(4)
    .default([]),
  assumptions: z.array(z.string().trim().min(1)).min(1).max(4),
  confidence: z.enum(CONFIDENCE_LEVELS),
  scores: z.object({
    expertiseFit: z.number().int().min(1).max(5),
    audienceProblemRelevance: z.number().int().min(1).max(5),
    marketEvidence: z.number().int().min(1).max(5),
    deliveryFeasibility: z.number().int().min(1).max(5),
    pricingAccessibility: z.number().int().min(1).max(5),
    reasoning: z.string().trim().min(1),
  }),
  storefrontPath: z.string().trim().min(1),
});

export const GenerateOpportunitiesAiSchema = z.object({
  opportunities: z.array(MonetisationOpportunityAiSchema).min(1).max(3),
});

export const GenerateOpportunitiesResponseSchema = z.object({
  opportunities: z.array(MonetisationOpportunitySchema).length(3),
  research: ResearchMetaSchema,
  intelligenceBrief: IntelligenceBriefSchema.optional(),
  validationWarnings: z.array(z.string()).default([]),
  followUpQuestion: z.string().trim().optional(),
});

export type GenerateOpportunitiesResponse = z.infer<
  typeof GenerateOpportunitiesResponseSchema
>;

export function resolveWhatTheyDo(answers: GuidedAnswers): string {
  if (answers.whatTheyDo === "Other") {
    return answers.customWhatTheyDo?.trim() || "Other";
  }
  return answers.whatTheyDo;
}

export const COVER_MOTIFS = [
  "ledger",
  "compass",
  "notebook",
  "spark",
  "grid",
  "wave",
  "stack",
] as const;

export type CoverMotif = (typeof COVER_MOTIFS)[number];

/** AI product fields before an id is assigned */
export const StorefrontProductFieldsSchema = z.object({
  title: z.string().trim().min(1),
  format: z.enum(PRODUCT_FORMATS),
  description: z
    .string()
    .trim()
    .min(1)
    .describe("Concise 1-2 sentence product pitch"),
  targetAudience: z.string().trim().min(1),
  problemSolved: z.string().trim().min(1),
  outcome: z.string().trim().min(1),
  deliverables: z
    .array(z.string().trim().min(1))
    .min(2)
    .max(5),
  priceInr: z.number().int().positive(),
  priceRationale: z.string().trim().min(1),
  whyFitsCreator: z.string().trim().min(1),
  featured: z.boolean().default(false),
  coverMotif: z.enum(COVER_MOTIFS).default("notebook"),
});

export const StorefrontProductSchema = StorefrontProductFieldsSchema.extend({
  id: z.string().min(1),
});

export type StorefrontProduct = z.infer<typeof StorefrontProductSchema>;

export const StorefrontSchema = z.object({
  slug: z.string().min(1),
  creatorName: z.string().trim().min(1),
  handle: z.string().trim().optional(),
  niche: z.string().trim().min(1).default("Creator"),
  headline: z.string().trim().min(1),
  bio: z.string().trim().min(1),
  intro: z
    .string()
    .trim()
    .min(1)
    .default(
      "I create practical resources for people who want clearer next steps.",
    ),
  expertiseTags: z.array(z.string().trim().min(1)).max(8).default([]),
  /** Only a real uploaded/retrieved photo URL — never invent images */
  profileImageUrl: z.string().url().optional(),
  products: z.array(StorefrontProductSchema).min(2).max(4),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Storefront = z.infer<typeof StorefrontSchema>;

export const GenerateStorefrontRequestSchema = z.object({
  profile: CreatorProfileSchema,
  goals: z.array(z.enum(GOAL_OPTIONS)).min(1),
  selectedOpportunity: MonetisationOpportunitySchema,
  instagramHandle: z.string().trim().optional(),
  creatorName: z.string().trim().optional(),
  niche: z.string().trim().optional(),
  language: z.enum(LANGUAGE_OPTIONS).optional(),
  /** Pass through only when a real Instagram/session photo exists */
  profileImageUrl: z.string().url().optional(),
});

export type GenerateStorefrontRequest = z.infer<
  typeof GenerateStorefrontRequestSchema
>;

export const GenerateStorefrontAiSchema = z.object({
  creatorName: z.string().trim().min(1),
  niche: z.string().trim().min(1),
  headline: z.string().trim().min(1),
  bio: z.string().trim().min(1),
  intro: z.string().trim().min(1),
  products: z.array(StorefrontProductFieldsSchema).min(2).max(4),
});

export const RegenerateStorefrontRequestSchema = z.object({
  target: z.enum(["all", "bio", "products", "product"]),
  productId: z.string().optional(),
  profileContext: CreatorProfileSchema.optional(),
});

export type RegenerateStorefrontRequest = z.infer<
  typeof RegenerateStorefrontRequestSchema
>;

