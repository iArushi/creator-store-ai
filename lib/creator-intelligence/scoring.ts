import type {
  MarketResearchBrief,
  OpportunityScoreBreakdown,
} from "@/lib/creator-intelligence/schemas";

const WEIGHTS = {
  expertiseFit: 0.22,
  audienceProblemRelevance: 0.2,
  evidenceStrength: 0.18,
  deliveryFeasibility: 0.15,
  marketDifferentiation: 0.12,
  pricingAccessibility: 0.13,
} as const;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

/** Cap market differentiation when external research is weak. */
export function marketDifferentiationCap(brief: MarketResearchBrief): number {
  if (!brief.researchAvailable || brief.status !== "researched") return 2;
  const comparable = brief.items.filter(
    (i) => i.category === "comparable_products",
  ).length;
  const diff = brief.items.filter((i) => i.category === "differentiation").length;
  if (comparable + diff === 0) return 2;
  if (comparable + diff < 3) return 3;
  return 5;
}

export function evidenceStrengthCap(args: {
  creatorEvidenceCount: number;
  marketEvidenceCount: number;
  research: MarketResearchBrief;
}): number {
  const creator = args.creatorEvidenceCount;
  if (creator === 0) return 2;
  if (creator === 1) return 3;
  if (!args.research.researchAvailable) return Math.min(4, 2 + creator);
  return Math.min(5, 3 + Math.min(args.marketEvidenceCount, 2));
}

export function finalizeIntelligenceScores(
  raw: OpportunityScoreBreakdown["explanations"] extends never
    ? never
    : {
        expertiseFit: number;
        audienceProblemRelevance: number;
        evidenceStrength: number;
        deliveryFeasibility: number;
        marketDifferentiation: number;
        pricingAccessibility: number;
        explanations: OpportunityScoreBreakdown["explanations"];
      },
  caps: {
    evidenceStrength: number;
    marketDifferentiation: number;
  },
): OpportunityScoreBreakdown {
  const expertiseFit = clampScore(raw.expertiseFit);
  const audienceProblemRelevance = clampScore(raw.audienceProblemRelevance);
  const evidenceStrength = Math.min(
    clampScore(raw.evidenceStrength),
    caps.evidenceStrength,
  );
  const deliveryFeasibility = clampScore(raw.deliveryFeasibility);
  const marketDifferentiation = Math.min(
    clampScore(raw.marketDifferentiation),
    caps.marketDifferentiation,
  );
  const pricingAccessibility = clampScore(raw.pricingAccessibility);

  const weightedTotal = Number(
    (
      expertiseFit * WEIGHTS.expertiseFit +
      audienceProblemRelevance * WEIGHTS.audienceProblemRelevance +
      evidenceStrength * WEIGHTS.evidenceStrength +
      deliveryFeasibility * WEIGHTS.deliveryFeasibility +
      marketDifferentiation * WEIGHTS.marketDifferentiation +
      pricingAccessibility * WEIGHTS.pricingAccessibility
    ).toFixed(2),
  );

  return {
    expertiseFit,
    audienceProblemRelevance,
    evidenceStrength,
    deliveryFeasibility,
    marketDifferentiation,
    pricingAccessibility,
    weightedTotal,
    explanations: raw.explanations,
  };
}
