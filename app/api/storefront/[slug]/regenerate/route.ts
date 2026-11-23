import { randomBytes } from "crypto";
import { connection } from "next/server";
import { z } from "zod";
import { scrubHypePhrases, scrubStorefrontCopy } from "@/lib/ai-guardrails";
import { generateJsonWithOpenAI } from "@/lib/openai";
import {
  GenerateStorefrontAiSchema,
  RegenerateStorefrontRequestSchema,
  StorefrontProductFieldsSchema,
  StorefrontProductSchema,
  StorefrontSchema,
} from "@/lib/schemas";
import {
  REGENERATE_ALL_PROMPT,
  REGENERATE_BIO_PROMPT,
  REGENERATE_ONE_PRODUCT_PROMPT,
  REGENERATE_PRODUCTS_PROMPT,
} from "@/lib/storefront-prompts";
import { getStorefront, saveStorefront } from "@/lib/storefront-store";
import {
  applyCreatorCapsInCopy,
  formatCreatorBrandName,
} from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

const BioOnlySchema = z.object({
  headline: z.string().trim().min(1),
  bio: z.string().trim().min(1),
  intro: z.string().trim().min(1),
});

const ProductsOnlySchema = z.object({
  products: z.array(StorefrontProductFieldsSchema).min(2).max(4),
});

function ensureSingleFeatured<T extends { featured?: boolean }>(
  products: T[],
): T[] {
  const featuredIndex = products.findIndex((p) => p.featured);
  return products.map((product, index) => ({
    ...product,
    featured: featuredIndex >= 0 ? index === featuredIndex : index === 0,
  }));
}

export async function POST(request: Request, { params }: Params) {
  await connection();
  const { slug } = await params;
  const existing = await getStorefront(slug);

  if (!existing) {
    return Response.json({ error: "Storefront not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = RegenerateStorefrontRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid regenerate request." },
        { status: 400 },
      );
    }

    const { target, productId, profileContext } = parsed.data;
    const contextLines = [
      `Current creator name: ${existing.creatorName}`,
      `Niche: ${existing.niche}`,
      `Handle: ${existing.handle || "none"}`,
      `Current headline: ${existing.headline}`,
      `Current bio: ${existing.bio}`,
      `Current intro: ${existing.intro}`,
      `Expertise: ${existing.expertiseTags.join(", ") || "none"}`,
      `Current products: ${JSON.stringify(existing.products)}`,
      profileContext
        ? `Brand context: ${JSON.stringify(profileContext)}`
        : "No extra brand context provided.",
    ].join("\n");

    let next = { ...existing, updatedAt: new Date().toISOString() };

    if (target === "all") {
      const raw = await generateJsonWithOpenAI({
        system: REGENERATE_ALL_PROMPT,
        user: `Regenerate the whole storefront.\n${contextLines}`,
        schema: GenerateStorefrontAiSchema,
        temperature: 0.7,
      });
      const ai = scrubStorefrontCopy(raw);
      const cappedName = formatCreatorBrandName(
        ai.creatorName || existing.creatorName,
        existing.handle,
      );
      next = StorefrontSchema.parse({
        ...existing,
        creatorName: cappedName,
        niche: ai.niche || existing.niche,
        headline: applyCreatorCapsInCopy(
          ai.headline || "",
          cappedName,
          existing.handle,
        ),
        bio: applyCreatorCapsInCopy(ai.bio || "", cappedName, existing.handle),
        intro: applyCreatorCapsInCopy(
          ai.intro || "",
          cappedName,
          existing.handle,
        ),
        products: ensureSingleFeatured(ai.products || []).map((product) => ({
          ...product,
          id: randomBytes(4).toString("hex"),
        })),
        updatedAt: new Date().toISOString(),
      });
    } else if (target === "bio") {
      const raw = await generateJsonWithOpenAI({
        system: REGENERATE_BIO_PROMPT,
        user: `Rewrite headline + bio + intro.\n${contextLines}`,
        schema: BioOnlySchema,
        temperature: 0.7,
      });
      const ai = {
        headline: scrubHypePhrases(raw.headline),
        bio: scrubHypePhrases(raw.bio),
        intro: scrubHypePhrases(raw.intro),
      };
      const cappedName = formatCreatorBrandName(
        existing.creatorName,
        existing.handle,
      );
      next = {
        ...existing,
        creatorName: cappedName,
        headline: applyCreatorCapsInCopy(
          ai.headline,
          cappedName,
          existing.handle,
        ),
        bio: applyCreatorCapsInCopy(ai.bio, cappedName, existing.handle),
        intro: applyCreatorCapsInCopy(ai.intro, cappedName, existing.handle),
        updatedAt: new Date().toISOString(),
      };
    } else if (target === "products") {
      const raw = await generateJsonWithOpenAI({
        system: REGENERATE_PRODUCTS_PROMPT,
        user: `Regenerate products only.\n${contextLines}`,
        schema: ProductsOnlySchema,
        temperature: 0.7,
      });
      const ai = scrubStorefrontCopy(raw);
      next = {
        ...existing,
        products: ensureSingleFeatured(ai.products || []).map((product) =>
          StorefrontProductSchema.parse({
            ...product,
            id: randomBytes(4).toString("hex"),
          }),
        ),
        updatedAt: new Date().toISOString(),
      };
    } else {
      const product = existing.products.find((item) => item.id === productId);
      if (!product) {
        return Response.json({ error: "Product not found." }, { status: 404 });
      }
      const raw = await generateJsonWithOpenAI({
        system: REGENERATE_ONE_PRODUCT_PROMPT,
        user: `Regenerate this product:\n${JSON.stringify(product)}\n\n${contextLines}`,
        schema: StorefrontProductFieldsSchema,
        temperature: 0.7,
      });
      const ai = scrubStorefrontCopy({ products: [raw] }).products![0];
      next = {
        ...existing,
        products: existing.products.map((item) =>
          item.id === productId
            ? StorefrontProductSchema.parse({
                ...ai,
                id: item.id,
                featured: product.featured,
              })
            : item,
        ),
        updatedAt: new Date().toISOString(),
      };
    }

    const saved = await saveStorefront(StorefrontSchema.parse(next));
    return Response.json({ storefront: saved });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to regenerate storefront.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
