"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import IntelligenceBriefPanel from "@/components/onboarding/IntelligenceBriefPanel";
import FriendlyError from "@/components/ui/FriendlyError";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenShell from "@/components/ui/ScreenShell";
import StatusBanner from "@/components/ui/StatusBanner";
import {
  CREATION_EFFORT_LEVELS,
  PRODUCT_FORMATS,
  type IntelligenceBrief,
  type MonetisationOpportunity,
  type ResearchMeta,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, RefreshCw, Sparkles } from "lucide-react";

type ScreenOpportunitiesProps = {
  opportunities: MonetisationOpportunity[];
  selectedIndex: number | null;
  research?: ResearchMeta;
  intelligenceBrief?: IntelligenceBrief;
  validationWarnings?: string[];
  error?: string;
  loading?: boolean;
  regeneratingIndex?: number | null;
  onSelect: (index: number) => void;
  onChangeOpportunity: (
    index: number,
    next: MonetisationOpportunity,
  ) => void;
  onConfirmIntelligenceGap?: (gap: string, note: string) => void;
  onRegenerateAll: () => void;
  onRegenerateOne: (index: number) => void;
  onContinue: () => void;
  onBack: () => void;
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRange(min: number, max: number) {
  return min === max ? formatInr(min) : `${formatInr(min)} – ${formatInr(max)}`;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink">{value}/5</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ScreenOpportunities({
  opportunities,
  selectedIndex,
  research,
  intelligenceBrief,
  validationWarnings,
  error,
  loading = false,
  regeneratingIndex = null,
  onSelect,
  onChangeOpportunity,
  onConfirmIntelligenceGap,
  onRegenerateAll,
  onRegenerateOne,
  onContinue,
  onBack,
}: ScreenOpportunitiesProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function patch(index: number, partial: Partial<MonetisationOpportunity>) {
    const current = opportunities[index];
    if (!current) return;
    onChangeOpportunity(index, { ...current, ...partial });
  }

  return (
    <ScreenShell
      title="What you could sell"
      subtitle="Grounded in your evidence first — then three offers with India-ready pricing."
      onBack={onBack}
      footer={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 px-4"
            onClick={onRegenerateAll}
            disabled={loading}
          >
            <RefreshCw className="size-3.5" />
            {loading && regeneratingIndex === null ? "…" : "Regen"}
          </Button>
          <PrimaryButton
            type="button"
            className="flex-1"
            loading={loading && regeneratingIndex === null}
            disabled={selectedIndex === null || loading}
            onClick={onContinue}
          >
            <span className="inline-flex items-center gap-2">
              Build my store
              <ArrowRight className="size-4" />
            </span>
          </PrimaryButton>
        </div>
      }
    >
      {intelligenceBrief ? (
        <IntelligenceBriefPanel
          brief={intelligenceBrief}
          onConfirmGap={onConfirmIntelligenceGap}
          className="mb-4"
        />
      ) : null}

      {research ? (
        <StatusBanner
          variant={
            research.mode === "external_research" ? "research" : "estimate"
          }
          title={
            research.mode === "external_research"
              ? "Market scan"
              : "AI estimate only"
          }
          className="mb-4"
        >
          <p className="line-clamp-2">{research.message}</p>
          {research.mode === "ai_estimate_only" ? (
            <p className="mt-1 text-xs">
              Not market-validated — based on your creator evidence.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              {research.findingCount} findings ·{" "}
              {research.queriesExecuted.length} searches · listings ≠ sales
            </p>
          )}
        </StatusBanner>
      ) : null}

      {validationWarnings && validationWarnings.length > 0 ? (
        <StatusBanner variant="estimate" className="mb-4" title="Checks">
          <p className="text-xs">{validationWarnings[0]}</p>
        </StatusBanner>
      ) : null}

      <FriendlyError error={error} context="opportunities" />

      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        Recommended offers
      </p>

      <div className="space-y-4">
        {opportunities.map((opportunity, index) => {
          const selected = selectedIndex === index;
          const isEditing = editingIndex === index;
          const suggested =
            opportunity.suggestedPriceInr ||
            Math.round(
              (opportunity.priceInr.min + opportunity.priceInr.max) / 2,
            );

          return (
            <article
              key={opportunity.id || `${opportunity.productName}-${index}`}
              className={cn(
                "overflow-hidden rounded-3xl border bg-surface transition-all",
                selected
                  ? "opportunity-selected border-accent shadow-[var(--card-shadow)] ring-2 ring-accent/15"
                  : "border-border shadow-[var(--card-shadow)]",
              )}
            >
              {selected ? (
                <div className="flex items-center justify-between bg-accent px-5 py-1.5 text-[11px] font-semibold tracking-wide text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-emerald-200" />
                    Selected
                  </span>
                  <span className="font-mono-price text-emerald-200 capitalize">
                    {opportunity.format}
                  </span>
                </div>
              ) : null}

              <div className="space-y-3.5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
                        {opportunity.format}
                      </span>
                      <span className="text-xs capitalize text-muted">
                        Effort · {opportunity.creationEffort}
                      </span>
                    </div>
                    {isEditing ? (
                      <input
                        className="sp-field__control sp-field__control--plain font-semibold"
                        value={opportunity.productName}
                        onChange={(event) =>
                          patch(index, { productName: event.target.value })
                        }
                      />
                    ) : (
                      <h2 className="display text-xl font-semibold leading-snug text-ink">
                        {opportunity.productName}
                      </h2>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono-price text-xl font-bold text-accent">
                      {formatInr(suggested)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatRange(
                        opportunity.priceInr.min,
                        opportunity.priceInr.max,
                      )}
                    </p>
                  </div>
                </div>

                {!isEditing ? (
                  <>
                    <p className="text-sm leading-relaxed text-muted">
                      {opportunity.problemSolved}
                    </p>
                    <p className="rounded-xl border border-line bg-paper/80 px-3 py-2 text-xs leading-relaxed text-ink-secondary">
                      <span className="font-semibold text-pine">
                        Why {formatInr(suggested)}?{" "}
                      </span>
                      {opportunity.priceInr.rationale}
                      {opportunity.pricingBasis === "ai_estimate"
                        ? " · AI estimate for Indian buyers"
                        : " · Informed by public listings"}
                    </p>
                  </>
                ) : null}

                {!isEditing ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {opportunity.deliverables.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted"
                      >
                        <Check className="size-3.5 shrink-0 text-accent" />
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}

                {isEditing ? (
                  <div className="space-y-3 border-t border-border pt-4">
                    <select
                      className="sp-field__control"
                      value={opportunity.format}
                      onChange={(event) =>
                        patch(index, {
                          format: event.target
                            .value as MonetisationOpportunity["format"],
                        })
                      }
                    >
                      {PRODUCT_FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="sp-field__control sp-field__control--plain min-h-[64px] resize-y"
                      value={opportunity.whoWouldBuy}
                      onChange={(event) =>
                        patch(index, { whoWouldBuy: event.target.value })
                      }
                      placeholder="Who it serves"
                    />
                    <textarea
                      className="sp-field__control sp-field__control--plain min-h-[64px] resize-y"
                      value={opportunity.problemSolved}
                      onChange={(event) =>
                        patch(index, { problemSolved: event.target.value })
                      }
                      placeholder="Problem solved"
                    />
                    <textarea
                      className="sp-field__control sp-field__control--plain min-h-[64px] resize-y"
                      value={opportunity.customerOutcome}
                      onChange={(event) =>
                        patch(index, { customerOutcome: event.target.value })
                      }
                      placeholder="Customer outcome"
                    />
                    <textarea
                      className="sp-field__control sp-field__control--plain min-h-[64px] resize-y"
                      value={opportunity.whySuitable}
                      onChange={(event) =>
                        patch(index, { whySuitable: event.target.value })
                      }
                      placeholder="Why it fits you"
                    />
                    <textarea
                      className="sp-field__control sp-field__control--plain min-h-[72px] resize-y"
                      value={opportunity.deliverables.join("\n")}
                      onChange={(event) =>
                        patch(index, {
                          deliverables: event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="One deliverable per line"
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="number"
                        className="sp-field__control sp-field__control--plain"
                        value={suggested}
                        onChange={(event) =>
                          patch(index, {
                            suggestedPriceInr: Number(event.target.value || 0),
                          })
                        }
                      />
                      <input
                        type="number"
                        className="sp-field__control sp-field__control--plain"
                        value={opportunity.priceInr.min}
                        onChange={(event) =>
                          patch(index, {
                            priceInr: {
                              ...opportunity.priceInr,
                              min: Number(event.target.value || 0),
                            },
                          })
                        }
                      />
                      <input
                        type="number"
                        className="sp-field__control sp-field__control--plain"
                        value={opportunity.priceInr.max}
                        onChange={(event) =>
                          patch(index, {
                            priceInr: {
                              ...opportunity.priceInr,
                              max: Number(event.target.value || 0),
                            },
                          })
                        }
                      />
                    </div>
                    <select
                      className="sp-field__control"
                      value={opportunity.creationEffort}
                      onChange={(event) =>
                        patch(index, {
                          creationEffort: event.target
                            .value as MonetisationOpportunity["creationEffort"],
                        })
                      }
                    >
                      {CREATION_EFFORT_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          Effort: {level}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "secondary"}
                    onClick={() => onSelect(index)}
                  >
                    {selected ? "Selected" : "Select"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingIndex((prev) =>
                        prev === index ? null : index,
                      )
                    }
                  >
                    {isEditing ? "Done" : "Edit"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => onRegenerateOne(index)}
                  >
                    {regeneratingIndex === index
                      ? "Regenerating…"
                      : "Regenerate"}
                  </Button>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value={`why-${index}`} className="border-none">
                    <AccordionTrigger className="py-1.5 text-xs">
                      Why we recommend this
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 rounded-2xl border border-border bg-background/70 p-4 text-sm">
                        <p className="text-muted">
                          <span className="font-medium text-ink">Outcome · </span>
                          {opportunity.customerOutcome}
                        </p>
                        <p className="text-muted">
                          <span className="font-medium text-ink">Fit · </span>
                          {opportunity.whySuitable}
                        </p>
                        <p className="text-muted">
                          <span className="font-medium text-ink">Price · </span>
                          {opportunity.priceInr.rationale}
                          <span className="text-xs">
                            {opportunity.pricingBasis ===
                            "researched_comparables"
                              ? " · listings only"
                              : " · AI estimate"}
                          </span>
                        </p>
                        <p className="text-muted">
                          <span className="font-medium text-ink">Market · </span>
                          {opportunity.marketComparison}
                        </p>

                        {opportunity.scores ? (
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                Score
                              </p>
                              <p className="text-sm font-bold text-ink">
                                {opportunity.scores.weightedTotal.toFixed(1)} / 5
                              </p>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <ScoreBar
                                label="Expertise"
                                value={opportunity.scores.expertiseFit}
                              />
                              <ScoreBar
                                label="Problem fit"
                                value={
                                  opportunity.scores.audienceProblemRelevance
                                }
                              />
                              <ScoreBar
                                label="Evidence"
                                value={
                                  opportunity.scores.evidenceStrength ??
                                  opportunity.scores.marketEvidence
                                }
                              />
                              <ScoreBar
                                label="Delivery"
                                value={opportunity.scores.deliveryFeasibility}
                              />
                              <ScoreBar
                                label="Differentiation"
                                value={
                                  opportunity.scores.marketDifferentiation ??
                                  opportunity.scores.marketEvidence
                                }
                              />
                              <ScoreBar
                                label="Price access"
                                value={opportunity.scores.pricingAccessibility}
                              />
                            </div>
                          </div>
                        ) : null}

                        {opportunity.evidence.length > 0 ? (
                          <div>
                            <p className="font-medium text-ink">Comparables</p>
                            <ul className="mt-2 space-y-2">
                              {opportunity.evidence.slice(0, 2).map((item) => (
                                <li
                                  key={`${item.sourceUrl}-${item.finding.slice(0, 24)}`}
                                  className="rounded-xl border border-border bg-surface p-3"
                                >
                                  <p className="line-clamp-2 text-xs text-ink">
                                    {item.excerpt}
                                  </p>
                                  <a
                                    href={item.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-xs font-semibold text-accent"
                                  >
                                    {item.sourceTitle}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {opportunity.assumptions.length > 0 ? (
                          <p className="text-xs text-muted">
                            Assumptions: {opportunity.assumptions[0]}
                          </p>
                        ) : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </article>
          );
        })}
      </div>
    </ScreenShell>
  );
}
