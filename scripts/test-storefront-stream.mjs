/**
 * Smoke-test SSE storefront generation progress.
 *
 * Usage:
 *   node --env-file=.env.local scripts/test-storefront-stream.mjs
 *   node --env-file=.env.local scripts/test-storefront-stream.mjs --fail
 */

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const failMode = process.argv.includes("--fail");

const validBody = {
  profile: {
    positioningStatement:
      "I help beginners cook affordable Indian weekday meals.",
    expertiseTags: ["meal planning", "budget cooking"],
    potentialAudience: "Busy parents cooking for a family of four",
    contentValue: "Weekly meal prep and leftover ideas",
    potentialPositioning: "Practical home cooking educator",
    insightBasis: "Stream progress test fixture",
    needsClarification: false,
  },
  goals: ["Earn from existing expertise"],
  selectedOpportunity: {
    productName: "30-Day Indian Meal Planner",
    format: "template pack",
    whoWouldBuy: "Parents planning weekday meals on a budget",
    problemSolved: "Deciding what to cook every day feels exhausting",
    customerOutcome: "A clear weekly meal plan they can reuse",
    whySuitable: "Matches their repeated meal-planning content",
    deliverables: ["Planner PDF", "Grocery checklist"],
    creationEffort: "medium",
    suggestedPriceInr: 249,
    priceInr: {
      min: 149,
      max: 299,
      rationale: "Accessible starter price for a digital planner",
    },
    pricingBasis: "ai_estimate",
    marketComparison: "Comparable planners sit in a similar INR band",
    assumptions: ["Buyer already follows their cooking tips"],
    confidence: "medium",
    storefrontPath: "/s/preview-meal-planner",
    scores: {
      expertiseFit: 5,
      audienceProblemRelevance: 5,
      deliveryFeasibility: 4,
      pricingAccessibility: 5,
      marketEvidence: 3,
      weightedTotal: 4.4,
      reasoning: "Strong fit to meal-planning expertise and audience asks.",
    },
  },
  language: "English",
  niche: "Cooking",
  instagramHandle: "@stream.test",
};

function parseSse(buffer) {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() || "";
  const events = [];
  for (const part of parts) {
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!data) continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      /* ignore */
    }
  }
  return { events, rest };
}

async function runSuccess() {
  console.log("→ streaming successful generation…");
  const response = await fetch(`${base}/api/generate-storefront?stream=1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(validBody),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const timeline = [];
  let storefront = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSse(buffer);
    buffer = parsed.rest;
    for (const event of parsed.events) {
      timeline.push(event);
      const label =
        event.type === "stage"
          ? `${event.stage}:${event.status}`
          : event.type;
      console.log(`   ${label}${event.message ? ` — ${event.message}` : ""}`);
      if (event.type === "complete") storefront = event.storefront;
      if (event.type === "error") throw new Error(event.error);
    }
  }

  const stages = ["preparing", "writing_bio", "assembling_products", "publishing"];
  for (const stage of stages) {
    const started = timeline.some(
      (e) => e.type === "stage" && e.stage === stage && e.status === "started",
    );
    const completed = timeline.some(
      (e) => e.type === "stage" && e.stage === stage && e.status === "completed",
    );
    if (!started || !completed) {
      throw new Error(`Missing real stage events for ${stage}`);
    }
  }

  // Ensure no stage completed before it started
  for (const stage of stages) {
    const startAt = timeline.findIndex(
      (e) => e.type === "stage" && e.stage === stage && e.status === "started",
    );
    const endAt = timeline.findIndex(
      (e) => e.type === "stage" && e.stage === stage && e.status === "completed",
    );
    if (endAt < startAt) throw new Error(`Stage ${stage} completed before start`);
  }

  if (!storefront?.slug) throw new Error("No storefront in complete event");

  const get = await fetch(`${base}/api/storefront/${storefront.slug}`);
  if (!get.ok) throw new Error(`Published slug not fetchable: ${storefront.slug}`);

  console.log(`PASS slug=/s/${storefront.slug}`);
  return true;
}

async function runFail() {
  console.log("→ streaming invalid request (expect error)…");
  const response = await fetch(`${base}/api/generate-storefront?stream=1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ profile: {}, goals: [] }),
  });

  // Validation errors return JSON 400 before the stream starts
  if (response.status === 400) {
    const payload = await response.json();
    console.log(`PASS early validation error: ${payload.error}`);
    return true;
  }

  if (!response.body) throw new Error("Expected body");
  const text = await response.text();
  if (text.includes('"type":"error"') || text.includes("error")) {
    console.log("PASS stream error event received");
    return true;
  }
  throw new Error(`Unexpected fail-mode response: ${response.status} ${text.slice(0, 200)}`);
}

async function main() {
  if (failMode) {
    await runFail();
  } else {
    await runSuccess();
    await runFail();
  }
}

main().catch((error) => {
  console.error("FAIL", error instanceof Error ? error.message : error);
  process.exit(1);
});
