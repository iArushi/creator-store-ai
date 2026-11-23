import { runCreatorIntelligencePipeline } from "@/lib/creator-intelligence";
import { fetchConnectedInstagramProfile } from "@/lib/instagram/profileSource";
import {
  AnalyseProfileRequestSchema,
  AnalyseProfileResponseSchema,
  resolveWhatTheyDo,
} from "@/lib/schemas";

export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AnalyseProfileRequestSchema.safeParse(body);

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

    const data = parsed.data;
    const resources =
      data.resources ||
      data.guided?.resources ||
      undefined;

    if (data.source === "guided") {
      if (!data.guided) {
        return Response.json(
          { error: "Guided answers are required for this source." },
          { status: 400 },
        );
      }

      const styles = [
        ...(data.guided.sharingStyles || []),
        ...(data.guided.customSharingStyle
          ? [data.guided.customSharingStyle]
          : []),
      ];
      const niche = resolveWhatTheyDo(data.guided);

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
          niche,
          sharingStyles: styles,
          peopleAskAbout: data.guided.peopleAskAbout,
          enjoyHelpingWith: data.guided.enjoyHelpingWith,
          conversationSummary: data.guided.conversationSummary,
          description: [
            data.guided.expertise,
            data.guided.whoTheyHelp,
            data.guided.audienceComesFor,
            data.guided.contentInsights?.summary
              ? `Content insights: ${data.guided.contentInsights.summary}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
        goals: ["Help me figure out what to sell"],
        language: data.language,
        nicheHint: niche,
        skipOpportunities: true,
      });

      const responseBody = AnalyseProfileResponseSchema.parse({
        profile: pipeline.profileDraft!,
        intelligence: pipeline.intelligence,
      });
      return Response.json(responseBody);
    }

    if (data.source === "description") {
      const description = data.description?.trim();
      if (!description || description.length < 12) {
        return Response.json(
          {
            error:
              "Add a short description of what you do, or answer a few questions instead.",
            fallback: "guided",
          },
          { status: 422 },
        );
      }

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
        guided: { description },
        goals: ["Help me figure out what to sell"],
        language: data.language,
        skipOpportunities: true,
      });

      const responseBody = AnalyseProfileResponseSchema.parse({
        profile: pipeline.profileDraft!,
        intelligence: pipeline.intelligence,
      });
      return Response.json(responseBody);
    }

    if (data.source === "instagram_connected") {
      const connected = await fetchConnectedInstagramProfile();
      if (!connected.available) {
        return Response.json(
          {
            error: connected.message,
            reason: connected.reason,
            fallback: "guided",
          },
          { status: 422 },
        );
      }

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
        instagram: {
          username: connected.profile.username,
          name: connected.profile.name,
          bio: connected.profile.biography,
          captions: connected.profile.captions,
        },
        goals: ["Help me figure out what to sell"],
        language: data.language,
        skipOpportunities: true,
      });

      const responseBody = AnalyseProfileResponseSchema.parse({
        profile: pipeline.profileDraft!,
        intelligence: pipeline.intelligence,
      });
      return Response.json(responseBody);
    }

    return Response.json(
      {
        error:
          "We can't read Instagram without connecting. Add a short description of what you do, or answer a few questions.",
        fallback: "guided",
      },
      { status: 422 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyse profile.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
