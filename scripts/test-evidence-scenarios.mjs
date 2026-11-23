/**
 * Evidence-driven scenario + scorecard tests (assignment personas).
 *
 * Usage:
 *   npm run test:evidence
 *   npm run test:evidence -- --only=T03-COOK-NEHA
 *   npm run test:evidence -- --edges
 *   npm run test:evidence -- --all
 *
 * Default: Scenario 3 first, then remaining primary/secondary scenarios.
 * Requires OPENAI_API_KEY. TAVILY_API_KEY improves market-research scoring.
 */

import {
  ALL_SCENARIOS,
  EDGE_CASES,
  SCENARIO_03_COOKING,
} from "./fixtures/evidence-scenarios.mjs";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const args = process.argv.slice(2);
const onlyId = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const runEdges = args.includes("--edges") || args.includes("--all");
const runAllScenarios = !args.includes("--edges-only");

const GOALS = [
  "Help me figure out what to sell",
  "Earn from existing expertise",
];
const TIMEOUT_MS = 240_000;

function blob(value) {
  return JSON.stringify(value || {}).toLowerCase();
}

function includesAny(text, hints) {
  const t = text.toLowerCase();
  return hints.filter((h) => t.includes(h.toLowerCase()));
}

function clampScore(n) {
  return Math.max(1, Math.min(5, Math.round(n)));
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

function countEvidenceRefs(intelligence) {
  const lists = [
    ...(intelligence?.identity?.consistentTopics || []),
    ...(intelligence?.expertise?.subjectsExplained || []),
    ...(intelligence?.expertise?.skillsDemonstrated || []),
    ...(intelligence?.content?.commonThemes || []),
    ...(intelligence?.content?.contentPillars || []),
    ...(intelligence?.audience?.visibleProblems || []),
    ...(intelligence?.audience?.explicitAudienceRefs || []),
    ...(intelligence?.capabilities?.capableOfDelivering || []),
  ];
  let withEvidence = 0;
  let total = 0;
  for (const item of lists) {
    total += 1;
    if (item?.evidence?.length > 0) withEvidence += 1;
  }
  const assets = intelligence?.knowledgeAssets || [];
  for (const asset of assets) {
    total += 1;
    if (asset?.evidence?.length > 0) withEvidence += 1;
  }
  return { withEvidence, total, assets: assets.length };
}

function scoreScenario(scenario, ctx) {
  const {
    profile,
    intelligence,
    opportunities,
    research,
    analyseStatus,
    analyseError,
  } = ctx;

  const notes = [];
  const intelBlob = blob({ profile, intelligence });
  const oppBlob = blob(opportunities);

  // --- Expertise discovery ---
  const discovered = includesAny(intelBlob, scenario.mustDiscover || []);
  const discoverRatio =
    (scenario.mustDiscover?.length || 1) > 0
      ? discovered.length / Math.max(scenario.mustDiscoverMin || 1, 1)
      : 0;
  let expertise = clampScore(1 + discoverRatio * 4);
  if (discovered.length >= (scenario.mustDiscoverMin || 3)) expertise = Math.max(expertise, 4);
  if (discovered.length >= Math.min(5, scenario.mustDiscover?.length || 5))
    expertise = Math.max(expertise, 5);
  notes.push(`expertise hits: ${discovered.join(", ") || "none"}`);

  // --- Evidence quality ---
  const ev = countEvidenceRefs(intelligence);
  let evidence = 2;
  if (ev.total === 0) evidence = 1;
  else if (ev.withEvidence === 0) evidence = 2;
  else if (ev.withEvidence / ev.total >= 0.3) evidence = 3;
  else evidence = 2;
  if (ev.withEvidence / Math.max(ev.total, 1) >= 0.5) evidence = 4;
  if (ev.withEvidence >= 4 && ev.withEvidence / ev.total >= 0.5) evidence = 5;
  notes.push(`evidence refs: ${ev.withEvidence}/${ev.total}; assets=${ev.assets}`);

  // --- Audience relevance ---
  const audienceText = blob({
    audience: intelligence?.audience,
    profileAudience: profile?.potentialAudience,
    observed: profile?.observedSignals,
  });
  const audienceHits = includesAny(audienceText, scenario.mustDiscover || []);
  let audience = clampScore(2 + Math.min(3, audienceHits.length));
  if (
    (intelligence?.audience?.visibleProblems || []).length >= 1 ||
    (intelligence?.audience?.explicitAudienceRefs || []).length >= 1
  ) {
    audience = Math.max(audience, 4);
  }
  notes.push(`audience hits: ${audienceHits.join(", ") || "thin"}`);

  // --- Product fit ---
  const oppHits = includesAny(oppBlob, scenario.opportunityHints || []);
  let productFit = oppHits.length >= (scenario.opportunityHintMin || 1) ? 4 : 2;
  if (oppHits.length >= 2) productFit = 5;
  if (!opportunities?.length) productFit = 1;

  if (scenario.preferMealPlanningOverGenericEbook) {
    const mealPlan = /meal\s*plan|grocery|prep|planner|budget/i.test(oppBlob);
    const onlyGenericRecipeEbook =
      opportunities?.every(
        (o) =>
          /ebook/i.test(o.format) &&
          /recipe/i.test(o.productName) &&
          !/plan|prep|grocery|budget/i.test(o.productName),
      ) ?? false;
    if (mealPlan) {
      productFit = Math.max(productFit, 5);
      notes.push("meal-planning opportunity discovered");
    } else if (onlyGenericRecipeEbook) {
      productFit = Math.min(productFit, 2);
      notes.push("WARN: defaulted to generic recipe ebook");
    } else {
      notes.push("meal-planning not clearly found");
      productFit = Math.min(productFit, 3);
    }
  }

  if (scenario.preferAssetsOverAdvancedCourse) {
    const assets = /template|canva|kit|library|calendar|starter/i.test(oppBlob);
    const advancedOnly = opportunities?.every((o) =>
      /masterclass|advanced design degree|professional certification/i.test(
        `${o.productName} ${o.problemSolved}`,
      ),
    );
    if (assets) productFit = Math.max(productFit, 4);
    if (advancedOnly) productFit = Math.min(productFit, 2);
  }

  if (scenario.preferSpecificLearningResources) {
    const specific = /workbook|planner|vocab|practice|revision|challenge/i.test(
      oppBlob,
    );
    if (specific) productFit = Math.max(productFit, 4);
  }

  notes.push(`opportunity hint hits: ${oppHits.join(", ") || "none"}`);

  // --- Pricing quality ---
  let pricing = 3;
  const prices = (opportunities || [])
    .map((o) => o.suggestedPriceInr || o.priceInr?.min)
    .filter((n) => typeof n === "number");
  const [lo, hi] = scenario.priceBandInr || [99, 25000];
  const inBand = prices.filter((p) => p >= lo && p <= hi);
  if (prices.length === 0) pricing = 1;
  else if (inBand.length === prices.length) pricing = 4;
  else pricing = 2;

  if (
    scenario.preferredPriceCeiling &&
    prices.every((p) => p <= scenario.preferredPriceCeiling)
  ) {
    pricing = Math.max(pricing, 4);
  }

  const bases = (opportunities || []).map((o) => o.pricingBasis);
  if (research?.mode === "external_research" && research?.findingCount > 0) {
    if (bases.some((b) => b === "researched_comparables")) pricing = 5;
    notes.push(`research: ${research.mode} findings=${research.findingCount}`);
  } else {
    const honestEstimate =
      bases.every((b) => b === "ai_estimate") ||
      /estimate|unavailable|not market-validated/i.test(blob(research));
    if (honestEstimate) {
      pricing = Math.max(pricing, 4);
      notes.push("pricing labelled as estimate / research unavailable");
    } else {
      notes.push("WARN: pricing basis unclear without research");
      pricing = Math.min(pricing, 3);
    }
  }

  // --- Differentiation ---
  const formats = new Set((opportunities || []).map((o) => o.format));
  let differentiation = formats.size >= 2 ? 4 : 2;
  if (oppHits.length >= 2 && formats.size >= 2) differentiation = 5;
  if (productFit <= 2) differentiation = Math.min(differentiation, 2);

  // Scan generated outputs only — uploaded posts often contain disclaimers
  // like "not personalised investment advice" which must not trip forbids.
  const generatedBlob = blob({
    summary: intelligence?.summaryForCreator,
    positioning: intelligence?.identity?.potentialPositioning,
    niche: intelligence?.identity?.mainNiche,
    tags: profile?.expertiseTags,
    opportunities,
    capableOf: intelligence?.capabilities?.capableOfDelivering,
  });

  function matchesForbiddenClaim(pattern, text) {
    if (!pattern.test(text)) return false;
    // Allow educational disclaimers / negations
    const negated =
      /not\s+(a\s+)?(personalised|personalized)\s+investment\s+advice/i.test(
        text,
      ) ||
      /educational only/i.test(text) ||
      /not\s+a\s+certified/i.test(text) ||
      /i am not a certified/i.test(text);
    if (negated && /investment advice|certified/i.test(pattern.source || "")) {
      return false;
    }
    // Re-check pattern against generated text with simple "not …" window strip
    const stripped = text.replace(
      /\bnot\s+(?:a\s+)?(?:personalised|personalized|certified)[^.!?]{0,40}/gi,
      " ",
    );
    return pattern.test(stripped);
  }

  // --- Hard gates / forbids ---
  const failures = [];
  for (const pattern of scenario.forbid || []) {
    if (matchesForbiddenClaim(pattern, generatedBlob)) {
      failures.push(`forbidden claim: ${pattern}`);
      expertise = Math.min(expertise, 2);
      productFit = Math.min(productFit, 2);
    }
  }

  if (scenario.mustNotClaimQualification) {
    if (
      matchesForbiddenClaim(
        /certified (fitness )?coach|certified trainer|licensed physiotherapist/i,
        generatedBlob,
      )
    ) {
      failures.push("invented fitness qualification");
      expertise = Math.min(expertise, 1);
      productFit = Math.min(productFit, 1);
    }
  }

  if (scenario.mustWorkWithoutInstagram && analyseStatus === 200 && opportunities?.length === 3) {
    notes.push("worked without Instagram audience");
  }

  if (scenario.expectEducationalNotAdvice) {
    if (
      matchesForbiddenClaim(
        /(?:offer|provides?|gives?)\s+personalised investment advice|buy this stock|guaranteed returns/i,
        generatedBlob,
      ) ||
      (/personalised investment advice|personalized investment advice/i.test(
        generatedBlob,
      ) &&
        !/not\s+(personalised|personalized)\s+investment\s+advice/i.test(
          generatedBlob,
        ) &&
        !/educational/i.test(generatedBlob))
    ) {
      failures.push("crossed into personalised investment advice");
    } else {
      notes.push("stayed in educational finance lane");
    }
  }

  // Edge-case specific scoring adjustments applied by caller
  if (analyseError) notes.push(`analyse note: ${analyseError}`);

  const scores = {
    expertiseDiscovery: expertise,
    evidenceQuality: evidence,
    audienceRelevance: audience,
    productFit,
    pricingQuality: pricing,
    differentiation,
  };
  const average =
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

  return {
    scores,
    average: Math.round(average * 10) / 10,
    pass: failures.length === 0 && average >= 3 && productFit >= 3,
    benchmarkPass: average >= 4 && evidence >= 3 && productFit >= 4,
    failures,
    notes,
    discovered,
    oppHits,
  };
}

async function runFullScenario(scenario) {
  const analyseBody = {
    source: "description",
    description: scenario.description,
    language: scenario.language || "English",
    resources: scenario.resources || [],
  };
  if (scenario.handle) analyseBody.instagramHandle = scenario.handle;

  const analyse = await postJson("/api/analyse-profile", analyseBody);
  const profile = analyse.payload.profile;
  const intelligence = analyse.payload.intelligence;

  if (!analyse.ok) {
    return {
      id: scenario.id,
      matrixId: scenario.matrixId,
      pass: false,
      error: analyse.payload.error || `analyse ${analyse.status}`,
      scorecard: null,
    };
  }

  const niche =
    profile?.expertiseTags?.[0] ||
    intelligence?.identity?.mainNiche ||
    scenario.niche ||
    "Creator";

  const opps = await postJson("/api/generate-opportunities", {
    profile,
    goals: GOALS,
    instagramHandle: scenario.handle || undefined,
    niche,
    language: scenario.language || "English",
    resources: scenario.resources || [],
    existingIntelligence: intelligence,
    guidedContext: {
      niche,
      description: scenario.description,
      peopleAskAbout: scenario.resources
        ?.find((r) => r.id === "audience_comments")
        ?.text,
    },
  });

  if (!opps.ok) {
    const scorecard = scoreScenario(scenario, {
      profile,
      intelligence,
      opportunities: [],
      research: opps.payload.research,
      analyseStatus: analyse.status,
      analyseError: opps.payload.error,
    });
    return {
      id: scenario.id,
      matrixId: scenario.matrixId,
      creatorName: scenario.creatorName,
      pass: false,
      error: opps.payload.error || `opportunities ${opps.status}`,
      intelligenceBrief: intelligence?.summaryForCreator,
      tags: profile?.expertiseTags,
      scorecard,
      research: opps.payload.research,
    };
  }

  const opportunities = opps.payload.opportunities || [];
  const research = opps.payload.research;

  const selected = opportunities[0];
  const store = await postJson("/api/generate-storefront", {
    profile,
    goals: GOALS,
    selectedOpportunity: selected,
    instagramHandle: scenario.handle || undefined,
    creatorName: scenario.creatorName,
    niche,
    language: scenario.language || "English",
  });

  const scorecard = scoreScenario(scenario, {
    profile,
    intelligence,
    opportunities,
    research,
    analyseStatus: analyse.status,
  });

  return {
    id: scenario.id,
    matrixId: scenario.matrixId,
    creatorName: scenario.creatorName,
    pass: scorecard.pass && store.ok,
    benchmarkPass: scorecard.benchmarkPass,
    scorecard,
    tags: profile?.expertiseTags,
    mainNiche: intelligence?.identity?.mainNiche,
    summary: intelligence?.summaryForCreator,
    knowledgeAssets: (intelligence?.knowledgeAssets || []).map((a) => a.label),
    audienceProblems: (intelligence?.audience?.visibleProblems || []).map(
      (i) => i.insight,
    ),
    opportunities: opportunities.map((o) => ({
      name: o.productName,
      format: o.format,
      priceInr: o.suggestedPriceInr || o.priceInr?.min,
      pricingBasis: o.pricingBasis,
      confidence: o.confidence,
      evidenceCount: o.evidence?.length || 0,
    })),
    research: {
      mode: research?.mode,
      status: research?.status,
      findingCount: research?.findingCount,
      message: research?.message,
    },
    storefront: store.ok
      ? {
          slug: store.payload.storefront?.slug,
          niche: store.payload.storefront?.niche,
          products: store.payload.storefront?.products?.length,
          sharePath: `/s/${store.payload.storefront?.slug}`,
        }
      : { error: store.payload.error },
  };
}

async function runEdge(edge) {
  const analyseBody = {
    source: "description",
    description: edge.description,
    language: edge.language || "English",
    resources: edge.resources || [],
  };
  if (edge.handle) analyseBody.instagramHandle = edge.handle;

  const analyse = await postJson("/api/analyse-profile", analyseBody);
  const profile = analyse.payload.profile;
  const intelligence = analyse.payload.intelligence;
  const intelBlob = blob({ profile, intelligence, error: analyse.payload });

  const result = {
    id: edge.id,
    matrixId: edge.matrixId,
    pass: false,
    notes: [],
    analyseStatus: analyse.status,
  };

  if (edge.expectFollowUp || edge.expectInsufficientOrThin) {
    const thin =
      intelligence?.insufficientEvidence === true ||
      Boolean(intelligence?.followUpQuestion) ||
      analyse.status === 422 ||
      /more|clarify|what do you|tell us|share/i.test(
        intelligence?.followUpQuestion || analyse.payload.error || "",
      );
    const hallucinatedRichProfile =
      (intelligence?.expertise?.subjectsExplained || []).length >= 4 &&
      !intelligence?.insufficientEvidence;
    result.pass = thin && !hallucinatedRichProfile;
    result.notes.push(
      thin
        ? `follow-up/thin path: ${intelligence?.followUpQuestion || analyse.payload.error || "insufficientEvidence"}`
        : "FAIL: invented a rich profile from one sentence",
    );
    if (hallucinatedRichProfile) {
      result.notes.push("hallucinated rich expertise arrays");
    }
    return result;
  }

  if (edge.expectDiscrepancyFlag) {
    const flagged =
      /contradict|discrepan|conflict|doesn't match|does not match|confirm|mismatch|inconsist/i.test(
        intelBlob,
      ) ||
      intelligence?.insufficientEvidence ||
      Boolean(intelligence?.followUpQuestion) ||
      (intelligence?.audience?.gapsRequiringConfirmation || []).length > 0;
    const trustedTrading =
      /options|futures|high-net-worth|stock trading/i.test(
        blob(intelligence?.identity),
      ) &&
      !/nail|beauty/i.test(blob(intelligence));
    result.pass = flagged && !trustedTrading;
    result.notes.push(
      flagged
        ? "discrepancy/confirmation path triggered"
        : "FAIL: no discrepancy flag",
    );
    if (trustedTrading) result.notes.push("FAIL: trusted trading claim over nail evidence");
    result.mainNiche = intelligence?.identity?.mainNiche;
    result.summary = intelligence?.summaryForCreator;
    return result;
  }

  if (edge.expectExtractionFailureOrThin) {
    // Re-run through opportunities only if analyse succeeded — still check honesty
    const failedExtractionMention =
      /couldn'?t read|unreadable|failed|extract|not enough|insufficient|unclear|add|upload/i.test(
        intelBlob,
      ) || intelligence?.insufficientEvidence;
    const hallucinated =
      /quantum physics professor|neurosurgery|award-winning filmmaker/i.test(
        intelBlob,
      );
    result.pass = failedExtractionMention && !hallucinated;
    result.notes.push(
      failedExtractionMention
        ? "reported thin/failed extraction path"
        : "FAIL: did not report extraction problems",
    );
    result.summary = intelligence?.summaryForCreator;
    result.tags = profile?.expertiseTags;
    return result;
  }

  if (edge.mustLabelPricingHonestly) {
    if (!analyse.ok) {
      result.pass = false;
      result.notes.push(analyse.payload.error || "analyse failed");
      return result;
    }
    const niche =
      profile?.expertiseTags?.[0] ||
      intelligence?.identity?.mainNiche ||
      "Astrology";
    const opps = await postJson("/api/generate-opportunities", {
      profile,
      goals: GOALS,
      niche,
      language: "English",
      resources: edge.resources || [],
      existingIntelligence: intelligence,
      guidedContext: { niche, description: edge.description },
    });
    if (!opps.ok) {
      result.pass = false;
      result.notes.push(opps.payload.error || "opportunities failed");
      return result;
    }
    const research = opps.payload.research;
    const bases = (opps.payload.opportunities || []).map((o) => o.pricingBasis);
    const honest =
      research?.mode === "ai_estimate_only" ||
      research?.status === "unavailable" ||
      research?.status === "insufficient" ||
      bases.every((b) => b === "ai_estimate") ||
      (research?.mode === "external_research" &&
        bases.some((b) => b === "researched_comparables"));
    // Pass if either researched with proper label OR estimate with proper label
    const falselyResearched =
      bases.includes("researched_comparables") &&
      (!research?.findingCount || research.findingCount === 0);
    result.pass = honest && !falselyResearched;
    result.notes.push(
      `research=${research?.mode}/${research?.status} findings=${research?.findingCount} bases=${bases.join(",")}`,
    );
    result.opportunities = (opps.payload.opportunities || []).map((o) => ({
      name: o.productName,
      priceInr: o.suggestedPriceInr || o.priceInr?.min,
      pricingBasis: o.pricingBasis,
    }));
    return result;
  }

  result.notes.push("unhandled edge type");
  return result;
}

