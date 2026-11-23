/**
 * Assignment personas grounded in PUBLICLY available creator bios / about pages.
 * We do NOT scrape Instagram HTML. Handles are labels only (same as the product's
 * description + @handle path). Bio/content text is paraphrased from public sources.
 *
 * Sources (public pages / directories — not private data):
 * - Persona A: Indian micro finance educators e.g. @fintax.pro, Fortune Box (@fortunebox.in)
 * - Persona B: Expert without an audience — description-only path (assignment secondary)
 * - Bonus: Exam-prep micro educator e.g. @abhi.why / UPSCprep-style public bios
 */

export const PRODUCT_FORMATS = [
  "digital files",
  "1-on-1 session",
  "membership",
  "event / webinar",
  "locked content",
  "course",
];

/** Primary persona: Indian micro-creator (5K–100K), mobile-first, INR price-sensitive. */
export const personaA_microFinanceCreator = {
  id: "persona-a-micro-finance",
  assignmentPersona: "primary_indian_micro_creator",
  publicReference: {
    handles: ["@fintax.pro", "@fortunebox.in"],
    note: "Fixtures use public bio themes (budgeting, tax literacy, SIP education). No scraping.",
    sources: [
      "https://www.linkedin.com/in/shristi-goel-b16674146",
      "https://www.flinque.com/creators/instagram/fortunebox.in/",
    ],
  },
  input: {
    path: "description",
    instagramHandle: "@fintax.pro",
    language: "English",
    description:
      "I create beginner-friendly personal finance and tax literacy content for young Indians on Instagram (@fintax.pro). I explain budgeting, salary money habits, income tax basics and GST in simple language for students and early professionals — educational only, not investment advice.",
  },
  expectations: {
    nicheHints: ["finance", "tax", "budget", "money", "sip", "salary"],
    forbidAdviceClaims: [
      /guaranteed returns?/i,
      /will make you rich/i,
      /sure[- ]shot profit/i,
      /personalised investment advice/i,
    ],
    minProducts: 2,
    maxProducts: 4,
    priceInrMin: 99,
    priceInrMax: 25000,
  },
};

/** Secondary persona: expert / coach with skills but little audience — description only. */
export const personaB_expertNoAudience = {
  id: "persona-b-expert-no-audience",
  assignmentPersona: "secondary_expert_without_audience",
  publicReference: {
    handles: [],
    note: "No Instagram worth analysing — pure self-description path from the brief.",
    sources: ["assignment brief §3 secondary persona"],
  },
  input: {
    path: "description",
    language: "Hinglish",
    description:
      "Main CA hoon, 8 saal se freelancers aur small business owners ko GST filing, invoices aur basic bookkeeping sikhati hoon. Audience chhoti hai social pe, lekin clients mujhse WhatsApp pe daily poochte hain kaise GST return avoid penalties ke saath file karein. Mujhe digital product banana hai beginners ke liye.",
  },
  expectations: {
    nicheHints: ["gst", "tax", "ca", "bookkeep", "invoice", "business", "finance"],
    forbidAdviceClaims: [/guaranteed returns?/i, /sure[- ]shot/i],
    minProducts: 2,
    maxProducts: 4,
    priceInrMin: 99,
    priceInrMax: 25000,
  },
};

/** Extra primary-niche coverage: exam prep micro creator (public @abhi.why style). */
export const personaA2_examPrepCreator = {
  id: "persona-a2-exam-prep",
  assignmentPersona: "primary_indian_micro_creator",
  publicReference: {
    handles: ["@abhi.why"],
    note: "Public UPSC-prep educator themes (affordable home prep guidance).",
    sources: ["https://www.instagram.com/abhi.why/"],
  },
  input: {
    path: "description",
    instagramHandle: "@abhi.why",
    language: "English",
    description:
      "I help UPSC aspirants preparing from home with structured revision plans, current-affairs routines and mock-test strategy. I share practical study systems on Instagram (@abhi.why) for first-attempt candidates who feel overwhelmed by the syllabus — clear plans, not shortcuts.",
  },
  expectations: {
    nicheHints: ["exam", "upsc", "study", "revision", "mock", "aspirant", "prep"],
    forbidAdviceClaims: [/guaranteed selection/i, /sure[- ]shot rank/i],
    minProducts: 2,
    maxProducts: 4,
    priceInrMin: 99,
    priceInrMax: 25000,
  },
};

export const ALL_PERSONAS = [
  personaA_microFinanceCreator,
  personaB_expertNoAudience,
  personaA2_examPrepCreator,
];
