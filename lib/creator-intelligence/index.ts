export {
  CreatorResourceInputSchema,
  CreatorIntelligenceSchema,
  NormalisedSourceSchema,
  MarketResearchBriefSchema,
  EvidencedInsightSchema,
  RESOURCE_LIMITS,
  type CreatorResourceInput,
  type CreatorIntelligence,
  type NormalisedSource,
  type MarketResearchBrief,
  type EvidencedInsight,
  type ValidationReport,
} from "@/lib/creator-intelligence/schemas";

export {
  ingestCreatorResources,
  makeGuidedAnswerSources,
  makeInstagramSources,
} from "@/lib/creator-intelligence/ingest";

export { extractCreatorIntelligence } from "@/lib/creator-intelligence/stage-a";
export { researchCreatorMarket } from "@/lib/creator-intelligence/stage-b";
export { generateIntelligenceOpportunities } from "@/lib/creator-intelligence/stage-c";
export { validateOpportunitySet } from "@/lib/creator-intelligence/validate";
export {
  intelligenceToCreatorProfile,
  intelligenceToBrief,
} from "@/lib/creator-intelligence/map-to-profile";
export {
  runCreatorIntelligencePipeline,
  type IntelligencePipelineInput,
  type IntelligencePipelineResult,
} from "@/lib/creator-intelligence/pipeline";
