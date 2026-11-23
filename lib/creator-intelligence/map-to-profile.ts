import type { CreatorIntelligence } from "@/lib/creator-intelligence/schemas";
import {
  CreatorProfileSchema,
  IntelligenceBriefSchema,
  type CreatorProfile,
  type IntelligenceBrief,
} from "@/lib/schemas";

export function intelligenceToBrief(
  intelligence: CreatorIntelligence,
): IntelligenceBrief {
  const observed = [
    ...intelligence.identity.consistentTopics,
    ...intelligence.expertise.subjectsExplained,
    ...intelligence.content.commonThemes,
    ...intelligence.audience.visibleProblems,
  ]
    .filter((i) => i.classification === "observed")
    .map((i) => i.insight)
    .slice(0, 6);

  const inferred = [
    ...intelligence.identity.consistentTopics,
    ...intelligence.expertise.skillsDemonstrated,
    ...intelligence.audience.potentialSegments,
    ...intelligence.content.commonThemes,
  ]
    .filter(
      (i) =>
        i.classification === "inferred" || i.classification === "unverified",
    )
    .map((i) => i.insight)
    .slice(0, 6);

  return IntelligenceBriefSchema.parse({
    summary: intelligence.summaryForCreator,
    mainNiche: intelligence.identity.mainNiche,
    expertise: intelligence.expertise.subjectsExplained
      .map((i) => i.insight)
      .slice(0, 6),
    themes: [
      ...intelligence.content.contentPillars.map((i) => i.insight),
      ...intelligence.content.commonThemes.map((i) => i.insight),
    ].slice(0, 6),
    knowledgeAssets: intelligence.knowledgeAssets
      .map((a) => a.label)
      .slice(0, 6),
    audienceProblems: intelligence.audience.visibleProblems
      .map((i) => i.insight)
      .slice(0, 6),
    needsConfirmation: intelligence.audience.gapsRequiringConfirmation.slice(
      0,
      4,
    ),
    observed,
    inferred,
    insufficientEvidence: intelligence.insufficientEvidence,
    followUpQuestion: intelligence.followUpQuestion,
  });
}

function takeInsights(
  items: Array<{ insight: string; classification: string }>,
  classification?: string,
  max = 4,
): string[] {
  return items
    .filter((i) =>
      classification ? i.classification === classification : true,
    )
    .map((i) => i.insight)
    .filter(Boolean)
    .slice(0, max);
}

const GENERIC_TAGS = new Set([
  "creator",
  "creator expertise",
  "unknown",
  "unspecified insight",
  "knowledge asset",
  "practical tips",
  "beginner-friendly",
]);

function isGenericTag(value: string): boolean {
  return GENERIC_TAGS.has(value.toLowerCase().trim());
}

