import { connection } from "next/server";
import {
  parseStorefrontGenerationRequest,
  runStorefrontGeneration,
} from "@/lib/storefront-generation/run";
import type { StorefrontGenerationEvent } from "@/lib/storefront-generation/stages";

export const maxDuration = 90;

function wantsStream(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  const url = new URL(request.url);
  return (
    accept.includes("text/event-stream") ||
    url.searchParams.get("stream") === "1"
  );
}

function encodeSse(event: StorefrontGenerationEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  await connection();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseStorefrontGenerationRequest(body);
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

  if (!wantsStream(request)) {
    try {
      const storefront = await runStorefrontGeneration({
        data: parsed.data,
        signal: request.signal,
      });
      return Response.json({ storefront });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return new Response(null, { status: 499 });
      }
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate storefront.";
      const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
      return Response.json({ error: message }, { status });
    }
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = async (event: StorefrontGenerationEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(encodeSse(event)));
      };

      const onAbort = () => {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", onAbort);

      try {
        await runStorefrontGeneration({
          data: parsed.data,
          signal: request.signal,
          onProgress: send,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate storefront.";
        await send({
          type: "error",
          error: message,
          at: new Date().toISOString(),
        });
      } finally {
        request.signal.removeEventListener("abort", onAbort);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
