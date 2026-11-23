import { randomBytes } from "crypto";
import {
  ANTI_HALLUCINATION_RULES,
  scrubHypePhrases,
} from "@/lib/ai-guardrails";
import { generateJsonWithOpenAI } from "@/lib/openai";
import {
  IntelligenceOpportunitiesAiSchema,
  IntelligenceOpportunityAiSchema,
  type CreatorIntelligence,
  type MarketResearchBrief,
  type NormalisedSource,
} from "@/lib/creator-intelligence/schemas";
import {
  evidenceStrengthCap,
  finalizeIntelligenceScores,
  marketDifferentiationCap,
} from "@/lib/creator-intelligence/scoring";
import {
  MonetisationOpportunitySchema,
  type MonetisationOpportunity,
  type OpportunityEvidence,
} from "@/lib/schemas";
import { z } from "zod";

const SYSTEM = `You are Stage C of an evidence-driven monetisation engine for Indian micro-creators.

You receive:
1) Confirmed creator intelligence with evidence
2) Market research items (may be empty)
3) Creator goals/constraints

Generate highly specific product opportunities grounded in demonstrated expertise.
Do NOT default to the same three formats for every creator.
Choose SuperProfile product types the creator can actually deliver from evidence:
digital files, 1-on-1 session, membership, event / webinar, locked content, or course.

Return ONLY JSON:
{ "opportunities": [ ... ] }

Each opportunity must include:
productName, format, whoWouldBuy, problemSolved, customerOutcome, whySuitable,
creatorEvidence[{sourceId,excerpt}], deliverables[], suggestedPriceInr,
priceInr{min,max,rationale}, pricingBasis, marketComparison, differentiation,
creationEffort, assumptions[], confidence, marketEvidenceIndexes[],
scores{expertiseFit,audienceProblemRelevance,evidenceStrength,deliveryFeasibility,marketDifferentiation,pricingAccessibility,explanations{...}},
storefrontPath

Hard rules:
- Prefer demonstrated expertise and delivery feasibility over speculation.
- Use creatorEvidence sourceIds only from provided sources.
- marketEvidenceIndexes only reference numbered market items. If research is weak, use [] and pricingBasis=ai_estimate.
- Never invent URLs, prices, demand, or competitor claims.
- Listed market prices are listings only — not sales proof.
- Scores are heuristic decision-support (1–5), not predictions of commercial success.
- marketDifferentiation must stay low when research is insufficient.
- Finance niches: educational framing only — no investment advice or return promises.
- Exam niches: no guaranteed selection/rank language.
- Fitness niches: do not call the creator a certified coach unless sources say so.
- Match LANGUAGE for creator-facing strings.

${ANTI_HALLUCINATION_RULES}`;

