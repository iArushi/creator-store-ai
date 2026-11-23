/**
 * Evidence-driven assignment scenarios (fictional but realistic).
 * Content samples are uploaded as text resources so Stage A must analyse
 * material — not just a niche label.
 */

function textResource(id, title, text) {
  return { id, type: "text", title, text };
}

function postsAsResources(posts) {
  return posts.map((p, i) =>
    textResource(`post_${i + 1}`, p.title || `Post ${i + 1}`, p.body),
  );
}

/** Scenario 1 — Finance with Riya (FIN-01) */
export const SCENARIO_01_FINANCE = {
  id: "T01-FIN-01",
  matrixId: "T01",
  assignmentPersona: "primary",
  niche: "Finance",
  language: "Hinglish",
  creatorName: "Finance with Riya",
  handle: "@financewithriya",
  followers: 24000,
  city: "Bengaluru",
  bio: "Making personal finance and investing easier for beginners. Learn about SIPs, savings and money management.",
  description:
    "Finance with Riya — 24K Instagram, Bengaluru. Making personal finance and investing easier for beginners. Learn about SIPs, savings and money management.",
  resources: [
    ...postsAsResources([
      {
        title: "Post 1 — SIP basics",
        body: "SIP kya hota hai? Let's understand it with a ₹500 monthly example. A Systematic Investment Plan lets beginners invest a fixed amount every month in mutual funds. Start small, stay consistent. Educational only — not personalised investment advice.",
      },
      {
        title: "Post 2 — Early mistakes",
        body: "5 financial mistakes I made when I started earning: 1) No emergency fund 2) Ignoring insurance 3) Lifestyle creep 4) Waiting to 'know enough' before investing 5) No monthly budget. Share if this hits home.",
      },
      {
        title: "Post 3 — Emergency vs investing",
        body: "Emergency fund vs investing: which should you prioritise? Build 3–6 months of expenses first, then start SIPs. Both matter — sequence matters more for beginners.",
      },
      {
        title: "Post 4 — Mutual fund terms carousel",
        body: "Carousel: Common mutual fund terminology explained simply — NAV, expense ratio, equity vs debt, SIP vs lumpsum, exit load. Save this for later.",
      },
    ]),
    textResource(
      "audience_comments",
      "Audience comments",
      [
        "How much should a beginner save every month?",
        "I don't understand mutual funds. Where should I start?",
        "Can you share a simple monthly budget format?",
      ].join("\n"),
    ),
  ],
  mustDiscover: [
    "beginner",
    "sip",
    "budget",
    "money",
    "finance",
    "invest",
    "literacy",
    "saving",
  ],
  mustDiscoverMin: 3,
  opportunityHints: [
    "toolkit",
    "budget",
    "workshop",
    "guide",
    "beginner",
    "sip",
    "money",
    "finance",
    "template",
  ],
  opportunityHintMin: 1,
  forbid: [
    /guaranteed returns?/i,
    /sure[- ]shot/i,
    /SEBI[- ]registered advisor/i,
    /will make you rich/i,
    /buy this (stock|mutual fund) now/i,
  ],
  priceBandInr: [99, 5000],
  preferredPriceCeiling: 1500,
  expectEducationalNotAdvice: true,
};

