"use client";

import { useState } from "react";
import type { IntelligenceBrief } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type IntelligenceBriefPanelProps = {
  brief: IntelligenceBrief;
  onConfirmGap?: (gap: string, note: string) => void;
  className?: string;
};

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "observed" | "inferred" | "warn";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-snug",
        tone === "observed" && "bg-sage-soft text-pine",
        tone === "inferred" && "bg-paper text-ink-secondary",
        tone === "warn" && "bg-amber-50 text-amber-900",
        tone === "neutral" && "bg-paper text-pine-ink",
      )}
    >
      {children}
    </span>
  );
}

export default function IntelligenceBriefPanel({
  brief,
  onConfirmGap,
  className,
}: IntelligenceBriefPanelProps) {
  const [openEvidence, setOpenEvidence] = useState(false);
  const [gapNotes, setGapNotes] = useState<Record<string, string>>({});

  const expertise = brief.expertise.slice(0, 4);
  const themes = brief.themes.slice(0, 4);
  const assets = brief.knowledgeAssets.slice(0, 4);
  const problems = brief.audienceProblems.slice(0, 3);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-sage-mid bg-gradient-to-br from-sage-soft/80 via-surface to-paper-warm p-4 shadow-xs",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-pine">
            What we found
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold leading-snug text-pine-ink">
            {brief.mainNiche}
          </h2>
        </div>
        {brief.insufficientEvidence ? (
          <Chip tone="warn">Needs more evidence</Chip>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-snug text-ink-secondary line-clamp-2">
        {brief.summary}
      </p>

      <div className="mt-3 space-y-2.5">
        {expertise.length ? (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Expertise
            </p>
            <div className="flex flex-wrap gap-1.5">
              {expertise.map((item) => (
                <Chip key={item} tone="observed">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        {themes.length ? (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Themes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {themes.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          </div>
        ) : null}

        {assets.length ? (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Knowledge assets
            </p>
            <div className="flex flex-wrap gap-1.5">
              {assets.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          </div>
        ) : null}

        {problems.length ? (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Audience problems
            </p>
            <div className="flex flex-wrap gap-1.5">
              {problems.map((item) => (
                <Chip key={item} tone="inferred">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {brief.needsConfirmation.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-line/80 bg-surface/90 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Confirm these
          </p>
          <ul className="mt-2 space-y-2">
            {brief.needsConfirmation.slice(0, 2).map((gap) => (
              <li key={gap} className="space-y-1.5">
                <p className="text-xs font-medium text-pine-ink">{gap}</p>
                {onConfirmGap ? (
                  <div className="flex gap-2">
                    <input
                      className="sp-field__control sp-field__control--plain h-9 text-xs"
                      placeholder="Quick correction"
                      value={gapNotes[gap] || ""}
                      onChange={(e) =>
                        setGapNotes((prev) => ({
                          ...prev,
                          [gap]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-full border border-line px-3 text-[11px] font-semibold text-pine"
                      onClick={() =>
                        onConfirmGap(gap, (gapNotes[gap] || "").trim())
                      }
                    >
                      Save
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        className="mt-3 text-xs font-semibold text-pine"
        onClick={() => setOpenEvidence((v) => !v)}
      >
        {openEvidence ? "Hide evidence labels" : "Evidence labels"}
      </button>

      {openEvidence ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-pine">
              Observed
            </p>
            <ul className="mt-1 space-y-1 text-[11px] leading-snug text-ink-secondary">
              {(brief.observed.length ? brief.observed : ["None yet"]).map(
                (item) => (
                  <li key={item}>• {item}</li>
                ),
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-surface/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-ink-muted">
              Inferred
            </p>
            <ul className="mt-1 space-y-1 text-[11px] leading-snug text-ink-secondary">
              {(brief.inferred.length ? brief.inferred : ["None yet"]).map(
                (item) => (
                  <li key={item}>• {item}</li>
                ),
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
