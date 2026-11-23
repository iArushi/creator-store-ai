import { findForbiddenClaims } from "@/lib/ai-guardrails";
import {
  ValidationReportSchema,
  type CreatorIntelligence,
  type MarketResearchBrief,
  type NormalisedSource,
  type ValidationReport,
} from "@/lib/creator-intelligence/schemas";
import type { MonetisationOpportunity } from "@/lib/schemas";

function collectSourceIds(sources: NormalisedSource[]): Set<string> {
  return new Set(sources.map((s) => s.sourceId));
}

function nicheTokens(intelligence: CreatorIntelligence): string[] {
  const raw = [
    intelligence.identity.mainNiche,
    ...intelligence.identity.secondaryNiches,
    ...intelligence.expertise.subjectsExplained.map((i) => i.insight),
    ...intelligence.identity.consistentTopics.map((i) => i.insight),
  ]
    .join(" ")
    .toLowerCase();
  return [...new Set(raw.split(/[^a-z0-9]+/).filter((t) => t.length > 3))];
}

/**
 * Stage QC — validate opportunities against evidence and anti-hallucination rules.
 */
export function validateOpportunitySet(input: {
  intelligence: CreatorIntelligence;
  research: MarketResearchBrief;
  sources: NormalisedSource[];
  opportunities: MonetisationOpportunity[];
}): ValidationReport {
  const issues: string[] = [];
  const warnings: string[] = [];
  const sourceIds = collectSourceIds(input.sources);
  const tokens = nicheTokens(input.intelligence);
  const formats = new Set<string>();

  if (input.intelligence.insufficientEvidence) {
    return ValidationReportSchema.parse({
      ok: false,
      issues: ["Insufficient creator evidence for confident monetisation advice."],
      warnings,
      followUpQuestion:
        input.intelligence.followUpQuestion ||
        "What topic do people ask you about most often?",
    });
  }

  if (input.opportunities.length === 0) {
    issues.push("No opportunities were generated.");
  }

  for (const opportunity of input.opportunities) {
    formats.add(opportunity.format);

    const blob = [
      opportunity.productName,
      opportunity.problemSolved,
      opportunity.whySuitable,
      opportunity.whoWouldBuy,
      opportunity.customerOutcome,
      opportunity.marketComparison,
      ...(opportunity.deliverables || []),
      ...(opportunity.assumptions || []),
    ].join(" ");

    const forbidden = findForbiddenClaims(blob);
    if (forbidden.length) {
      issues.push(
        `“${opportunity.productName}” contains unsupported claims (${forbidden.slice(0, 2).join(", ")}).`,
      );
    }

    const nicheBlob = blob.toLowerCase();
    const nicheOverlap =
      tokens.length === 0 || tokens.some((token) => nicheBlob.includes(token));
    if (!nicheOverlap) {
      warnings.push(
        `“${opportunity.productName}” may not clearly match demonstrated niche language.`,
      );
    }

    if (!opportunity.deliverables.length) {
      issues.push(`“${opportunity.productName}” is missing concrete deliverables.`);
    } else if (
      opportunity.deliverables.some((d) => d.trim().split(/\s+/).length < 2)
    ) {
      warnings.push(
        `“${opportunity.productName}” has vague deliverables — prefer concrete buyer receipts.`,
      );
    }

    const priceOk =
      opportunity.priceInr.min > 0 &&
      opportunity.priceInr.max >= opportunity.priceInr.min &&
      (!opportunity.suggestedPriceInr ||
        (opportunity.suggestedPriceInr >= opportunity.priceInr.min &&
          opportunity.suggestedPriceInr <= opportunity.priceInr.max));
    if (!priceOk) {
      issues.push(`“${opportunity.productName}” has invalid INR pricing.`);
    }

    for (const evidence of opportunity.evidence) {
      try {
        new URL(evidence.sourceUrl);
      } catch {
        issues.push(
          `“${opportunity.productName}” cites an invalid market URL.`,
        );
      }
    }

    if (
      opportunity.pricingBasis === "researched_comparables" &&
      opportunity.evidence.length === 0
    ) {
      issues.push(
        `“${opportunity.productName}” claimed researched pricing without citations.`,
      );
    }

    if (
      !input.research.researchAvailable &&
      opportunity.scores &&
      opportunity.scores.marketEvidence > 2
    ) {
      warnings.push(
        `“${opportunity.productName}” market score was high without external research — expect capping.`,
      );
    }

    for (const assumption of opportunity.assumptions) {
      const match = assumption.match(/Creator source ([a-z0-9_]+)/i);
      if (match && !sourceIds.has(match[1])) {
        warnings.push(
          `“${opportunity.productName}” referenced unknown source ${match[1]}.`,
        );
      }
    }
  }

  if (formats.size === 1 && input.opportunities.length >= 3) {
    warnings.push(
      "All three opportunities share the same format — consider more format diversity.",
    );
  }

  const unsupportedAudience = input.intelligence.audience.potentialSegments.filter(
    (s) => s.classification === "inferred" || s.classification === "unverified",
  );
  if (unsupportedAudience.length) {
    warnings.push(
      "Some audience segments are hypotheses — confirm with the creator before treating as fact.",
    );
  }

  return ValidationReportSchema.parse({
    ok: issues.length === 0,
    issues,
    warnings,
    followUpQuestion: input.intelligence.followUpQuestion,
  });
}
