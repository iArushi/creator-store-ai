export {
  STOREFRONT_GENERATION_STAGES,
  stageIndex,
  type StorefrontGenerationEvent,
  type StorefrontGenerationStageId,
  type StorefrontStageEvent,
  type StorefrontCompleteEvent,
  type StorefrontErrorEvent,
} from "@/lib/storefront-generation/stages";

export {
  runStorefrontGeneration,
  parseStorefrontGenerationRequest,
} from "@/lib/storefront-generation/run";