/** Turn a Stage A insight sentence into a short chip; never drop useful niche signal. */
function toTag(value: string): string | null {
  let tag = value
    .replace(/\s+/g, " ")
    .replace(/[.。].*$/, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
  if (!tag) return null;

  if (tag.length > 48) {
    const clause = tag.split(/[,:;–—|/]/)[0]?.trim() || tag;
    tag = clause;
  }
  if (tag.length > 48) {
    tag = tag.split(/\s+/).slice(0, 5).join(" ");
  }
  if (tag.length < 2) return null;
  if (tag.length > 48) tag = tag.slice(0, 45).trimEnd();
  return tag;
}

function dedupeTags(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    if (!raw?.trim()) continue;
    const tag = toTag(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

const PROSE_STOP = new Set([
  "you",
  "your",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "create",
  "creates",
  "creating",
  "content",
  "people",
  "looking",
  "help",
  "helps",
  "through",
  "clear",
  "practical",
  "beginner-friendly",
  "young",
  "indians",
  "focusing",
  "topics",
  "like",
  "about",
]);

/** Recover niche chips when Stage A left insight arrays empty but wrote a useful summary. */
function tagsFromProse(text: string): string[] {
  if (!text?.trim()) return [];
  const topicChunk =
    text.match(/topics like ([^.]+)/i)?.[1] ||
    text.match(/focusing on ([^.]+)/i)?.[1] ||
    text.match(/covering ([^.]+)/i)?.[1] ||
    text.match(/about ([^.]+)/i)?.[1] ||
    "";

  const parts = (topicChunk || text)
    .split(/,|\/|&|\band\b/i)
    .map((part) =>
      part
        .replace(
          /\b(you create|beginner-friendly|personal|content|for|young|indians|on Instagram.*)$/gi,
          "",
        )
        .trim(),
    )
    .filter((part) => {
      if (part.length < 3 || part.length > 48) return false;
      const words = part.toLowerCase().split(/\s+/);
      return words.some((w) => !PROSE_STOP.has(w));
    });

  return dedupeTags(parts).filter((tag) => !isGenericTag(tag));
}

/**
 * Project Stage A intelligence into the existing CreatorProfile shape
 * used by review UI and storefront generation.
 */
export function intelligenceToCreatorProfile(
  intelligence: CreatorIntelligence,
  options?: { existing?: CreatorProfile; nicheHint?: string },
): CreatorProfile {
  const nicheHint = options?.nicheHint?.trim();
  const observed = [
    ...takeInsights(intelligence.identity.consistentTopics, "observed"),
    ...takeInsights(intelligence.expertise.subjectsExplained, "observed"),
    ...takeInsights(intelligence.content.commonThemes, "observed"),
    ...takeInsights(intelligence.audience.visibleProblems, "observed", 2),
  ].slice(0, 8);

  const inferred = [
    ...takeInsights(intelligence.identity.consistentTopics, "inferred"),
    ...takeInsights(intelligence.expertise.skillsDemonstrated, "inferred"),
    ...takeInsights(intelligence.audience.potentialSegments, "inferred"),
    ...takeInsights(intelligence.content.commonThemes, "inferred", 2),
  ].slice(0, 8);

  const proseTags = tagsFromProse(
    [
      intelligence.summaryForCreator,
      intelligence.identity.potentialPositioning,
      options?.existing?.positioningStatement || "",
    ].join(". "),
  );

  const subjectTags = dedupeTags([
    ...intelligence.expertise.subjectsExplained.map((i) => i.insight),
    ...intelligence.content.contentPillars.map((i) => i.insight),
    ...intelligence.content.commonThemes.map((i) => i.insight),
    ...intelligence.identity.secondaryNiches,
    ...intelligence.identity.consistentTopics.map((i) => i.insight),
    ...proseTags,
  ]).filter((tag) => !isGenericTag(tag));

  const mainNicheTag = toTag(intelligence.identity.mainNiche || "");
  const nicheHintTag = nicheHint ? toTag(nicheHint) : null;

  const resolvedNiche =
    (nicheHintTag && !isGenericTag(nicheHintTag) ? nicheHintTag : undefined) ||
    (mainNicheTag && !isGenericTag(mainNicheTag) ? mainNicheTag : undefined) ||
    subjectTags[0] ||
    nicheHintTag ||
    "Creator";

  const uniqueTags = dedupeTags([
    resolvedNiche,
    ...subjectTags,
    intelligence.audience.visibleProblems[0]?.insight || "",
  ]).filter((tag) => !isGenericTag(tag) || tag === resolvedNiche);

  // Soft fillers only when Stage A left us thin — never crowd out real niche tags.
  const fillers = ["Practical tips", "Beginner-friendly"];
  for (const filler of fillers) {
    if (uniqueTags.length >= 2) break;
    if (uniqueTags.some((u) => u.toLowerCase() === filler.toLowerCase())) continue;
    uniqueTags.push(filler);
  }

  // Last resort: two distinct labels — never duplicate the same chip.
  if (uniqueTags.length === 0) {
    uniqueTags.push(resolvedNiche, "Practical tips");
  } else if (uniqueTags.length === 1) {
    uniqueTags.push(
      uniqueTags[0].toLowerCase() === "practical tips"
        ? "Beginner-friendly"
        : "Practical tips",
    );
  }

  const genericPositioning =
    "Practical help grounded in what this creator already shares.";
  const positioning =
    intelligence.identity.potentialPositioning &&
    intelligence.identity.potentialPositioning !== genericPositioning
      ? intelligence.identity.potentialPositioning
      : options?.existing?.positioningStatement ||
        (resolvedNiche !== "Creator"
          ? `Helps people with ${resolvedNiche.toLowerCase()} through clear, practical guidance.`
          : intelligence.summaryForCreator || genericPositioning);

  const audience =
    intelligence.audience.explicitAudienceRefs[0]?.insight ||
    intelligence.audience.potentialSegments[0]?.insight ||
    options?.existing?.potentialAudience ||
    (resolvedNiche !== "Creator"
      ? `People looking for practical ${resolvedNiche.toLowerCase()} help`
      : "People looking for practical, beginner-friendly help");

  const contentValue =
    intelligence.content.commonThemes[0]?.insight ||
    intelligence.expertise.subjectsExplained[0]?.insight ||
    options?.existing?.contentValue ||
    (resolvedNiche !== "Creator"
      ? `Clear ${resolvedNiche.toLowerCase()} guidance from lived experience`
      : "Practical knowledge shared from lived experience");

  const assetsNote = intelligence.knowledgeAssets.length
    ? `Knowledge assets noticed: ${intelligence.knowledgeAssets
        .slice(0, 3)
        .map((a) => a.label)
        .join(", ")}.`
    : "";

  return CreatorProfileSchema.parse({
    positioningStatement: positioning,
    expertiseTags: uniqueTags.slice(0, 8),
    potentialAudience: audience,
    contentValue,
    potentialPositioning:
      intelligence.capabilities.capableOfDelivering[0]?.insight ||
      positioning,
    insightBasis: [
      intelligence.summaryForCreator,
      assetsNote,
      intelligence.insufficientEvidence
        ? "Evidence was limited — treat this as a draft."
        : "Grounded in creator-supplied resources and answers.",
    ]
      .filter(Boolean)
      .join(" "),
    observedSignals: observed.length
      ? observed
      : options?.existing?.observedSignals || [],
    inferredSignals: inferred.length
      ? inferred
      : options?.existing?.inferredSignals || [],
    needsClarification: intelligence.insufficientEvidence,
    clarificationPrompt: intelligence.followUpQuestion,
    intelligenceBrief: intelligenceToBrief(intelligence),
  });
}
