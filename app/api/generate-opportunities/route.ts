import { connection } from "next/server";
import {
  CreatorIntelligenceSchema,
  intelligenceToBrief,
  runCreatorIntelligencePipeline,
} from "@/lib/creator-intelligence";
import {
  GenerateOpportunitiesRequestSchema,
  GenerateOpportunitiesResponseSchema,
  type MonetisationOpportunity,
} from "@/lib/schemas";

export const maxDuration = 90;

export async function POST(request: Request) {
  await connection();

  try {
    const body = await request.json();
    const parsed = GenerateOpportunitiesRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid request.",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const {
      profile,
      goals,
      instagramHandle,
      niche,
      language,
      resources,
      guidedContext,
      existingIntelligence,
      regenerateIndex,
      existingOpportunities,
    } = parsed.data;

    const parsedIntelligence = existingIntelligence
      ? CreatorIntelligenceSchema.safeParse(existingIntelligence)
      : null;

    const resolvedNiche =
      niche?.trim() ||
      profile.expertiseTags[0] ||
      guidedContext?.niche ||
      "Creator";

    const mode =
      typeof regenerateIndex === "number" &&
      existingOpportunities &&
      existingOpportunities.length === 3
        ? "one"
        : "all";

    const preserveSummary =
      mode === "one" && existingOpportunities
        ? [
            "Preserve these other opportunities (do not duplicate them):",
            ...existingOpportunities
              .filter((_, index) => index !== regenerateIndex)
              .map(
                (item, index) =>
                  `${index + 1}. ${item.productName} (${item.format}) — ${item.problemSolved}`,
              ),
          ].join("\n")
        : undefined;

    const pipeline = await runCreatorIntelligencePipeline({
      resources: resources?.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        filename: r.filename,
        mimeType: r.mimeType,
        url: r.url,
        text: r.text,
        dataUrl: r.dataUrl,
      })),
      guided: {
        niche: resolvedNiche,
        sharingStyles: guidedContext?.sharingStyles,
        peopleAskAbout: guidedContext?.peopleAskAbout,
        enjoyHelpingWith: guidedContext?.enjoyHelpingWith,
        conversationSummary: guidedContext?.conversationSummary,
        description:
          guidedContext?.description ||
          [
            profile.positioningStatement,
            profile.contentValue,
            profile.potentialAudience,
            profile.potentialPositioning,
            `Tags: ${profile.expertiseTags.join(", ")}`,
            profile.insightBasis,
            ...(profile.observedSignals || []),
            ...(profile.inferredSignals || []).map((s) => `(inferred) ${s}`),
          ].join("\n"),
      },
      instagram: instagramHandle
        ? { username: instagramHandle.replace(/^@/, "") }
        : undefined,
      existingProfile: profile,
      existingIntelligence: parsedIntelligence?.success
        ? parsedIntelligence.data
        : undefined,
      goals,
      language,
      nicheHint: resolvedNiche,
      mode,
      preserveSummary,
    });

    if (pipeline.intelligence.insufficientEvidence) {
      return Response.json(
        {
          error:
            pipeline.intelligence.followUpQuestion ||
            "Not enough creator evidence yet. Add a clearer note, screenshot, or link about what you teach.",
          followUpQuestion: pipeline.intelligence.followUpQuestion,
          intelligenceBrief: intelligenceToBrief(pipeline.intelligence),
          research: pipeline.researchMeta,
        },
        { status: 422 },
      );
    }

    let opportunities: MonetisationOpportunity[];

    if (mode === "one" && existingOpportunities && regenerateIndex !== undefined) {
      const replacement = pipeline.opportunities[0];
      if (!replacement) {
        throw new Error("AI did not return a replacement opportunity.");
      }
      opportunities = existingOpportunities.map((item, index) =>
        index === regenerateIndex ? replacement : item,
      );
    } else {
      opportunities = pipeline.opportunities;
    }

    if (opportunities.length !== 3) {
      return Response.json(
        {
          error:
            pipeline.validation.followUpQuestion ||
            "Could not produce three grounded opportunities from the available evidence.",
          followUpQuestion: pipeline.validation.followUpQuestion,
          intelligenceBrief: intelligenceToBrief(pipeline.intelligence),
          research: pipeline.researchMeta,
          validationWarnings: pipeline.validation.warnings,
        },
        { status: 422 },
      );
    }

    const response = GenerateOpportunitiesResponseSchema.parse({
      opportunities,
      research: pipeline.researchMeta,
      intelligenceBrief: intelligenceToBrief(pipeline.intelligence),
      validationWarnings: [
        ...pipeline.validation.warnings,
        ...pipeline.validation.issues,
      ],
      followUpQuestion: pipeline.validation.followUpQuestion,
    });

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate monetisation opportunities.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return Response.json(
      {
        error: message,
        tip: "Your goals and snapshot are still saved. Try again, or go back and add one concrete example of what you teach.",
      },
      { status },
    );
  }
}
