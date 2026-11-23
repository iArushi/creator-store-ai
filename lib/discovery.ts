import type { NicheOption } from "@/lib/schemas";

export const SHARING_STYLE_OPTIONS = [
  "Tips and tutorials",
  "Personal experiences",
  "Things I've learned",
  "Product recommendations",
  "How-to guides",
  "Daily routines",
  "Opinions and insights",
  "Something else",
] as const;

export type SharingStyleOption = (typeof SHARING_STYLE_OPTIONS)[number];

const ASK_EXAMPLES: Record<NicheOption, string[]> = {
  Fitness: [
    "How do I start working out at home?",
    "What should I eat before / after training?",
    "How do I stay consistent?",
  ],
  Cooking: [
    "Easy recipes for weeknights?",
    "How do I cook this with limited ingredients?",
    "Can you share your grocery list?",
  ],
  Finance: [
    "How do I start a SIP?",
    "How should I split my salary?",
    "Where does my money go every month?",
  ],
  "Exam prep": [
    "How do I make a study timetable?",
    "Which topics should I revise first?",
    "How do you stay motivated for months?",
  ],
  Astrology: [
    "What does this transit mean for me?",
    "How do I read my chart simply?",
    "Any remedies that feel practical?",
  ],
  Fashion: [
    "What should I wear for this occasion?",
    "How do I style basics?",
    "Where did you get that?",
  ],
  Design: [
    "How do I improve this layout?",
    "What tools do you use?",
    "How did you learn this skill?",
  ],
  Education: [
    "Can you explain this concept simply?",
    "How do I practice this?",
    "What should I learn next?",
  ],
  Other: [
    "How did you get started?",
    "Can you break this down for beginners?",
    "What would you do in my situation?",
  ],
};

const HELP_EXAMPLES: Record<NicheOption, string[]> = {
  Fitness: [
    "Building a simple beginner routine",
    "Feeling less lost in the gym",
    "Sticking to habits on busy weeks",
  ],
  Cooking: [
    "Cooking faster on weekdays",
    "Trying new recipes without stress",
    "Meal ideas for small kitchens",
  ],
  Finance: [
    "Making a first budget",
    "Starting small investments calmly",
    "Understanding money basics without jargon",
  ],
  "Exam prep": [
    "Planning revision without burnout",
    "Clearing weak topics",
    "Building exam-day confidence",
  ],
  Astrology: [
    "Making sense of charts simply",
    "Connecting astrology to daily choices",
    "Finding calm during uncertain phases",
  ],
  Fashion: [
    "Putting outfits together",
    "Shopping smarter for their body/budget",
    "Finding a personal style",
  ],
  Design: [
    "Cleaning up messy designs",
    "Learning practical design skills",
    "Building a small portfolio",
  ],
  Education: [
    "Understanding tough topics",
    "Practicing step by step",
    "Feeling less stuck while learning",
  ],
  Other: [
    "Getting unstuck as beginners",
    "Learning from your experience",
    "Making a clear next step",
  ],
};

export function askExamplesForNiche(niche?: string): string[] {
  if (niche && niche in ASK_EXAMPLES) {
    return ASK_EXAMPLES[niche as NicheOption];
  }
  return ASK_EXAMPLES.Other;
}

export function helpExamplesForNiche(niche?: string): string[] {
  if (niche && niche in HELP_EXAMPLES) {
    return HELP_EXAMPLES[niche as NicheOption];
  }
  return HELP_EXAMPLES.Other;
}

/** Map discovery answers into synthesis-friendly plain strings */
export function deriveGuidedSynthesisFields(input: {
  sharingStyles: string[];
  customSharingStyle?: string;
  peopleAskAbout: string;
  enjoyHelpingWith: string;
  conversationSummary?: string;
  contentInsightsSummary?: string;
}): {
  expertise: string;
  whoTheyHelp: string;
  audienceComesFor: string;
} {
  const styles = [
    ...input.sharingStyles.filter((s) => s !== "Something else"),
    ...(input.customSharingStyle?.trim()
      ? [input.customSharingStyle.trim()]
      : []),
  ];

  const expertiseParts = [
    styles.length > 0 ? `Loves sharing: ${styles.join(", ")}` : "",
    input.enjoyHelpingWith.trim()
      ? `Enjoys helping with: ${input.enjoyHelpingWith.trim()}`
      : "",
    input.conversationSummary?.trim()
      ? `Discovery chat: ${input.conversationSummary.trim()}`
      : "",
    input.contentInsightsSummary?.trim()
      ? `From their content: ${input.contentInsightsSummary.trim()}`
      : "",
  ].filter(Boolean);

  const audienceComesFor =
    input.peopleAskAbout.trim() ||
    input.conversationSummary?.trim() ||
    "People come to them for practical, beginner-friendly guidance.";

  const whoTheyHelp =
    input.enjoyHelpingWith.trim() ||
    (input.peopleAskAbout.trim()
      ? `People who ask about: ${input.peopleAskAbout.trim()}`
      : "People looking for clear, practical help from their experience.");

  return {
    expertise:
      expertiseParts.join(". ") ||
      "Still discovering — help them name what they naturally share.",
    whoTheyHelp,
    audienceComesFor,
  };
}
