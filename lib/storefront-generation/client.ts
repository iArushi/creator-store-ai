import type { GenerateStorefrontRequest, Storefront } from "@/lib/schemas";
import {
  STOREFRONT_GENERATION_STAGES,
  type StorefrontGenerationEvent,
  type StorefrontGenerationStageId,
} from "@/lib/storefront-generation/stages";

export type StageUiState = "pending" | "active" | "complete";

export type GenerationUiSnapshot = {
  stages: Record<StorefrontGenerationStageId, StageUiState>;
  activeStage?: StorefrontGenerationStageId;
  activeMessage?: string;
  storefront?: Storefront;
  error?: string;
  done: boolean;
};

export function initialGenerationSnapshot(): GenerationUiSnapshot {
  const stages = Object.fromEntries(
    STOREFRONT_GENERATION_STAGES.map((s) => [s.id, "pending" as StageUiState]),
  ) as Record<StorefrontGenerationStageId, StageUiState>;
  return { stages, done: false };
}

export function applyGenerationEvent(
  prev: GenerationUiSnapshot,
  event: StorefrontGenerationEvent,
): GenerationUiSnapshot {
  if (event.type === "error") {
    return {
      ...prev,
      error: event.error,
      done: true,
      activeStage: undefined,
    };
  }

  if (event.type === "complete") {
    const stages = { ...prev.stages };
    for (const stage of STOREFRONT_GENERATION_STAGES) {
      stages[stage.id] = "complete";
    }
    return {
      stages,
      storefront: event.storefront as Storefront,
      done: true,
      activeStage: undefined,
      activeMessage: "Your storefront is ready.",
    };
  }

  const stages = { ...prev.stages };
  if (event.status === "started") {
    stages[event.stage] = "active";
    return {
      ...prev,
      stages,
      activeStage: event.stage,
      activeMessage: event.message,
      error: undefined,
    };
  }

  stages[event.stage] = "complete";
  return {
    ...prev,
    stages,
    activeMessage: event.message || prev.activeMessage,
  };
}

function parseSseChunk(
  buffer: string,
): { events: StorefrontGenerationEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() || "";
  const events: StorefrontGenerationEvent[] = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    let dataLine = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("data:")) {
        dataLine += line.slice(5).trim();
      }
    }
    if (!dataLine) continue;
    try {
      events.push(JSON.parse(dataLine) as StorefrontGenerationEvent);
    } catch {
      /* ignore malformed chunk */
    }
  }

  return { events, rest };
}

export async function streamStorefrontGeneration(input: {
  body: GenerateStorefrontRequest;
  signal?: AbortSignal;
  onEvent: (event: StorefrontGenerationEvent) => void;
}): Promise<Storefront> {
  const response = await fetch("/api/generate-storefront?stream=1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input.body),
    signal: input.signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      (payload as { error?: string }).error ||
        `Could not start generation (${response.status}).`,
    );
  }

  if (!response.body) {
    throw new Error("Streaming is not available in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let storefront: Storefront | undefined;
  let streamError: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;
    for (const event of parsed.events) {
      input.onEvent(event);
      if (event.type === "complete") {
        storefront = event.storefront as Storefront;
      }
      if (event.type === "error") {
        streamError = event.error;
      }
    }
  }

  // Flush trailing buffer
  if (buffer.trim()) {
    const parsed = parseSseChunk(`${buffer}\n\n`);
    for (const event of parsed.events) {
      input.onEvent(event);
      if (event.type === "complete") {
        storefront = event.storefront as Storefront;
      }
      if (event.type === "error") {
        streamError = event.error;
      }
    }
  }

  if (streamError) {
    throw new Error(streamError);
  }
  if (!storefront) {
    throw new Error("Generation ended without a storefront.");
  }
  return storefront;
}