/** Scenario 2 — Fit with Ananya */
export const SCENARIO_02_FITNESS = {
  id: "T02-FIT-ANANYA",
  matrixId: "T02",
  assignmentPersona: "primary",
  niche: "Fitness",
  language: "English",
  creatorName: "Fit with Ananya",
  handle: "@fitwithananya",
  followers: 11500,
  city: "Pune",
  bio: "Sharing my fitness journey. Home workouts, simple routines and staying consistent.",
  description:
    "I am not a certified trainer. I just enjoy working out and sharing what has worked for me. I post home workouts, simple routines and consistency tips for beginners.",
  resources: [
    ...postsAsResources([
      {
        title: "Post 1 — 20-min home workout",
        body: "My 20-minute home workout when I don't have time for the gym: warm-up, squats, push-ups on knees, planks, cool-down. No equipment. This is what works for me — not medical advice.",
      },
      {
        title: "Post 2 — Beginner exercises",
        body: "Five beginner-friendly exercises you can do without equipment: bodyweight squats, wall push-ups, glute bridges, bird-dog, marching in place. Film yourself and celebrate small wins.",
      },
      {
        title: "Post 3 — Consistency",
        body: "How I stay consistent even with a full-time job: schedule workouts like meetings, keep sessions under 25 minutes, track streaks in a notes app, never miss twice.",
      },
      {
        title: "Post 4 — Weekly schedule",
        body: "Weekly workout schedule for beginners: Mon full-body, Tue walk, Wed core, Thu rest/mobility, Fri full-body, Sat optional fun movement, Sun rest.",
      },
    ]),
  ],
  mustDiscover: [
    "home",
    "workout",
    "beginner",
    "consistent",
    "fitness",
    "routine",
    "habit",
  ],
  mustDiscoverMin: 3,
  opportunityHints: [
    "tracker",
    "planner",
    "journal",
    "habit",
    "home",
    "beginner",
    "routine",
    "consistency",
  ],
  opportunityHintMin: 1,
  forbid: [
    /certified (fitness )?coach/i,
    /certified trainer/i,
    /personal trainer qualification/i,
    /physiotherapist/i,
    /medical advice/i,
    /guaranteed results/i,
  ],
  mustNotClaimQualification: true,
  priceBandInr: [99, 5000],
  preferredPriceCeiling: 1500,
};

/** Scenario 3 — Ghar Ka Khana with Neha (START HERE) */
export const SCENARIO_03_COOKING = {
  id: "T03-COOK-NEHA",
  matrixId: "T03",
  assignmentPersona: "primary",
  niche: "Cooking",
  language: "Hinglish",
  creatorName: "Ghar Ka Khana with Neha",
  handle: "@gharkakhana.neha",
  followers: 38000,
  city: "Jaipur",
  bio: "Easy Indian recipes, affordable meals and everyday kitchen hacks.",
  description:
    "Ghar Ka Khana with Neha — 38K Instagram, Jaipur. Easy Indian recipes, affordable meals and everyday kitchen hacks for small families.",
  resources: [
    ...postsAsResources([
      {
        title: "Post 1 — Lunchbox under ₹100",
        body: "5 lunchbox recipes under ₹100: poha bento, leftover dal paratha wrap, veggie upma, chana salad bowl, curd rice with pickle. Budget-friendly desi meals for office/school.",
      },
      {
        title: "Post 2 — Prep basics in one hour",
        body: "How to prepare a week's worth of basic ingredients in one hour: chop onions/tomatoes, boil chana, make tadka base, freeze roti dough balls, portion spices. Sunday prep = weekday peace.",
      },
      {
        title: "Post 3 — Leftover rotis",
        body: "Three ways to use leftover rotis: roti chaat, leftover roti upma, cheesy roti pizza. Zero waste kitchen hacks for Indian homes.",
      },
      {
        title: "Post 4 — Grocery planning carousel",
        body: "Monthly grocery-planning carousel for a small family: staples list, weekly veg budget, protein rotation, spice restock cadence, and a sample ₹4,000–5,000 monthly plan.",
      },
    ]),
    textResource(
      "audience_comments",
      "Audience comments",
      [
        "Please share the full weekly meal plan.",
        "Can you make a vegetarian budget meal chart?",
        "How do I plan meals for a family of four?",
      ].join("\n"),
    ),
  ],
  mustDiscover: [
    "meal",
    "budget",
    "grocery",
    "plan",
    "afford",
    "indian",
    "leftover",
    "recipe",
    "kitchen",
  ],
  mustDiscoverMin: 3,
  /** Critical: meal-planning signal from evidence, not just recipes */
  opportunityHints: [
    "meal plan",
    "meal-plan",
    "planner",
    "grocery",
    "budget",
    "prep",
    "toolkit",
    "workshop",
    "chart",
  ],
  opportunityHintMin: 1,
  preferMealPlanningOverGenericEbook: true,
  forbid: [/Michelin/i, /professional chef certification/i],
  priceBandInr: [99, 3000],
  preferredPriceCeiling: 999,
};