function printScorecard(result) {
  const sc = result.scorecard;
  if (!sc) return;
  console.log("   Scorecard (1–5):");
  for (const [k, v] of Object.entries(sc.scores)) {
    console.log(`     ${k}: ${v}`);
  }
  console.log(
    `   Average: ${sc.average} | MVP gate: ${sc.pass ? "PASS" : "FAIL"} | Benchmark (≥4 + evidence): ${sc.benchmarkPass ? "PASS" : "FAIL"}`,
  );
  for (const note of sc.notes) console.log(`   · ${note}`);
  for (const f of sc.failures) console.log(`   ✗ ${f}`);
}

async function main() {
  console.log(`Evidence scenario tests → ${base}\n`);

  try {
    await fetch(`${base}/api/instagram/status`);
  } catch {
    console.error("Server not reachable. Start with: npm run dev");
    process.exit(1);
  }

  let scenarios = [];
  if (onlyId) {
    scenarios = [...ALL_SCENARIOS, ...EDGE_CASES].filter(
      (s) => s.id === onlyId || s.matrixId === onlyId,
    );
    if (scenarios.length === 0) {
      console.error(`No scenario matched ${onlyId}`);
      process.exit(1);
    }
  } else if (args.includes("--edges-only")) {
    scenarios = [];
  } else if (runAllScenarios) {
    scenarios = ALL_SCENARIOS;
  }

  // Default path already has Scenario 3 first in ALL_SCENARIOS
  if (!onlyId && args.includes("--start-neha")) {
    scenarios = [
      SCENARIO_03_COOKING,
      ...ALL_SCENARIOS.filter((s) => s.id !== SCENARIO_03_COOKING.id),
    ];
  }

  const results = [];
  let failed = 0;

  for (const scenario of scenarios) {
    process.stdout.write(`→ ${scenario.matrixId} ${scenario.id} (${scenario.creatorName})... `);
    const started = Date.now();
    try {
      const result = await runFullScenario(scenario);
      result.durationMs = Date.now() - started;
      results.push(result);
      const mark = result.pass ? "PASS" : "FAIL";
      console.log(`${mark} (${Math.round(result.durationMs / 1000)}s)`);
      console.log(`   niche: ${result.mainNiche} | tags: ${(result.tags || []).join(", ")}`);
      console.log(`   summary: ${(result.summary || "").slice(0, 140)}`);
      if (result.audienceProblems?.length) {
        console.log(`   audience: ${result.audienceProblems.slice(0, 3).join(" | ")}`);
      }
      if (result.knowledgeAssets?.length) {
        console.log(`   assets: ${result.knowledgeAssets.slice(0, 4).join(" | ")}`);
      }
      if (result.opportunities) {
        for (const o of result.opportunities) {
          console.log(
            `   • ${o.name} (${o.format}) ₹${o.priceInr} [${o.pricingBasis}] ev=${o.evidenceCount}`,
          );
        }
      }
      if (result.storefront?.sharePath) {
        console.log(`   storefront: ${result.storefront.sharePath}`);
      }
      printScorecard(result);
      if (!result.pass) failed += 1;
    } catch (error) {
      failed += 1;
      console.log("ERROR");
      console.log(`   ${error instanceof Error ? error.message : error}`);
      results.push({
        id: scenario.id,
        pass: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    console.log("");
  }

  if (runEdges || args.includes("--edges-only")) {
    console.log("── Edge cases T07–T10 ──\n");
    for (const edge of EDGE_CASES) {
      process.stdout.write(`→ ${edge.matrixId} ${edge.id}... `);
      const started = Date.now();
      try {
        const result = await runEdge(edge);
        result.durationMs = Date.now() - started;
        results.push(result);
        console.log(`${result.pass ? "PASS" : "FAIL"} (${Math.round(result.durationMs / 1000)}s)`);
        for (const note of result.notes || []) console.log(`   · ${note}`);
        if (result.opportunities) {
          for (const o of result.opportunities) {
            console.log(`   • ${o.name} ₹${o.priceInr} [${o.pricingBasis}]`);
          }
        }
        if (!result.pass) failed += 1;
      } catch (error) {
        failed += 1;
        console.log("ERROR");
        console.log(`   ${error instanceof Error ? error.message : error}`);
      }
      console.log("");
    }
  }

  console.log("═══ Summary ═══");
  const scored = results.filter((r) => r.scorecard);
  for (const r of scored) {
    console.log(
      `${r.pass ? "✓" : "✗"} ${r.matrixId} ${r.id} avg=${r.scorecard.average} fit=${r.scorecard.scores.productFit} evidence=${r.scorecard.scores.evidenceQuality}${r.benchmarkPass ? " ★benchmark" : ""}`,
    );
  }
  const edges = results.filter((r) => String(r.matrixId || "").startsWith("T0") && Number(String(r.matrixId).slice(1)) >= 7);
  for (const r of edges) {
    if (r.scorecard) continue;
    console.log(`${r.pass ? "✓" : "✗"} ${r.matrixId} ${r.id}`);
  }

  console.log(
    JSON.stringify(
      {
        failed,
        results: results.map((r) => ({
          id: r.id,
          matrixId: r.matrixId,
          pass: r.pass,
          benchmarkPass: r.benchmarkPass,
          average: r.scorecard?.average,
          scores: r.scorecard?.scores,
          opportunities: r.opportunities,
          research: r.research,
          storefront: r.storefront,
          notes: r.scorecard?.notes || r.notes,
          failures: r.scorecard?.failures,
          error: r.error,
        })),
      },
      null,
      2,
    ),
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
