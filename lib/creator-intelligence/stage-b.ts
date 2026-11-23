import { isTavilyConfigured, tavilySearch } from "@/lib/research/tavily";
import {
  MarketResearchBriefSchema,
  type CreatorIntelligence,
  type MarketResearchBrief,
  type MarketResearchItem,
} from "@/lib/creator-intelligence/schemas";

const INR_PRICE_RE = /(?:₹|INR|Rs\.?\s?)\s?([\d,]+(?:\.\d+)?)/i;

function parseListedPrice(text: string): number | undefined {
  const match = text.match(INR_PRICE_RE);
  if (!match?.[1]) return undefined;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
}

function buildTargetedQueries(intelligence: CreatorIntelligence): Array<{
  category: MarketResearchItem["category"];
  query: string;
}> {
  const niche = intelligence.identity.mainNiche;
  const expertise = [
    ...intelligence.expertise.subjectsExplained,
    ...intelligence.expertise.skillsDemonstrated,
  ]
    .slice(0, 3)
    .map((i) => i.insight)
    .join(" ");
  const problems = intelligence.audience.visibleProblems
    .slice(0, 2)
    .map((i) => i.insight)
    .join(" ");
  const assetHint =
    intelligence.knowledgeAssets[0]?.label ||
    intelligence.capabilities.capableOfDelivering[0]?.insight ||
    "";

  const queries: Array<{
    category: MarketResearchItem["category"];
    query: string;
  }> = [
    {
      category: "audience_problems",
      query: `${niche} ${problems || expertise} beginners problems India`.trim(),
    },
    {
      category: "comparable_products",
      query:
        `${niche} ${expertise || assetHint} ebook course workshop template price INR India`.trim(),
    },
    {
      category: "market_positioning",
      query:
        `${niche} digital product for Indian audience positioning alternatives monetise`.trim(),
    },
    {
      category: "differentiation",
      query:
        `${niche} ${assetHint || expertise} unique angle checklist framework guide India`.trim(),
    },
  ];
  return queries.slice(0, 4);
}

/**
 * Stage B — targeted market research AFTER creator intelligence exists.
 * Uses a small number of Tavily searches. Listed prices are not sales proof.
 */
export async function researchCreatorMarket(input: {
  intelligence: CreatorIntelligence;
}): Promise<MarketResearchBrief> {
  const dateRetrieved = new Date().toISOString();

  if (!isTavilyConfigured()) {
    return MarketResearchBriefSchema.parse({
      status: "unavailable",
      researchAvailable: false,
      queries: [],
      items: [],
      warnings: [
        "External research skipped: TAVILY_API_KEY is not configured.",
        "Do not present recommendations as market-validated.",
      ],
      summary:
        "External research unavailable. Opportunities will rely on creator evidence only.",
      dateRetrieved,
    });
  }

  if (input.intelligence.insufficientEvidence) {
    return MarketResearchBriefSchema.parse({
      status: "insufficient",
      researchAvailable: false,
      queries: [],
      items: [],
      warnings: [
        "Creator intelligence was insufficient — market research deferred.",
      ],
      summary:
        "Market research was not run because creator evidence is still too thin.",
      dateRetrieved,
    });
  }

  const planned = buildTargetedQueries(input.intelligence);
  const items: MarketResearchItem[] = [];
  const warnings: string[] = [];
  const queries: string[] = [];

  for (const plan of planned) {
    queries.push(plan.query);
    try {
      const hits = await tavilySearch({
        query: plan.query,
        maxResults: 4,
        searchDepth: "basic",
        timeoutMs: 12000,
      });

      if (hits.length === 0) {
        warnings.push(`No results for: ${plan.query}`);
        continue;
      }

      for (const hit of hits.slice(0, 2)) {
        const excerpt =
          hit.content.slice(0, 280) ||
          "Limited snippet text — treat as a weak signal only.";
        items.push({
          title: hit.title,
          url: hit.url,
          excerpt,
          listedPriceInr: parseListedPrice(`${hit.title} ${hit.content}`),
          dateRetrieved,
          category: plan.category,
          observationType: "externally_researched",
        });
      }
    } catch (error) {
      warnings.push(
        `Search failed for “${plan.query}”: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  if (items.length === 0) {
    return MarketResearchBriefSchema.parse({
      status: "insufficient",
      researchAvailable: false,
      queries,
      items: [],
      warnings: [
        ...warnings,
        "Searches ran but returned no usable niche-relevant sources.",
      ],
      summary:
        "Insufficient market evidence. Continue with creator-grounded AI estimates only — do not invent citations.",
      dateRetrieved,
    });
  }

  return MarketResearchBriefSchema.parse({
    status: "researched",
    researchAvailable: true,
    queries,
    items: items.slice(0, 12),
    warnings,
    summary: [
      `Collected ${items.length} external findings for ${input.intelligence.identity.mainNiche}.`,
      "Listed prices are public page figures only — not proof of sales or demand.",
      "Comparable offerings existing is not proof of purchase intent.",
    ].join(" "),
    dateRetrieved,
  });
}
