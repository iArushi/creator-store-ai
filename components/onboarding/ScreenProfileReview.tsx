"use client";

import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import FriendlyError from "@/components/ui/FriendlyError";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenShell from "@/components/ui/ScreenShell";
import StatusBanner from "@/components/ui/StatusBanner";
import type { CreatorProfile } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type ScreenProfileReviewProps = {
  profile: CreatorProfile;
  error?: string;
  onChange: (profile: CreatorProfile) => void;
  onReenterAnswers: () => void;
  onConfirm: () => void;
};

function clampText(value: string, max = 140) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max - 1).trim()}…`;
}

export default function ScreenProfileReview({
  profile,
  error,
  onChange,
  onReenterAnswers,
  onConfirm,
}: ScreenProfileReviewProps) {
  const [editing, setEditing] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [showWhy, setShowWhy] = useState(false);

  function updateField<K extends keyof CreatorProfile>(
    field: K,
    value: CreatorProfile[K],
  ) {
    onChange({ ...profile, [field]: value });
  }

  function removeTag(index: number) {
    updateField(
      "expertiseTags",
      profile.expertiseTags.filter((_, i) => i !== index),
    );
  }

  function addTag() {
    const next = tagDraft.trim();
    if (!next) return;
    if (profile.expertiseTags.length >= 8) return;
    if (
      profile.expertiseTags.some(
        (tag) => tag.toLowerCase() === next.toLowerCase(),
      )
    ) {
      setTagDraft("");
      return;
    }
    updateField("expertiseTags", [...profile.expertiseTags, next]);
    setTagDraft("");
  }

  const whyBits = [
    ...(profile.observedSignals || []).slice(0, 2),
    ...(profile.inferredSignals || []).slice(0, 1),
  ];

  return (
    <ScreenShell
      kicker="Your snapshot"
      title="Does this sound like you?"
      subtitle="Quick check — then we suggest what to sell and how to price it."
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className={cn(
              "inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
              editing
                ? "border-pine bg-sage-soft text-pine"
                : "border-line bg-surface text-pine-ink",
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Done" : "Edit"}
          </button>
          <PrimaryButton type="button" className="flex-1" onClick={onConfirm}>
            Looks right
          </PrimaryButton>
        </div>
      }
    >
      {profile.needsClarification && profile.clarificationPrompt ? (
        <StatusBanner variant="error" className="mb-4">
          {profile.clarificationPrompt}
        </StatusBanner>
      ) : null}

      <FriendlyError error={error} context="review" />

      {/* Hero identity — one composition */}
      <section className="overflow-hidden rounded-3xl border border-sage-mid bg-gradient-to-br from-sage-soft via-surface to-paper-warm p-5 shadow-xs">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sage-mid bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-pine">
          <Sparkles className="h-3 w-3" />
          How you show up
        </div>

        {editing ? (
          <textarea
            className="sp-field__control sp-field__control--plain min-h-[100px] resize-y font-display text-base font-semibold"
            value={profile.positioningStatement}
            onChange={(event) =>
              updateField("positioningStatement", event.target.value)
            }
          />
        ) : (
          <h2 className="font-display text-[1.35rem] font-semibold leading-snug tracking-tight text-pine-ink">
            {profile.positioningStatement}
          </h2>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.expertiseTags.slice(0, editing ? 8 : 5).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-white"
            >
              {editing ? (
                <>
                  <input
                    className="w-24 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-white/60"
                    value={tag}
                    onChange={(event) => {
                      const next = [...profile.expertiseTags];
                      next[index] = event.target.value;
                      updateField("expertiseTags", next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="text-white/80"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </>
              ) : (
                tag
              )}
            </span>
          ))}
          {!editing && profile.expertiseTags.length > 5 ? (
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted">
              +{profile.expertiseTags.length - 5}
            </span>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-3 flex gap-2">
            <input
              className="sp-field__control sp-field__control--plain"
              placeholder="Add a tag"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-full border border-line bg-surface px-4 text-sm font-semibold text-pine-ink"
            >
              Add
            </button>
          </div>
        ) : null}
      </section>

      {/* Three short rows — not nested essay cards */}
      <section className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface shadow-xs">
        <SnapshotRow
          label="Who you help"
          editing={editing}
          value={profile.potentialAudience}
          onChange={(value) => updateField("potentialAudience", value)}
        />
        <SnapshotRow
          label="They come for"
          editing={editing}
          value={profile.contentValue}
          onChange={(value) => updateField("contentValue", value)}
        />
        <SnapshotRow
          label="Your angle"
          editing={editing}
          value={profile.potentialPositioning}
          onChange={(value) => updateField("potentialPositioning", value)}
          last
        />
      </section>

      {/* Optional why — collapsed by default */}
      {(whyBits.length > 0 || profile.insightBasis) && !editing ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowWhy((prev) => !prev)}
            className="text-xs font-semibold text-pine"
          >
            {showWhy ? "Hide how we got this" : "How we got this"}
          </button>
          {showWhy ? (
            <div className="mt-2 space-y-2 rounded-2xl border border-line bg-paper/80 px-3.5 py-3">
              {whyBits.length > 0 ? (
                <ul className="space-y-1.5 text-xs leading-relaxed text-ink-secondary">
                  {whyBits.map((item) => (
                    <li key={item}>• {clampText(item, 120)}</li>
                  ))}
                </ul>
              ) : null}
              {profile.insightBasis ? (
                <p className="text-[11px] leading-relaxed text-ink-muted">
                  {clampText(profile.insightBasis, 160)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onReenterAnswers}
        className="mt-5 w-full pb-1 text-center text-xs font-semibold text-ink-muted hover:text-pine-ink"
      >
        Re-enter my answers instead
      </button>
    </ScreenShell>
  );
}

function SnapshotRow({
  label,
  value,
  editing,
  onChange,
  last = false,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3.5",
        !last ? "border-b border-line/80" : "",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      {editing ? (
        <textarea
          className="sp-field__control sp-field__control--plain mt-2 min-h-[72px] resize-y"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <p className="mt-1 text-sm font-medium leading-snug text-pine-ink">
          {clampText(value, 110)}
        </p>
      )}
    </div>
  );
}
