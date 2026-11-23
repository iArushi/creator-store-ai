import { randomBytes } from "crypto";
import { scrubStorefrontCopy } from "@/lib/ai-guardrails";
import { generateJsonWithOpenAI } from "@/lib/openai";
import {
  applyCreatorCapsInCopy,
  formatCreatorBrandName,
  formatCreatorHandle,
} from "@/lib/utils";
import {
  GenerateStorefrontAiSchema,
  GenerateStorefrontRequestSchema,
  StorefrontSchema,
  type GenerateStorefrontRequest,
  type Storefront,
} from "@/lib/schemas";
import { STOREFRONT_SYSTEM_PROMPT } from "@/lib/storefront-prompts";
import { createSlug, saveStorefront } from "@/lib/storefront-store";
import type {
  StorefrontGenerationEvent,
  StorefrontGenerationStageId,
} from "@/lib/storefront-generation/stages";

function ensureSingleFeatured<T extends { featured?: boolean }>(
  products: T[],
): T[] {
  const featuredIndex = products.findIndex((p) => p.featured);
  return products.map((product, index) => ({
    ...product,
    featured: featuredIndex >= 0 ? index === featuredIndex : index === 0,
  }));
}

function nowIso() {
  return new Date().toISOString();
}

export type StorefrontGenerationProgress = (
  event: StorefrontGenerationEvent,
) => void | Promise<void>;

async function emitStage(
  onProgress: StorefrontGenerationProgress | undefined,
  stage: StorefrontGenerationStageId,
  status: "started" | "completed",
  message?: string,
) {
  await onProgress?.({
    type: "stage",
    stage,
    status,
    message,
    at: nowIso(),
  });
}

/**
 * Core storefront generation with real progress hooks.
 * Stages mirror backend work — never mark complete before the operation finishes.
 */
export async function runStorefrontGeneration(input: {
  data: GenerateStorefrontRequest;
  onProgress?: StorefrontGenerationProgress;
  signal?: AbortSignal;
}): Promise<Storefront> {
  const { data, onProgress, signal } = input;

  await emitStage(
    onProgress,
    "preparing",
    "started",
    "Validating your profile, goals, and selected offer.",
  );

  if (signal?.aborted) {
    const abortError = new Error("Generation aborted.");
    abortError.name = "AbortError";
    throw abortError;
  }

  const {
    profile,
    goals,
    selectedOpportunity,
    instagramHandle,
    creatorName,
    niche,
    language,
    profileImageUrl,
  } = data;

  // Lightweight prep — assemble the prompt payload after schema validation.
  const userPrompt = [
    "Create a publishable storefront.",
    "",
    `LANGUAGE: ${language || "English"}`,
    `Suggested display name: ${creatorName || "derive from positioning"}`,
    `Preferred niche label: ${niche || "derive from expertise"}`,
    `Handle: ${instagramHandle || "none"}`,
    profileImageUrl
      ? "A real profile photo URL will be attached by the server — do not invent images."
      : "No profile photo available — page will use initials.",
    "",
    "Creator brand analysis:",
    `Identity: ${profile.positioningStatement}`,
    `Expertise: ${profile.expertiseTags.join(", ")}`,
    `Audience: ${profile.potentialAudience}`,
    `Content value: ${profile.contentValue}`,
    `Positioning: ${profile.potentialPositioning}`,
    "",
    `Goals: ${goals.join("; ")}`,
    "",
    "Selected opportunity to lead with (featured product):",
    JSON.stringify(selectedOpportunity, null, 2),
    "",
    "Pricing note for first-time sellers: suggest accessible starter INR for Indian audiences; explain why in priceRationale without competitor claims.",
  ].join("\n");

  await emitStage(onProgress, "preparing", "completed");

  await emitStage(
    onProgress,
    "writing_bio",
    "started",
    "Drafting your bio, headline, intro, and product copy with AI.",
  );

  const rawAi = await generateJsonWithOpenAI({
    system: STOREFRONT_SYSTEM_PROMPT,
    temperature: 0.65,
    schema: GenerateStorefrontAiSchema,
    user: userPrompt,
    signal,
  });
  const ai = scrubStorefrontCopy(rawAi);

  await emitStage(onProgress, "writing_bio", "completed");

  await emitStage(
    onProgress,
    "assembling_products",
    "started",
    "Formatting product listings, prices, and featured offer.",
  );

  const stamp = nowIso();
  const slugSeed =
    instagramHandle?.replace(/^@/, "") || ai.creatorName || "creator";

  const products = ensureSingleFeatured(ai.products || []).map((product) => ({
    ...product,
    id: randomBytes(4).toString("hex"),
  }));

  const rawHandle = formatCreatorHandle(instagramHandle);
  const cappedName = formatCreatorBrandName(
    creatorName?.trim() || ai.creatorName || rawHandle || "Creator",
    rawHandle,
  );

  const draft = StorefrontSchema.parse({
    slug: createSlug(slugSeed),
    creatorName: cappedName,
    handle: rawHandle,
    niche: niche?.trim() || ai.niche,
    headline: applyCreatorCapsInCopy(ai.headline || "", cappedName, rawHandle),
    bio: applyCreatorCapsInCopy(ai.bio || "", cappedName, rawHandle),
    intro: applyCreatorCapsInCopy(ai.intro || "", cappedName, rawHandle),
    expertiseTags: profile.expertiseTags.slice(0, 8),
    profileImageUrl,
    products,
    createdAt: stamp,
    updatedAt: stamp,
  });

  await emitStage(onProgress, "assembling_products", "completed");

  await emitStage(
    onProgress,
    "publishing",
    "started",
    "Saving your storefront and creating a shareable link.",
  );

  if (signal?.aborted) {
    const abortError = new Error("Generation aborted.");
    abortError.name = "AbortError";
    throw abortError;
  }

  const storefront = await saveStorefront(draft);

  await emitStage(onProgress, "publishing", "completed");

  await onProgress?.({
    type: "complete",
    storefront,
    at: nowIso(),
  });

  return storefront;
}

export function parseStorefrontGenerationRequest(body: unknown) {
  return GenerateStorefrontRequestSchema.safeParse(body);
}
