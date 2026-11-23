/**
 * End-to-end MVP tests for the two assignment personas, using publicly
 * available Instagram / creator bio themes (no HTML scraping).
 *
 * Flow asserted (assignment MVP):
 *   analyse-profile → generate-opportunities (INR) → generate-storefront
 *   → GET shareable /api/storefront/[slug]
 *
 * Requires OPENAI_API_KEY (via .env.local). TAVILY_API_KEY optional.
 * Dev server must be running (or set TEST_BASE_URL).
 *
 * Usage (from creator-store-ai):
 *   node --env-file=.env.local scripts/test-persona-mvp.mjs
 *   node --env-file=.env.local scripts/test-persona-mvp.mjs --only=persona-a-micro-finance
 */

import {
  ALL_PERSONAS,
  PRODUCT_FORMATS,
} from "./fixtures/assignment-personas.mjs";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const onlyId = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice("--only=".length);

const GOALS = [
  "Help me figure out what to sell",
  "Earn from existing expertise",
];

const TIMEOUT_MS = 180_000;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function textBlob(value) {
  return JSON.stringify(value || {}).toLowerCase();
}

async function postJson(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, payload };
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(path) {
  const response = await fetch(`${base}${path}`);
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

function deriveCreatorName(persona, profile) {
  const handle = persona.input.instagramHandle?.replace(/^@/, "");
  if (handle) return handle.toUpperCase();
  const fromPositioning = profile.positioningStatement
    ?.split(/[.!,]/)[0]
    ?.trim();
  return (fromPositioning || "CREATOR").slice(0, 40).toUpperCase();
}

function assertNicheAlignment(persona, profile, opportunities, storefront) {
  const blob = textBlob({
    tags: profile.expertiseTags,
    positioning: profile.positioningStatement,
    audience: profile.potentialAudience,
    opportunities: opportunities.map((o) => ({
      name: o.productName,
      problem: o.problemSolved,
      who: o.whoWouldBuy,
    })),
    niche: storefront.niche,
    headline: storefront.headline,
    products: storefront.products?.map((p) => p.title),
  });

  const hits = persona.expectations.nicheHints.filter((hint) =>
    blob.includes(hint.toLowerCase()),
  );
  assert(
    hits.length >= 1,
    `Niche mismatch for ${persona.id}: expected one of [${persona.expectations.nicheHints.join(", ")}] in output. Got tags=${JSON.stringify(profile.expertiseTags)} niche=${storefront.niche}`,
  );
  return hits;
}

function assertNoForbiddenClaims(persona, opportunities, storefront) {
  const blob = textBlob({ opportunities, storefront });
  for (const pattern of persona.expectations.forbidAdviceClaims || []) {
    assert(
      !pattern.test(blob),
      `Forbidden claim matched ${pattern} for ${persona.id}`,
    );
  }
}

function assertOpportunities(persona, opportunities) {
  assert(
    Array.isArray(opportunities) && opportunities.length === 3,
    `Expected exactly 3 opportunities, got ${opportunities?.length}`,
  );

  const formats = new Set();
  for (const opp of opportunities) {
    assert(opp.productName?.trim(), "Opportunity missing productName");
    assert(
      PRODUCT_FORMATS.includes(opp.format),
      `Invalid format: ${opp.format}`,
    );
    formats.add(opp.format);

    const price =
      opp.suggestedPriceInr ??
      opp.priceInr?.min ??
      opp.priceInr?.max;
    assert(
      typeof price === "number" && price >= persona.expectations.priceInrMin,
      `Price too low or missing for ${opp.productName}: ${price}`,
    );
    assert(
      price <= persona.expectations.priceInrMax,
      `Price too high for ${opp.productName}: ${price}`,
    );
    assert(
      opp.priceInr?.min && opp.priceInr?.max,
      `Missing priceInr range for ${opp.productName}`,
    );
    assert(
      opp.priceInr.min <= opp.priceInr.max,
      `Invalid priceInr range for ${opp.productName}`,
    );
    assert(opp.problemSolved?.trim(), "Missing problemSolved");
    assert(opp.whoWouldBuy?.trim(), "Missing whoWouldBuy");
  }

  assert(
    formats.size >= 2,
    `Expected format variety (≥2 formats), got ${[...formats].join(", ")}`,
  );
}

function assertStorefront(persona, storefront, handle) {
  assert(storefront?.slug, "Storefront missing slug");
  assert(storefront.creatorName?.trim(), "Storefront missing creatorName");
  assert(storefront.headline?.trim(), "Storefront missing headline");
  assert(storefront.bio?.trim(), "Storefront missing bio");

  const products = storefront.products || [];
  assert(
    products.length >= persona.expectations.minProducts &&
      products.length <= persona.expectations.maxProducts,
    `Expected ${persona.expectations.minProducts}–${persona.expectations.maxProducts} products, got ${products.length}`,
  );

  const featured = products.filter((p) => p.featured);
  assert(featured.length === 1, `Expected exactly 1 featured product, got ${featured.length}`);

  for (const product of products) {
    assert(product.title?.trim(), "Product missing title");
    assert(
      typeof product.priceInr === "number" &&
        product.priceInr >= persona.expectations.priceInrMin,
      `Storefront product price invalid: ${product.priceInr}`,
    );
  }

  if (handle) {
    const expected = handle.replace(/^@/, "").toUpperCase();
    assert(
      storefront.creatorName.includes(expected) ||
        storefront.handle?.toUpperCase().includes(expected) ||
        storefront.creatorName === expected,
      `Expected ALL CAPS handle influence (${expected}), got name=${storefront.creatorName} handle=${storefront.handle}`,
    );
  }
}

async function runPersona(persona) {
  const checks = [];
  const record = (name, pass, detail) => {
    checks.push({ name, pass, detail });
    if (!pass) throw new Error(`${name}: ${detail}`);
  };

  // 1) Analyse profile (description path — public-bio-grounded, no scrape)
  const analyseBody = {
    source: "description",
    description: persona.input.description,
    language: persona.input.language || "English",
  };
  if (persona.input.instagramHandle) {
    analyseBody.instagramHandle = persona.input.instagramHandle;
  }

  const analyse = await postJson("/api/analyse-profile", analyseBody);
  record(
    "analyse-profile HTTP",
    analyse.ok,
    analyse.ok ? `${analyse.status}` : `${analyse.status} ${analyse.payload.error || ""}`,
  );

  const profile = analyse.payload.profile;
  const intelligence = analyse.payload.intelligence;
  assert(profile?.positioningStatement, "Profile missing positioningStatement");
  assert(
    Array.isArray(profile.expertiseTags) && profile.expertiseTags.length > 0,
    "Profile missing expertiseTags",
  );
  const tagBlob = (profile.expertiseTags || []).join(" ").toLowerCase();
  const tagNicheHits = persona.expectations.nicheHints.filter((hint) =>
    tagBlob.includes(hint.toLowerCase()),
  );
  assert(
    tagNicheHits.length >= 1 ||
      !profile.expertiseTags.every((t) =>
        ["creator", "practical tips", "beginner-friendly"].includes(
          String(t).toLowerCase(),
        ),
      ),
    `expertiseTags too generic: ${JSON.stringify(profile.expertiseTags)}`,
  );
  record(
    "profile snapshot",
    true,
    `${profile.expertiseTags.slice(0, 4).join(", ")}${tagNicheHits.length ? ` (niche tags: ${tagNicheHits.join(", ")})` : ""}`,
  );

  // 2) Generate opportunities
  const niche =
    profile.expertiseTags?.[0] ||
    persona.expectations.nicheHints[0] ||
    "Creator";

  const opps = await postJson("/api/generate-opportunities", {
    profile,
    goals: GOALS,
    instagramHandle: persona.input.instagramHandle,
    niche,
    language: persona.input.language || "English",
    existingIntelligence: intelligence,
    guidedContext: {
      niche,
      description: persona.input.description,
    },
  });

  record(
    "generate-opportunities HTTP",
    opps.ok,
    opps.ok
      ? `${opps.status} research=${opps.payload.research?.mode}/${opps.payload.research?.status}`
      : `${opps.status} ${opps.payload.error || ""}`,
  );

  const opportunities = opps.payload.opportunities;
  assertOpportunities(persona, opportunities);
  record("3 INR opportunities", true, opportunities.map((o) => `${o.productName} (₹${o.suggestedPriceInr || o.priceInr?.min})`).join(" | "));

  // 3) Generate storefront from top opportunity
  const selected = opportunities[0];
  const creatorName = deriveCreatorName(persona, profile);

  const store = await postJson("/api/generate-storefront", {
    profile,
    goals: GOALS,
    selectedOpportunity: selected,
    instagramHandle: persona.input.instagramHandle,
    creatorName,
    niche,
    language: persona.input.language || "English",
  });

  record(
    "generate-storefront HTTP",
    store.ok,
    store.ok ? store.payload.storefront?.slug : `${store.status} ${store.payload.error || ""}`,
  );

  const storefront = store.payload.storefront;
  assertStorefront(persona, storefront, persona.input.instagramHandle);

  // 4) Shareable URL fetch
  const share = await getJson(`/api/storefront/${storefront.slug}`);
  record(
    "shareable storefront GET",
    share.ok && share.payload?.storefront?.slug === storefront.slug,
    share.ok ? `/s/${storefront.slug}` : `${share.status}`,
  );

  const nicheHits = assertNicheAlignment(
    persona,
    profile,
    opportunities,
    storefront,
  );
  record("niche alignment", true, `matched: ${nicheHits.join(", ")}`);

  assertNoForbiddenClaims(persona, opportunities, storefront);
  record("no forbidden advice claims", true, "ok");

  // Persona-specific MVP gates
  if (persona.assignmentPersona === "primary_indian_micro_creator") {
    assert(
      Boolean(persona.input.instagramHandle),
      "Primary persona fixture should include a public handle label",
    );
    record("primary persona handle path", true, persona.input.instagramHandle);
  }

  if (persona.assignmentPersona === "secondary_expert_without_audience") {
    assert(
      !persona.input.instagramHandle,
      "Secondary persona must run description-only (no audience / no handle)",
    );
    record("secondary persona description-only", true, "no Instagram required");
  }

  return {
    id: persona.id,
    assignmentPersona: persona.assignmentPersona,
    publicHandles: persona.publicReference.handles,
    pass: true,
    checks,
    summary: {
      tags: profile.expertiseTags,
      opportunities: opportunities.map((o) => ({
        name: o.productName,
        format: o.format,
        priceInr: o.suggestedPriceInr || o.priceInr?.min,
        confidence: o.confidence,
      })),
      storefront: {
        slug: storefront.slug,
        creatorName: storefront.creatorName,
        handle: storefront.handle,
        niche: storefront.niche,
        productCount: storefront.products.length,
        sharePath: `/s/${storefront.slug}`,
      },
      research: opps.payload.research,
    },
  };
}

async function main() {
  console.log(`Persona MVP tests → ${base}`);
  console.log(
    "Fixtures use public bio themes only (no Instagram HTML scrape).\n",
  );

  // Health check
  try {
    const health = await fetch(`${base}/api/instagram/status`);
    if (!health.ok && health.status >= 500) {
      throw new Error(`Server unhealthy: ${health.status}`);
    }
  } catch (error) {
    console.error(
      `Cannot reach ${base}. Start the app with: npm run dev\n`,
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }

  const personas = onlyId
    ? ALL_PERSONAS.filter((p) => p.id === onlyId)
    : ALL_PERSONAS;

  if (personas.length === 0) {
    console.error(`No personas matched --only=${onlyId}`);
    process.exit(1);
  }

  const results = [];
  let failed = 0;

  for (const persona of personas) {
    process.stdout.write(
      `→ ${persona.id} (${persona.assignmentPersona})... `,
    );
    const started = Date.now();
    try {
      const result = await runPersona(persona);
      result.durationMs = Date.now() - started;
      results.push(result);
      console.log(`PASS (${Math.round(result.durationMs / 1000)}s)`);
      for (const check of result.checks) {
        console.log(`   ✓ ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        id: persona.id,
        assignmentPersona: persona.assignmentPersona,
        pass: false,
        error: message,
        durationMs: Date.now() - started,
      });
      console.log(`FAIL (${Math.round((Date.now() - started) / 1000)}s)`);
      console.log(`   ✗ ${message}`);
    }
    console.log("");
  }

  const primary = results.filter(
    (r) => r.assignmentPersona === "primary_indian_micro_creator",
  );
  const secondary = results.filter(
    (r) => r.assignmentPersona === "secondary_expert_without_audience",
  );
  const primaryOk = primary.some((r) => r.pass);
  const secondaryOk = secondary.some((r) => r.pass);

  console.log("═══ Assignment MVP gate ═══");
  console.log(
    `Primary Indian micro-creator: ${primaryOk ? "PASS" : "FAIL"} (${primary.filter((r) => r.pass).length}/${primary.length} fixtures)`,
  );
  console.log(
    `Secondary expert (no audience): ${secondaryOk ? "PASS" : "FAIL"} (${secondary.filter((r) => r.pass).length}/${secondary.length} fixtures)`,
  );
  console.log("");
  console.log(JSON.stringify(results, null, 2));

  if (!primaryOk || !secondaryOk || failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
