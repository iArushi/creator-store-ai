"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  STOREFRONT_GENERATION_STAGES,
  type StorefrontGenerationStageId,
} from "@/lib/storefront-generation/stages";
import type {
  GenerationUiSnapshot,
  StageUiState,
} from "@/lib/storefront-generation/client";
import { cn } from "@/lib/utils";

type StorefrontGenerationProgressProps = {
  snapshot: GenerationUiSnapshot;
  startedAt: number | null;
  onRetry?: () => void;
  onCancel?: () => void;
  success?: boolean;
};

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, "0")}s`;
}

function reassuranceFor(
  activeStage: StorefrontGenerationStageId | undefined,
  elapsedMs: number,
): string | null {
  if (!activeStage) return null;
  if (elapsedMs < 12_000) return null;

  if (activeStage === "writing_bio") {
    if (elapsedMs >= 45_000) {
      return "Still drafting with AI — longer waits usually mean a fuller product set, not a stuck request.";
    }
    if (elapsedMs >= 25_000) {
      return "Bio and product copy can take a bit — hanging tight on the AI response.";
    }
    return "Writing usually takes a short while. Your selection is saved.";
  }

  if (elapsedMs >= 20_000) {
    return "Still working on this step. Progress won’t reset.";
  }
  return null;
}

function StageIcon({ state }: { state: StageUiState }) {
  if (state === "complete") {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-pine text-white"
        aria-hidden
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border border-pine/30 bg-pine/10 text-pine"
        aria-hidden
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-full border border-line/80 text-muted"
      aria-hidden
    >
      <Circle className="h-2.5 w-2.5 fill-current opacity-40" />
    </span>
  );
}

export default function StorefrontGenerationProgress({
  snapshot,
  startedAt,
  onRetry,
  onCancel,
  success = false,
}: StorefrontGenerationProgressProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || snapshot.done) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, snapshot.done]);

  const elapsedMs = startedAt ? Math.max(0, now - startedAt) : 0;
  const reassurance = success
    ? null
    : reassuranceFor(snapshot.activeStage, elapsedMs);
  const activeMeta = STOREFRONT_GENERATION_STAGES.find(
    (s) => s.id === snapshot.activeStage,
  );

  return (
    <div
      className="w-full space-y-3"
      role="status"
      aria-live="polite"
      aria-busy={!snapshot.done}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">
            {success
              ? "Ready"
              : snapshot.error
                ? "Couldn’t finish"
                : "Building your store"}
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-pine-ink">
            {success
              ? "Storefront published — opening it now…"
              : snapshot.error
                ? "Generation stopped"
                : activeMeta?.label || "Starting…"}
          </p>
          {!success && !snapshot.error ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {snapshot.activeMessage ||
                activeMeta?.detail ||
                "We’ll update each step when the server finishes it."}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-full border border-line/70 bg-surface px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted">
          {formatElapsed(elapsedMs)}
        </div>
      </div>

      <ol className="space-y-2">
        {STOREFRONT_GENERATION_STAGES.map((stage) => {
          const state = snapshot.stages[stage.id];
          return (
            <li
              key={stage.id}
              className={cn(
                "flex items-start gap-2.5 rounded-xl px-2 py-1.5 transition-colors duration-300",
                state === "active" && "bg-pine/5",
                state === "complete" && "opacity-90",
              )}
            >
              <StageIcon state={state} />
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    "text-sm leading-snug",
                    state === "active" && "font-medium text-pine-ink",
                    state === "complete" && "text-ink",
                    state === "pending" && "text-muted",
                  )}
                >
                  {stage.label}
                </p>
                {state === "active" ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {stage.detail}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {reassurance ? (
        <p className="rounded-xl border border-line/60 bg-canvas/60 px-3 py-2 text-xs leading-relaxed text-ink-secondary">
          {reassurance}
        </p>
      ) : null}

      {snapshot.error ? (
        <div className="space-y-2">
          <p className="rounded-xl border border-error/25 bg-error/5 px-3 py-2 text-xs leading-relaxed text-error">
            {snapshot.error}
          </p>
          <div className="flex gap-2">
            {onRetry ? (
              <PrimaryButton type="button" className="flex-1" onClick={onRetry}>
                Try again
              </PrimaryButton>
            ) : null}
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="min-h-11 rounded-full border border-line px-4 text-sm font-medium text-muted transition hover:text-ink"
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!snapshot.done && !snapshot.error && onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-full min-h-9 text-center text-xs font-medium text-muted transition hover:text-ink"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}