/** Scenario 4 — Design Simplified by Kabir */
export const SCENARIO_04_DESIGN = {
  id: "T04-DESIGN-KABIR",
  matrixId: "T04",
  assignmentPersona: "primary",
  niche: "Design",
  language: "English",
  creatorName: "Design Simplified by Kabir",
  handle: "@designsimplified",
  followers: 16800,
  city: "Mumbai",
  bio: "Making design accessible. Canva tutorials, branding and content design for small businesses.",
  description:
    "Design Simplified by Kabir — Canva tutorials, branding and content design for small businesses in Mumbai.",
  resources: [
    ...postsAsResources([
      {
        title: "Post 1 — Canva Instagram post",
        body: "Create a professional Instagram post using Canva: pick a brand-safe template, lock your colour palette, use consistent fonts, export at 1080x1350. Step-by-step for non-designers.",
      },
      {
        title: "Post 2 — Branding mistakes",
        body: "Five mistakes small businesses make in their branding: random fonts, low-contrast logos, inconsistent colours, stocky clipart overload, no content calendar alignment.",
      },
      {
        title: "Post 3 — Colour palette",
        body: "How to create a consistent brand colour palette: primary, secondary, accent, neutrals. Test on Canva posts and WhatsApp catalogue images before printing.",
      },
      {
        title: "Post 4 — Café feed redesign",
        body: "Before-and-after redesign of a local café's Instagram feed: unified warm palette, menu highlight templates, weekly offer frames, consistent logo placement.",
      },
    ]),
    textResource(
      "audience_comments",
      "Audience comments",
      [
        "Can you share your Canva templates?",
        "How do I create a brand identity for my small business?",
        "Can you teach us how to make a social media content calendar?",
      ].join("\n"),
    ),
  ],
  mustDiscover: [
    "canva",
    "brand",
    "template",
    "small business",
    "design",
    "content",
    "instagram",
  ],
  mustDiscoverMin: 3,
  opportunityHints: [
    "template",
    "canva",
    "brand",
    "kit",
    "calendar",
    "workshop",
    "library",
    "starter",
  ],
  opportunityHintMin: 1,
  preferAssetsOverAdvancedCourse: true,
  forbid: [/adobe certified/i, /senior art director/i],
  priceBandInr: [99, 5000],
  preferredPriceCeiling: 2499,
};

/** Scenario 5 — Study Smart with Aditi */
export const SCENARIO_05_EXAM = {
  id: "T05-EXAM-ADITI",
  matrixId: "T05",
  assignmentPersona: "primary",
  niche: "Exam prep",
  language: "Hinglish",
  creatorName: "Study Smart with Aditi",
  handle: "@studysmart.aditi",
  followers: 72000,
  city: "Lucknow",
  bio: "Making competitive exam preparation simpler. Study techniques, English practice and revision tips.",
  description:
    "Study Smart with Aditi — competitive exam prep: study techniques, English practice and revision tips. 72K followers, Lucknow.",
  resources: [
    ...postsAsResources([
      {
        title: "Post 1 — Vocab in 15 minutes",
        body: "How to revise vocabulary in 15 minutes a day: 10 new words, 5 revision cards, one example sentence each. Consistency beats cramming for competitive exams.",
      },
      {
        title: "Post 2 — Grammar mistakes",
        body: "Common English grammar mistakes in competitive exams: subject-verb agreement, articles, prepositions, tense consistency, commonly confused pairs.",
      },
      {
        title: "Post 3 — Weekly timetable",
        body: "My weekly study timetable: morning vocab, afternoon practice sets, evening revision + error log. Built for aspirants juggling college or jobs.",
      },
      {
        title: "Post 4 — Confused words carousel",
        body: "Carousel of 20 commonly confused English words with one-line meanings and exam-style usage examples. Save and revise before mocks.",
      },
    ]),
    textResource(
      "audience_comments",
      "Audience comments",
      [
        "Can you share more practice questions?",
        "How do I revise everything before my exam?",
        "Please share your study planner.",
      ].join("\n"),
    ),
  ],
  mustDiscover: [
    "exam",
    "english",
    "vocab",
    "revision",
    "study",
    "grammar",
    "practice",
    "competitive",
  ],
  mustDiscoverMin: 3,
  opportunityHints: [
    "workbook",
    "planner",
    "vocab",
    "practice",
    "revision",
    "challenge",
    "english",
  ],
  opportunityHintMin: 1,
  forbid: [
    /guaranteed selection/i,
    /sure[- ]shot (rank|result|selection)/i,
    /100% result/i,
    /crack any exam for sure/i,
  ],
  preferSpecificLearningResources: true,
  priceBandInr: [99, 5000],
  preferredPriceCeiling: 1999,
};

