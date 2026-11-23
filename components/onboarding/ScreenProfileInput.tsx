"use client";

import { ArrowRight, AtSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PrimaryButton from "@/components/ui/PrimaryButton";
import FriendlyError from "@/components/ui/FriendlyError";
import StatusBanner from "@/components/ui/StatusBanner";
import type { InstagramRetrievedProfile } from "@/lib/instagram/schemas";
import {
  LANGUAGE_OPTIONS,
  type LanguageOption,
} from "@/lib/schemas";

type ScreenProfileInputProps = {
  configured: boolean;
  connectedProfile: InstagramRetrievedProfile | null;
  previewThemes: string[];
  handle: string;
  description: string;
  language: LanguageOption;
  error?: string;
  notice?: string;
  loading?: boolean;
  analysing?: boolean;
  onHandleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLanguageChange: (value: LanguageOption) => void;
  onConnectInstagram: () => void;
  onDisconnect: () => void;
  onAnalyseConnected: () => void;
  onGenerateFromInput: () => void;
  onContinueManually: () => void;
};

export default function ScreenProfileInput({
  configured,
  connectedProfile,
  previewThemes,
  handle,
  description,
  language,
  error,
  notice,
  loading = false,
  analysing = false,
  onHandleChange,
  onDescriptionChange,
  onLanguageChange,
  onConnectInstagram,
  onDisconnect,
  onAnalyseConnected,
  onGenerateFromInput,
  onContinueManually,
}: ScreenProfileInputProps) {
  const canGenerate =
    description.trim().length >= 12 || handle.trim().replace(/^@/, "").length >= 2;

  return (
    <>
      <section className="screen-enter soft-card screen-with-dock overflow-hidden">
        {/* Airy, low-text hero — clarity redesign */}
        <div className="border-b border-line bg-gradient-to-br from-sage-soft via-surface to-paper-warm px-5 pb-6 pt-5">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 shadow-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pine text-[10px] font-bold text-white">
              CS
            </span>
            <span className="text-xs font-semibold text-pine-ink">
              Creator Store AI
            </span>
          </div>

          <h1 className="font-display max-w-[16ch] text-2xl font-semibold leading-[1.15] tracking-tight text-pine-ink sm:text-[30px]">
            From blank page to a store you&apos;d share.
          </h1>
          <p className="mt-2.5 max-w-[34ch] text-sm leading-relaxed text-ink-secondary">
            Drop your @handle or a short line about what you do. We draft what
            to sell, INR prices, and the page copy.
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {["What to sell", "How to price", "Page copy"].map((pillar, i) => (
              <span
                key={pillar}
                className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-paper px-3 py-1 text-xs font-medium text-pine-ink"
              >
                <span className="font-mono text-[10px] font-bold text-pine">
                  0{i + 1}
                </span>
                {pillar}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          {notice ? (
            <StatusBanner variant="notice" title="Update">
              {notice}
            </StatusBanner>
          ) : null}

          <FriendlyError error={error} context="profile" className="" />

          {connectedProfile ? (
            <div className="rounded-2xl border border-border bg-background/80 p-3.5">
              <div className="flex items-start gap-3">
                {connectedProfile.profilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={connectedProfile.profilePictureUrl}
                    alt={`@${connectedProfile.username}`}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-accent-soft"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                    @
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    @{connectedProfile.username}
                  </p>
                  {connectedProfile.name ? (
                    <p className="text-sm text-muted">{connectedProfile.name}</p>
                  ) : null}
                </div>
              </div>

              {connectedProfile.biography ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink">
                  {connectedProfile.biography}
                </p>
              ) : null}

              {previewThemes.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {previewThemes.map((theme) => (
                    <Badge key={theme}>{theme}</Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onDisconnect}
                >
                  Disconnect
                </Button>
                <button
                  type="button"
                  onClick={onContinueManually}
                  className="text-xs font-semibold text-accent"
                >
                  Prefer questions instead
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="ig-handle"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted"
                >
                  Instagram handle
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                    @
                  </span>
                  <input
                    id="ig-handle"
                    type="text"
                    inputMode="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="yourusername"
                    value={handle.replace(/^@/, "")}
                    onChange={(e) => onHandleChange(e.target.value)}
                    className="sp-field__control sp-field__control--plain !pl-8"
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  Optional if you describe yourself below. We won&apos;t scrape —
                  connect Instagram when available, or write a short line.
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="self-description"
                    className="block text-xs font-semibold uppercase tracking-[0.08em] text-muted"
                  >
                    Or describe yourself
                  </label>
                  <span className="text-[11px] text-muted">
                    {description.trim().length}/600
                  </span>
                </div>
                <textarea
                  id="self-description"
                  rows={3}
                  maxLength={600}
                  placeholder="e.g. I teach budgeting & SIPs to young Indians on Instagram — practical money habits, no jargon."
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="sp-field__control sp-field__control--plain min-h-[96px] resize-y"
                />
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Page language
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onLanguageChange(option)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        language === option
                          ? "border-pine bg-pine text-white"
                          : "border-line bg-surface text-ink-secondary hover:border-pine/40"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  For Indian creators who write in English, Hinglish, or Hindi.
                </p>
              </div>

              {configured ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={onConnectInstagram}
                  className="w-full"
                >
                  <AtSign className="size-4" />
                  {loading ? "Opening Instagram…" : "Connect Instagram instead"}
                </Button>
              ) : (
                <StatusBanner variant="estimate" title="Fast path">
                  No Instagram login needed. A handle label or one clear sentence
                  is enough to draft your store.
                </StatusBanner>
              )}

              <button
                type="button"
                onClick={onContinueManually}
                className="w-full text-center text-xs font-semibold text-accent"
              >
                Prefer guided questions instead →
              </button>
            </>
          )}
        </div>
      </section>

      <div className="sticky-actions">
        {connectedProfile ? (
          <PrimaryButton
            type="button"
            loading={analysing}
            onClick={onAnalyseConnected}
          >
            <span className="inline-flex items-center gap-2">
              Analyse my profile
              <ArrowRight className="size-4" />
            </span>
          </PrimaryButton>
        ) : (
          <PrimaryButton
            type="button"
            loading={analysing}
            disabled={!canGenerate && !analysing}
            onClick={onGenerateFromInput}
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4" />
              Draft my storefront
            </span>
          </PrimaryButton>
        )}
      </div>
    </>
  );
}