function intelligenceBlock(intel: CreatorIntelligence): string {
  const pick = (
    label: string,
    items: Array<{ insight: string; classification: string; confidence: string }>,
  ) =>
    items.length
      ? `${label}:\n${items
          .slice(0, 5)
          .map(
            (i) =>
              `- [${i.classification}/${i.confidence}] ${i.insight}`,
          )
          .join("\n")}`
      : `${label}: (none)`;

  return [
    `Main niche: ${intel.identity.mainNiche}`,
    `Positioning: ${intel.identity.potentialPositioning}`,
    `Summary: ${intel.summaryForCreator}`,
    pick("Topics", intel.identity.consistentTopics),
    pick("Subjects explained", intel.expertise.subjectsExplained),
    pick("Skills", intel.expertise.skillsDemonstrated),
    pick("Processes", intel.expertise.processesTaught),
    pick("Frameworks", intel.expertise.frameworksOrTechniques),
    pick("Content pillars", intel.content.contentPillars),
    pick("Audience problems", intel.audience.visibleProblems),
    pick("Needs addressed", intel.audience.needsAddressed),
    intel.knowledgeAssets.length
      ? `Knowledge assets:\n${intel.knowledgeAssets
          .slice(0, 6)
          .map((a) => `- ${a.assetType}: ${a.label} [${a.classification}]`)
          .join("\n")}`
      : "Knowledge assets: (none identified)",
    pick("Capable of delivering", intel.capabilities.capableOfDelivering),
    intel.audience.gapsRequiringConfirmation.length
      ? `Gaps to confirm: ${intel.audience.gapsRequiringConfirmation.join("; ")}`
      : "",
    `Insufficient evidence flag: ${intel.insufficientEvidence}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function marketBlock(brief: MarketResearchBrief): string {
  if (!brief.items.length) {
    return [
      "MARKET RESEARCH: none usable.",
      `Status: ${brief.status}`,
      brief.summary,
      "Do not invent citations. pricingBasis must be ai_estimate.",
    ].join("\n");
  }

  const numbered = brief.items
    .map(
      (item, index) =>
        `[${index}] (${item.category}) ${item.title}\nURL: ${item.url}\nExcerpt: ${item.excerpt}${
          item.listedPriceInr ? `\nListed INR (listing only): ${item.listedPriceInr}` : ""
        }`,
    )
    .join("\n\n");

  return [
    "MARKET RESEARCH ITEMS (cite via marketEvidenceIndexes only):",
    `Status: ${brief.status}`,
    brief.summary,
    "",
    numbered,
  ].join("\n");
}

function sourceIdList(sources: NormalisedSource[]): string {
  return sources
    .map((s) => `${s.sourceId} (${s.sourceType}) — ${s.title}`)
    .join("\n");
}

function mapMarketEvidence(
  indexes: number[] | undefined,
  brief: MarketResearchBrief,
): OpportunityEvidence[] {
  if (!indexes?.length || !brief.items.length) return [];
  const unique = [...new Set(indexes)].filter(
    (i) => i >= 0 && i < brief.items.length,
  );
  return unique.slice(0, 4).map((index) => {
    const item = brief.items[index];
    return {
      finding: `${item.category}: ${item.title}`,
      sourceTitle: item.title,
      sourceUrl: item.url,
      excerpt: item.excerpt,
      category:
        item.category === "differentiation"
          ? "market_positioning"
          : item.category === "comparable_products"
            ? "comparable_products"
            : item.category === "audience_problems"
              ? "audience_problems"
              : "market_positioning",
      observationType: "observed" as const,
    };
  });
}

function toMonetisationOpportunity(
  raw: z.infer<typeof IntelligenceOpportunityAiSchema>,
  brief: MarketResearchBrief,
  validSourceIds: Set<string>,
): MonetisationOpportunity {
  const creatorEvidence = (raw.creatorEvidence || []).filter((e) =>
    validSourceIds.has(e.sourceId),
  );
  const marketEvidence = mapMarketEvidence(raw.marketEvidenceIndexes, brief);

  const scores = finalizeIntelligenceScores(raw.scores, {
    evidenceStrength: evidenceStrengthCap({
      creatorEvidenceCount: creatorEvidence.length,
      marketEvidenceCount: marketEvidence.length,
      research: brief,
    }),
    marketDifferentiation: marketDifferentiationCap(brief),
  });

  // Never trust the model alone — researched label only with real findings.
  const pricingBasis =
    brief.researchAvailable &&
    marketEvidence.length > 0 &&
    raw.pricingBasis === "researched_comparables"
      ? "researched_comparables"
      : "ai_estimate";

  const priceMin = Math.min(raw.priceInr.min, raw.priceInr.max);
  const priceMax = Math.max(raw.priceInr.min, raw.priceInr.max);
  const suggested =
    raw.suggestedPriceInr || Math.round((priceMin + priceMax) / 2);

  // Bridge new score shape into existing OpportunityScoresSchema fields
  return MonetisationOpportunitySchema.parse({
    id: randomBytes(4).toString("hex"),
    productName: scrubHypePhrases(raw.productName),
    format: raw.format,
    whoWouldBuy: scrubHypePhrases(raw.whoWouldBuy),
    problemSolved: scrubHypePhrases(raw.problemSolved),
    customerOutcome: scrubHypePhrases(raw.customerOutcome),
    whySuitable: scrubHypePhrases(
      [
        raw.whySuitable,
        raw.differentiation ? `Differentiation: ${raw.differentiation}` : "",
        creatorEvidence.length
          ? `Creator evidence: ${creatorEvidence
              .map((e) => `${e.sourceId}`)
              .join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    ),
    deliverables: raw.deliverables.map((d) => scrubHypePhrases(d)),
    creationEffort: raw.creationEffort,
    suggestedPriceInr: Math.min(Math.max(suggested, priceMin), priceMax),
    priceInr: {
      min: priceMin,
      max: priceMax,
      rationale: scrubHypePhrases(raw.priceInr.rationale),
    },
    pricingBasis,
    marketComparison: scrubHypePhrases(raw.marketComparison),
    evidence: marketEvidence,
    assumptions: [
      ...raw.assumptions,
      ...creatorEvidence.map(
        (e) => `Creator source ${e.sourceId}: ${e.excerpt.slice(0, 120)}`,
      ),
    ].slice(0, 6),
    confidence:
      !brief.researchAvailable && raw.confidence === "high"
        ? "medium"
        : raw.confidence,
    scores: {
      expertiseFit: scores.expertiseFit,
      audienceProblemRelevance: scores.audienceProblemRelevance,
      marketEvidence: scores.marketDifferentiation,
      evidenceStrength: scores.evidenceStrength,
      deliveryFeasibility: scores.deliveryFeasibility,
      marketDifferentiation: scores.marketDifferentiation,
      pricingAccessibility: scores.pricingAccessibility,
      weightedTotal: scores.weightedTotal,
      reasoning: [
        scores.explanations.expertiseFit,
        scores.explanations.audienceProblemRelevance,
        scores.explanations.evidenceStrength,
        scores.explanations.deliveryFeasibility,
        scores.explanations.marketDifferentiation,
        scores.explanations.pricingAccessibility,
      ].join(" "),
    },
    storefrontPath: raw.storefrontPath,
    // Extended fields carried via optional passthrough if schema allows — stored in assumptions/whySuitable above
  });
}