/** Scenario 6 — Meera Sharma, teacher without social */
export const SCENARIO_06_TEACHER = {
  id: "T06-TEACHER-MEERA",
  matrixId: "T06",
  assignmentPersona: "secondary",
  niche: "Education",
  language: "English",
  creatorName: "Meera Sharma",
  handle: null,
  followers: 0,
  city: null,
  bio: null,
  description:
    "I have been teaching mathematics to students from classes 8–10 for 12 years. I am good at explaining difficult concepts in simple ways. I also make worksheets for my students and help weaker students improve their understanding. I do not have a meaningful social media following.",
  resources: [
    textResource(
      "doc_worksheet",
      "Chapter-wise mathematics worksheet — Class 9 Algebra",
      `CLASS 9 — ALGEBRA WORKSHEET (Meera Sharma)
Chapter: Linear Equations in Two Variables
Q1. Solve: 2x + 3y = 12; x − y = 1
Q2. Form equations from word problems about age and tickets.
Q3. Plot points and identify the line.
Includes answer key with step-by-step working for weaker students.`,
    ),
    textResource(
      "doc_practice_pdf",
      "Practice questions and worked solutions",
      `PRACTICE PACK — Polynomials & Factorisation
10 graded questions from easy to exam-level.
Worked solutions show common mistakes (sign errors, incomplete factorisation).
Designed for Class 8–10 remedial support.`,
    ),
    textResource(
      "doc_lesson_plan",
      "Sample remedial lesson plan",
      `REMEDIAL LESSON PLAN — 40 minutes
Objective: Rebuild confidence with algebraic simplification.
Warm-up (5): mental maths.
Teach (12): board examples with colour coding of like terms.
Guided practice (15): worksheet pairs.
Exit ticket (8): 3 questions, mark misconceptions.`,
    ),
    textResource(
      "doc_handwritten_notes",
      "Handwritten explanation of algebraic concepts",
      `Notes (transcribed from handwritten page):
Like terms vs unlike terms.
Distributive property examples.
Why we balance both sides of an equation.
Analogy: shopping bags for combining terms.
Student tip: always write the next line under the previous for clarity.`,
    ),
  ],
  mustDiscover: [
    "math",
    "algebra",
    "worksheet",
    "class",
    "teach",
    "student",
    "remedial",
    "practice",
  ],
  mustDiscoverMin: 3,
  opportunityHints: [
    "worksheet",
    "practice",
    "pack",
    "workshop",
    "course",
    "algebra",
    "doubt",
    "mini-course",
    "bundle",
  ],
  opportunityHintMin: 1,
  mustWorkWithoutInstagram: true,
  forbid: [/instagram famous/i, /influencer/i],
  priceBandInr: [99, 5000],
  preferredPriceCeiling: 1499,
};

/** Edge T07 — one sentence only */
export const EDGE_T07_ONE_SENTENCE = {
  id: "T07-ONE-SENTENCE",
  matrixId: "T07",
  assignmentPersona: "edge",
  niche: "Unknown",
  language: "English",
  creatorName: "Unknown",
  handle: null,
  description: "I make content sometimes.",
  resources: [],
  expectFollowUp: true,
  expectInsufficientOrThin: true,
  forbidHallucinatedNiche: true,
};

