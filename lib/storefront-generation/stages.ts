/**
 * Real generation stages for /api/generate-storefront.
 * Each id maps to a backend operation — never advance without server confirmation.
 */
export const STOREFRONT_GENERATION_STAGES = [
  {
    id: "preparing",
    label: "Preparing creator information",
    detail: "Validating your profile, goals, and selected offer.",
  },
  {
    id: "writing_bio",
    label: "Generating creator bio and storefront headline",
    detail: "Asking the AI to draft your bio, headline, and product copy.",
  },
  {
    id: "assembling_products",
    label: "Creating product listings and descriptions",
    detail: "Turning the AI draft into priced product listings.",
  },
  {
    id: "publishing",
    label: "Publishing the shareable storefront",
    detail: "Saving your page and creating a public link.",
  },
] as const;

export type StorefrontGenerationStageId =
  (typeof STOREFRONT_GENERATION_STAGES)[number]["id"];

export type StorefrontStageEvent = {
  type: "stage";
  stage: StorefrontGenerationStageId;
  status: "started" | "completed";
  message?: string;
  at: string;
};

export type StorefrontCompleteEvent = {
  type: "complete";
  storefront: unknown;
  at: string;
};

export type StorefrontErrorEvent = {
  type: "error";
  error: string;
  at: string;
};

export type StorefrontGenerationEvent =
  | StorefrontStageEvent
  | StorefrontCompleteEvent
  | StorefrontErrorEvent;

export function stageIndex(id: StorefrontGenerationStageId): number {
  return STOREFRONT_GENERATION_STAGES.findIndex((s) => s.id === id);
}
