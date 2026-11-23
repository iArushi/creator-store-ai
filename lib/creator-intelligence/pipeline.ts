import { findForbiddenClaims } from "@/lib/ai-guardrails";
import {
  ingestCreatorResources,
  makeGuidedAnswerSources,
  makeInstagramSources,
} from "@/lib/creator-intelligence/ingest";
import { intelligenceToCreatorProfile } from "@/lib/creator-intelligence/map-to-profile";
import { extractCreatorIntelligence } from "@/lib/creator-intelligence/stage-a";
import { researchCreatorMarket } from "@/lib/creator-intelligence/stage-b";
import { generateIntelligenceOpportunities } from "@/lib/creator-intelligence/stage-c";
import { validateOpportunitySet } from "@/lib/creator-intelligence/validate";
import type {
  CreatorIntelligence,
  CreatorResourceInput,
  MarketResearchBrief,
  NormalisedSource,
  ValidationReport,
} from "@/lib/creator-intelligence/schemas";
import type {
  CreatorProfile,
  MonetisationOpportunity,
  ResearchMeta,
} from "@/lib/schemas";

export type IntelligencePipelineResult = {
  sources: NormalisedSource[];
  intelligence: CreatorIntelligence;
  research: MarketResearchBrief;
  opportunities: MonetisationOpportunity[];
  validation: ValidationReport;
  researchMeta: ResearchMeta;
  profileDraft?: CreatorProfile;
  ingestNotes: string[];
};

export type IntelligencePipelineInput = {
  resources?: CreatorResourceInput[];
  guided?: {
    niche?: string;
    sharingStyles?: string[];
    peopleAskAbout?: string;
    enjoyHelpingWith?: string;
    conversationSummary?: string;
    description?: string;
  };
  instagram?: {
    username?: string;
    name?: string;
    bio?: string;
    captions?: string[];
  };
  existingProfile?: CreatorProfile;
  existingIntelligence?: CreatorIntelligence;
  existingSources?: NormalisedSource[];
  goals: string[];
  language?: string;
  nicheHint?: string;
  mode?: "all" | "one";
  preserveSummary?: string;
  /** When true, skip Stage C (useful for analyse-profile). */
  skipOpportunities?: boolean;
};

function toResearchMeta(brief: MarketResearchBrief): ResearchMeta {
  return {
    mode: brief.researchAvailable ? "external_research" : "ai_estimate_only",
    status: brief.status,
    message: brief.summary,
    queriesExecuted: brief.queries,
    findingCount: brief.items.length,
    warnings: brief.warnings,
  };
}

/**
 * Full evidence-driven pipeline: ingest → Stage A → Stage B → Stage C → validate.
 */
export async function runCreatorIntelligencePipeline(
  input: IntelligencePipelineInput,
): Promise<IntelligencePipelineResult> {
  const ingestNotes: string[] = [];

  let sources: NormalisedSource[] = [...(input.existingSources || [])];

  if (input.resources?.length) {
    const ingested = await ingestCreatorResources(input.resources);
    sources = [...sources, ...ingested.sources];
    ingestNotes.push(...ingested.notes);
  }

  if (input.guided) {
    sources = [...sources, ...makeGuidedAnswerSources(input.guided)];
  }

  if (input.instagram) {
    sources = [...sources, ...makeInstagramSources(input.instagram)];
  }

  // Deduplicate by sourceId (keep first)
  const seen = new Set<string>();
  sources = sources.filter((s) => {
    if (seen.has(s.sourceId)) return false;
    seen.add(s.sourceId);
    return true;
  });

  const intelligence =
    input.existingIntelligence ||
    (await extractCreatorIntelligence({
      sources,
      language: input.language,
      nicheHint:
        input.nicheHint ||
        input.guided?.niche ||
        input.existingProfile?.expertiseTags?.[0],
    }));

  const profileDraft = intelligenceToCreatorProfile(intelligence, {
    existing: input.existingProfile,
    nicheHint:
      input.nicheHint ||
      input.guided?.niche ||
      input.existingProfile?.expertiseTags?.[0],
  });

  if (input.skipOpportunities) {
    const emptyResearch: MarketResearchBrief = {
      status: "unavailable",
      researchAvailable: false,
      queries: [],
      items: [],
      warnings: [],
      summary: "Market research deferred until opportunity generation.",
      dateRetrieved: new Date().toISOString(),
    };
    return {
      sources,
      intelligence,
      research: emptyResearch,
      opportunities: [],
      validation: {
        ok: !intelligence.insufficientEvidence,
        issues: intelligence.insufficientEvidence
          ? ["Need more creator evidence."]
          : [],
        warnings: ingestNotes,
        followUpQuestion: intelligence.followUpQuestion,
      },
      researchMeta: toResearchMeta(emptyResearch),
      profileDraft,
      ingestNotes,
    };
  }

  const research = await researchCreatorMarket({ intelligence });

  let opportunities: MonetisationOpportunity[] = [];
  if (!intelligence.insufficientEvidence) {
    opportunities = await generateIntelligenceOpportunities({
      intelligence,
      research,
      sources,
      goals: input.goals,
      language: input.language,
      mode: input.mode,
      preserveSummary: input.preserveSummary,
    });
  }

  let validation = validateOpportunitySet({
    intelligence,
    research,
    sources,
    opportunities,
  });

  // Drop offers that still carry forbidden / invented claims after scrubbing.
  if (!validation.ok && opportunities.length > 0) {
    const before = opportunities.length;
    opportunities = opportunities.filter((opportunity) => {
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
      return findForbiddenClaims(blob).length === 0;
    });
    if (opportunities.length !== before) {
      validation = validateOpportunitySet({
        intelligence,
        research,
        sources,
        opportunities,
      });
    }
  }

  // Soft-fix: if pricing claimed researched without evidence, downgrade already handled in stage-c.
  // If validation fails hard on insufficient evidence, opportunities stay empty.
  if (!validation.ok && intelligence.insufficientEvidence) {
    opportunities = [];
  }

  return {
    sources,
    intelligence,
    research,
    opportunities,
    validation,
    researchMeta: {
      ...toResearchMeta(research),
      warnings: [
        ...research.warnings,
        ...validation.warnings,
        ...validation.issues,
        ...ingestNotes,
      ].slice(0, 12),
    },
    profileDraft,
    ingestNotes,
  };
}