/** Edge T08 — screenshots/posts contradict description */
export const EDGE_T08_CONTRADICTION = {
  id: "T08-CONTRADICTION",
  matrixId: "T08",
  assignmentPersona: "edge",
  niche: "Fitness",
  language: "English",
  creatorName: "Contradiction Test",
  handle: "@contradict.test",
  description:
    "I only teach advanced stock trading strategies for high-net-worth investors using options and futures.",
  resources: [
    textResource(
      "post_1",
      "Uploaded caption screenshot",
      "Today's reel: soft pastel nail art tutorial for beginners — nude base, flower stickers, at-home gel tips. Comment 'NAILS' for the product list.",
    ),
    textResource(
      "post_2",
      "Uploaded story screenshot",
      "Behind the scenes at my home nail studio. Booking bridal nail appointments this weekend in Indore.",
    ),
  ],
  expectDiscrepancyFlag: true,
  mustNotFullyTrustTradingClaim: true,
};

/** Edge T09 — unreadable / irrelevant upload */
export const EDGE_T09_UNREADABLE = {
  id: "T09-UNREADABLE",
  matrixId: "T09",
  assignmentPersona: "edge",
  niche: "Unknown",
  language: "English",
  creatorName: "Unreadable Upload",
  handle: null,
  description:
    "Please use my uploaded file to understand what I teach.",
  resources: [
    {
      id: "doc_corrupt",
      type: "document",
      title: "corrupted-upload.pdf",
      filename: "corrupted-upload.pdf",
      mimeType: "application/pdf",
      // Not a valid PDF — should fail extraction honestly
      dataUrl:
        "data:application/pdf;base64,VGhpcyBpcyBub3QgYSByZWFsIFBERiBmaWxlIGNvbnRlbnQh",
    },
    textResource(
      "noise",
      "Irrelevant paste",
      "asdf qwer zxcv lorem §±§±§ 111222333 binary garbage unrelated to any creator niche.",
    ),
  ],
  expectExtractionFailureOrThin: true,
  mustNotHallucinateExpertise: true,
};

/** Edge T10 — thin market research path (pricing must be labelled estimate when no sources) */
export const EDGE_T10_NO_MARKET = {
  id: "T10-PRICING-ESTIMATE",
  matrixId: "T10",
  assignmentPersona: "edge",
  niche: "Astrology",
  language: "English",
  creatorName: "Stars with Kavya",
  handle: "@starswithkavya",
  description:
    "I share gentle Vedic astrology explainers for beginners — birth chart basics, planetary periods in simple language, and journaling prompts. Educational, not predictive guarantees.",
  resources: [
    textResource(
      "post_1",
      "Post — chart basics",
      "Birth chart basics for beginners: houses, signs, and why we don't make fear-based predictions. Educational astrology literacy only.",
    ),
  ],
  mustLabelPricingHonestly: true,
  forbid: [/guaranteed prediction/i, /sure[- ]shot remedies/i],
  priceBandInr: [99, 5000],
};

export const PRIMARY_SCENARIOS = [
  SCENARIO_01_FINANCE,
  SCENARIO_02_FITNESS,
  SCENARIO_03_COOKING,
  SCENARIO_04_DESIGN,
  SCENARIO_05_EXAM,
];

export const ALL_SCENARIOS = [
  SCENARIO_03_COOKING, // recommended start
  SCENARIO_01_FINANCE,
  SCENARIO_02_FITNESS,
  SCENARIO_04_DESIGN,
  SCENARIO_05_EXAM,
  SCENARIO_06_TEACHER,
];

export const EDGE_CASES = [
  EDGE_T07_ONE_SENTENCE,
  EDGE_T08_CONTRADICTION,
  EDGE_T09_UNREADABLE,
  EDGE_T10_NO_MARKET,
];
