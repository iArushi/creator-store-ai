import {
  COVER_MOTIFS,
  StorefrontProductSchema,
  StorefrontSchema,
  normalizeProductFormat,
  type Storefront,
  type StorefrontProduct,
} from "@/lib/schemas";

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asPositiveInt(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : fallback;
}

function normalizeProduct(
  raw: Record<string, unknown>,
  index: number,
): StorefrontProduct {
  const format = normalizeProductFormat(raw.format);

  const coverMotif =
    typeof raw.coverMotif === "string" &&
    (COVER_MOTIFS as readonly string[]).includes(raw.coverMotif)
      ? raw.coverMotif
      : COVER_MOTIFS[index % COVER_MOTIFS.length];

  const description = asString(raw.description, "A focused offer for your audience.");
  const deliverables = Array.isArray(raw.deliverables)
    ? raw.deliverables
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .slice(0, 5)
    : [];

  return StorefrontProductSchema.parse({
    id: asString(raw.id, `p${index + 1}`),
    title: asString(raw.title, `Offer ${index + 1}`),
    format,
    description,
    targetAudience: asString(
      raw.targetAudience,
      "People who follow this creator for practical guidance",
    ),
    problemSolved: asString(
      raw.problemSolved,
      "They need a clearer, more structured next step",
    ),
    outcome: asString(
      raw.outcome,
      "Leave with a usable plan instead of scattered tips",
    ),
    deliverables:
      deliverables.length >= 2
        ? deliverables
        : ["Core guide or session", "Action checklist", "Follow-up prompts"],
    priceInr: asPositiveInt(raw.priceInr, 999),
    priceRationale: asString(
      raw.priceRationale,
      "Priced as an accessible entry offer for Indian buyers of this format",
    ),
    whyFitsCreator: asString(
      raw.whyFitsCreator,
      "Matches the creator's stated expertise and audience needs",
    ),
    featured: Boolean(raw.featured) || index === 0,
    coverMotif,
  });
}

/** Accepts current + legacy storefront JSON shapes. */
export function normalizeStorefront(raw: unknown): Storefront | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const productsRaw = Array.isArray(data.products) ? data.products : [];
  if (productsRaw.length < 2) return null;

  try {
    const products = productsRaw
      .slice(0, 6)
      .map((item, index) =>
        normalizeProduct(
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {},
          index,
        ),
      );

    // Ensure exactly one featured product
    const featuredIndex = products.findIndex((p) => p.featured);
    const withFeatured = products.map((product, index) => ({
      ...product,
      featured: featuredIndex >= 0 ? index === featuredIndex : index === 0,
    }));

    const rawHandle =
      typeof data.handle === "string" && data.handle.trim()
        ? data.handle.replace(/^@/, "").trim().toUpperCase()
        : undefined;
    const rawName = asString(data.creatorName, rawHandle || "Creator");
    const creatorName =
      /^[a-z0-9._]+$/i.test(rawName.replace(/^@/, "").trim()) &&
      !/\s/.test(rawName.trim())
        ? rawName.replace(/^@/, "").trim().toUpperCase()
        : rawName.trim();

    const capsCopy = (value: string) => {
      const variants = [creatorName, rawHandle].filter(Boolean) as string[];
      let out = value;
      for (const variant of variants) {
        out = out.replace(
          new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"),
          creatorName,
        );
      }
      return out;
    };

    return StorefrontSchema.parse({
      slug: asString(data.slug, "creator"),
      creatorName,
      handle: rawHandle,
      niche: asString(data.niche, "Creator"),
      headline: capsCopy(
        asString(data.headline, "Resources built from real experience"),
      ),
      bio: capsCopy(
        asString(
          data.bio,
          "I help people take clearer next steps with practical, focused resources.",
        ),
      ),
      intro: capsCopy(
        asString(
          data.intro,
          asString(
            data.bio,
            "I create practical resources for people who want clearer next steps.",
          ),
        ),
      ),
      expertiseTags: Array.isArray(data.expertiseTags)
        ? data.expertiseTags.filter(
            (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
          )
        : [],
      profileImageUrl:
        typeof data.profileImageUrl === "string" &&
        /^https?:\/\//.test(data.profileImageUrl)
          ? data.profileImageUrl
          : undefined,
      products: withFeatured,
      createdAt: asString(data.createdAt, new Date().toISOString()),
      updatedAt: asString(data.updatedAt, new Date().toISOString()),
    });
  } catch {
    return null;
  }
}