async function requestOpportunities(input: {
  intelligence: CreatorIntelligence;
  research: MarketResearchBrief;
  sources: NormalisedSource[];
  goals: string[];
  language?: string;
  mode: "all" | "one";
  preserveSummary?: string;
  count: number;
  temperature: number;
}): Promise<z.infer<typeof IntelligenceOpportunityAiSchema>[]> {
  const user = [
    input.mode === "one"
      ? "Regenerate ONE distinct monetisation opportunity."
      : `Generate ${input.count} highly relevant monetisation opportunities.`,
    "",
    `LANGUAGE: ${input.language || "English"}`,
    `Goals: ${input.goals.join("; ")}`,
    "",
    "CREATOR INTELLIGENCE:",
    intelligenceBlock(input.intelligence),
    "",
    "VALID SOURCE IDS:",
    sourceIdList(input.sources),
    "",
    marketBlock(input.research),
    "",
    input.preserveSummary || "",
    "",
    "Every opportunity object must include productName, format, whoWouldBuy, problemSolved, customerOutcome, whySuitable, deliverables (2+), suggestedPriceInr, priceInr{min,max,rationale}, pricingBasis, marketComparison, differentiation, creationEffort, assumptions, confidence, scores, storefrontPath.",
    `Return JSON with opportunities array of length ${input.count}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const ai = await generateJsonWithOpenAI({
    system: SYSTEM,
    user,
    schema: IntelligenceOpportunitiesAiSchema,
    temperature: input.temperature,
  });

  return ai.opportunities.slice(0, input.count);
}

/**
 * Stage C — monetisation opportunity generation from intelligence + market research.
 */
export async function generateIntelligenceOpportunities(input: {
  intelligence: CreatorIntelligence;
  research: MarketResearchBrief;
  sources: NormalisedSource[];
  goals: string[];
  language?: string;
  mode?: "all" | "one";
  preserveSummary?: string;
}): Promise<MonetisationOpportunity[]> {
  const mode = input.mode || "all";
  const target = mode === "one" ? 1 : 3;
  const validIds = new Set(input.sources.map((s) => s.sourceId));

  let rawList: z.infer<typeof IntelligenceOpportunityAiSchema>[] = [];

  try {
    rawList = await requestOpportunities({
      ...input,
      mode,
      count: target,
      temperature: 0.35,
    });
  } catch (firstError) {
    // One lower-temperature retry with a stricter reminder — avoids hard UI failure.
    try {
      rawList = await requestOpportunities({
        ...input,
        mode,
        count: target,
        temperature: 0.2,
        preserveSummary: [
          input.preserveSummary || "",
          "Previous response failed validation. Return complete opportunity objects only.",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("Could not generate opportunities.");
    }
  }

  // If the model returned fewer than needed, request the remaining slots once.
  if (rawList.length < target) {
    const missing = target - rawList.length;
    const preserve = [
      "Already drafted (do not duplicate):",
      ...rawList.map(
        (item, index) =>
          `${index + 1}. ${item.productName} (${item.format}) — ${item.problemSolved}`,
      ),
      input.preserveSummary || "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const extra = await requestOpportunities({
        ...input,
        mode: missing === 1 ? "one" : "all",
        count: missing,
        temperature: 0.35,
        preserveSummary: preserve,
      });
      rawList = [...rawList, ...extra].slice(0, target);
    } catch {
      // Keep whatever we have; route will surface a friendly incomplete state if still short.
    }
  }

  return rawList
    .slice(0, target)
    .map((raw) => toMonetisationOpportunity(raw, input.research, validIds));
}
