import type { z } from "zod";

type TextContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: TextContent;
};

type GenerateJsonOptions<T> = {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
};

type GenerateJsonFromMessagesOptions<T> = {
  messages: ChatMessage[];
  schema: z.ZodType<T>;
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
};

async function callOpenAIChat(input: {
  messages: ChatMessage[];
  temperature: number;
  model?: string;
  json?: boolean;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local to enable AI generation.",
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:
        input.model ||
        process.env.OPENAI_VISION_MODEL ||
        process.env.OPENAI_MODEL ||
        "gpt-4o-mini",
      temperature: input.temperature,
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
      messages: input.messages,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${detail.slice(0, 240)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }
  return content;
}

function parseValidatedJson<T>(content: string, schema: z.ZodType<T>): T {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }

  const validated = schema.safeParse(parsedJson);
  if (!validated.success) {
    const detail = validated.error.issues
      .slice(0, 4)
      .map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "root";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
    throw new Error(
      `We couldn't finish analysing your answers (${detail}). Try again, or add a short note / screenshot.`,
    );
  }

  return validated.data;
}

export async function generateJsonWithOpenAI<T>({
  system,
  user,
  schema,
  temperature = 0.5,
  model,
  signal,
}: GenerateJsonOptions<T>): Promise<T> {
  const content = await callOpenAIChat({
    temperature,
    model,
    json: true,
    signal,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return parseValidatedJson(content, schema);
}

export async function generateJsonFromMessages<T>({
  messages,
  schema,
  temperature = 0.5,
  model,
  signal,
}: GenerateJsonFromMessagesOptions<T>): Promise<T> {
  const content = await callOpenAIChat({
    temperature,
    model,
    json: true,
    signal,
    messages,
  });
  return parseValidatedJson(content, schema);
}

export async function generateTextFromMessages(input: {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
}): Promise<string> {
  return callOpenAIChat({
    messages: input.messages,
    temperature: input.temperature ?? 0.6,
    model: input.model,
    json: false,
    signal: input.signal,
  });
}
