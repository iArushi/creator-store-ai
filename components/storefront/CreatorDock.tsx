"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  Pencil,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

type CreatorDockProps = {
  pathUrl: string;
  compactMode: boolean;
  onToggleCompactMode: () => void;
  showPreviews: boolean;
  onTogglePreviews: () => void;
  editing: boolean;
  onToggleEditing: () => void;
  regenerating: boolean;
  onRegenerateAll: () => void;
  onRegenerateBio: () => void;
  onRegenerateProducts: () => void;
};

export default function CreatorDock({
  pathUrl,
  compactMode,
  onToggleCompactMode,
  showPreviews,
  onTogglePreviews,
  editing,
  onToggleEditing,
  regenerating,
  onRegenerateAll,
  onRegenerateBio,
  onRegenerateProducts,
}: CreatorDockProps) {
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${pathUrl}`,
      );
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-pine-ink px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-pine"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Creator tools
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex flex-col items-center px-4">
      {panelOpen ? (
        <div className="pointer-events-auto mb-3 w-full max-w-md space-y-3 rounded-2xl border border-line bg-surface/98 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sage-soft text-pine">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-pine-ink">
                  Edit & regenerate
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                  Fix copy, prices, or rewrite with AI
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close tools"
              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-muted hover:bg-paper hover:text-pine-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleEditing}
              className={`flex min-h-11 w-full items-center justify-center rounded-xl border px-3 text-center text-xs font-semibold ${
                editing
                  ? "border-pine bg-sage-soft text-pine"
                  : "border-line bg-paper/70 text-pine-ink"
              }`}
            >
              {editing ? "Done editing" : "Edit fields"}
            </button>
            <button
              type="button"
              disabled={regenerating}
              onClick={onRegenerateBio}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-paper/70 px-3 text-center text-xs font-semibold text-pine-ink hover:border-pine/40 disabled:opacity-60"
            >
              Rewrite bio
            </button>
            <button
              type="button"
              disabled={regenerating}
              onClick={onRegenerateProducts}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-paper/70 px-3 text-center text-xs font-semibold text-pine-ink hover:border-pine/40 disabled:opacity-60"
            >
              Rewrite offers
            </button>
            <button
              type="button"
              disabled={regenerating}
              onClick={onRegenerateAll}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-pine px-3 text-center text-xs font-semibold text-white hover:bg-pine-dark disabled:opacity-60"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              {regenerating ? "…" : "Regen page"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={onToggleCompactMode}
              className={`flex min-h-11 w-full items-center justify-center rounded-xl border px-3 text-center text-xs font-semibold ${
                compactMode
                  ? "border-pine bg-pine text-white"
                  : "border-line bg-paper/70 text-pine-ink"
              }`}
            >
              Compact cards
            </button>
            <button
              type="button"
              onClick={onTogglePreviews}
              className={`flex min-h-11 w-full items-center justify-center rounded-xl border px-3 text-center text-xs font-semibold ${
                showPreviews
                  ? "border-pine/40 bg-sage-soft text-pine-ink"
                  : "border-line bg-paper/70 text-pine-ink"
              }`}
            >
              {showPreviews ? "Hide previews" : "Show previews"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-1.5 rounded-full border border-line bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line/80 px-3.5 py-2 text-xs font-semibold text-pine-ink transition-colors hover:bg-paper"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-pine" />
              <span className="text-pine">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-ink-secondary" />
              <span>Copy link</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleEditing}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
            editing
              ? "border-pine/40 bg-sage-soft text-pine"
              : "border-line/80 text-pine-ink hover:bg-paper"
          }`}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>{editing ? "Done" : "Edit"}</span>
        </button>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          disabled={regenerating}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-pine px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{regenerating ? "…" : "Rewrite"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPanelOpen(false);
            setMinimized(true);
          }}
          title="Hide creator tools — preview as a visitor"
          aria-label="Hide creator tools"
          className="cursor-pointer rounded-full p-2 text-ink-muted transition-colors hover:bg-paper hover:text-pine-ink"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
