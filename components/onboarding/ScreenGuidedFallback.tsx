"use client";

import { useMemo, useState } from "react";
import FormField from "@/components/FormField";
import DiscoveryChat from "@/components/onboarding/DiscoveryChat";
import NicheChips from "@/components/onboarding/NicheChips";
import ResourceCollector from "@/components/onboarding/ResourceCollector";
import FriendlyError from "@/components/ui/FriendlyError";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenShell from "@/components/ui/ScreenShell";
import StatusBanner from "@/components/ui/StatusBanner";
import {
  askExamplesForNiche,
  deriveGuidedSynthesisFields,
  helpExamplesForNiche,
  SHARING_STYLE_OPTIONS,
} from "@/lib/discovery";
import type {
  ContentInsights,
  CreatorResourceClient,
  GuidedAnswers,
  LanguageOption,
  NicheOption,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

type GuidedDraft = {
  whatTheyDo: NicheOption | "";
  customWhatTheyDo: string;
  sharingStyles: string[];
  customSharingStyle: string;
  peopleAskAbout: string;
  enjoyHelpingWith: string;
  usedConversationDiscovery: boolean;
  conversationSummary: string;
  contentInsights?: ContentInsights;
  resources: CreatorResourceClient[];
};

type GuidedErrors = Partial<
  Record<
    | "whatTheyDo"
    | "customWhatTheyDo"
    | "sharingStyles"
    | "customSharingStyle"
    | "peopleAskAbout"
    | "enjoyHelpingWith",
    string
  >
>;

type DiscoverySubstep = 0 | 1 | 2 | 3;

type ScreenGuidedFallbackProps = {
  values: GuidedDraft;
  errors: GuidedErrors;
  language: LanguageOption;
  loading?: boolean;
  banner?: string;
  apiError?: string;
  onChange: <K extends keyof GuidedDraft>(field: K, value: GuidedDraft[K]) => void;
  onContinue: () => void;
  onBack: () => void;
};

export type { GuidedDraft, GuidedErrors };

const SUBSTEP_LABELS = [
  "Your niche",
  "What you share",
  "What people ask",
  "How you help",
] as const;

export default function ScreenGuidedFallback({
  values,
  errors,
  language,
  loading = false,
  banner,
  apiError,
  onChange,
  onContinue,
  onBack,
}: ScreenGuidedFallbackProps) {
  const [substep, setSubstep] = useState<DiscoverySubstep>(0);
  const [chatMode, setChatMode] = useState(false);

  const nicheLabel =
    values.whatTheyDo === "Other"
      ? values.customWhatTheyDo.trim() || "your niche"
      : values.whatTheyDo || "your niche";

  const askExamples = useMemo(
    () => askExamplesForNiche(values.whatTheyDo || undefined),
    [values.whatTheyDo],
  );
  const helpExamples = useMemo(
    () => helpExamplesForNiche(values.whatTheyDo || undefined),
    [values.whatTheyDo],
  );

  function toggleSharingStyle(option: string) {
    const selected = values.sharingStyles.includes(option);
    const next = selected
      ? values.sharingStyles.filter((item) => item !== option)
      : [...values.sharingStyles, option];
    onChange("sharingStyles", next);
    if (option !== "Something else" || selected) {
      // keep custom text if still selected
    }
  }

  function goNext() {
    if (substep === 0) {
      if (!values.whatTheyDo) {
        onChange("whatTheyDo", values.whatTheyDo);
        return;
      }
      if (values.whatTheyDo === "Other" && !values.customWhatTheyDo.trim()) {
        return;
      }
      setSubstep(1);
      return;
    }
    if (substep === 1) {
      if (
        values.sharingStyles.length === 0 &&
        !values.usedConversationDiscovery
      ) {
        return;
      }
      if (
        values.sharingStyles.includes("Something else") &&
        !values.customSharingStyle.trim() &&
        !values.usedConversationDiscovery
      ) {
        return;
      }
      setSubstep(2);
      return;
    }
    if (substep === 2) {
      setSubstep(3);
      return;
    }
    onContinue();
  }

  function goBackInner() {
    if (chatMode) {
      setChatMode(false);
      return;
    }
    if (substep === 0) {
      onBack();
      return;
    }
    setSubstep((prev) => (prev - 1) as DiscoverySubstep);
  }

  const canContinue = (() => {
    if (substep === 0) {
      if (!values.whatTheyDo) return false;
      if (values.whatTheyDo === "Other" && !values.customWhatTheyDo.trim()) {
        return false;
      }
      return true;
    }
    if (substep === 1) {
      if (values.usedConversationDiscovery) return true;
      if (values.sharingStyles.length === 0) return false;
      if (
        values.sharingStyles.includes("Something else") &&
        !values.customSharingStyle.trim()
      ) {
        return false;
      }
      return true;
    }
    // 2 and 3 are skippable
    return true;
  })();

  const title =
    substep === 0
      ? "First, what's your world?"
      : substep === 1
        ? "What do you naturally love sharing?"
        : substep === 2
          ? "What do people usually ask you about?"
          : "What do you enjoy helping people with?";

  const subtitle =
    substep === 0
      ? "Pick a niche so we can give examples that feel familiar — you don't need a polished brand yet."
      : substep === 1
        ? "No need to sound like an expert. Pick what feels natural. Or let us help you figure it out."
        : substep === 2
          ? "Concrete is better than clever. Tap an example or write your own — skip if you're unsure."
          : "Optional. A few words are enough. You can also add post screenshots.";

  return (
    <ScreenShell
      kicker={`Discovery · ${substep + 1} of 4`}
      title={title}
      subtitle={subtitle}
      onBack={goBackInner}
      backLabel="← Back"
      footer={
        chatMode ? null : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              {SUBSTEP_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    index <= substep ? "bg-pine" : "bg-line",
                  )}
                  title={label}
                />
              ))}
            </div>
            <PrimaryButton
              type="button"
              loading={loading}
              disabled={!canContinue}
              onClick={goNext}
            >
              {substep === 3 ? "See my creator snapshot" : "Continue"}
            </PrimaryButton>
          </div>
        )
      }
    >
      <FriendlyError error={apiError} context="discovery" />

      {banner ? (
        <StatusBanner variant="notice" className="mb-4">
          {banner}
        </StatusBanner>
      ) : null}

      {chatMode ? (
        <DiscoveryChat
          niche={values.whatTheyDo}
          customNiche={values.customWhatTheyDo}
          language={language}
          onCancel={() => setChatMode(false)}
          onComplete={(result) => {
            onChange("usedConversationDiscovery", true);
            onChange("conversationSummary", result.summary);
            if (result.sharingStyles.length > 0) {
              onChange("sharingStyles", result.sharingStyles.slice(0, 6));
            }
            if (result.peopleAskAbout) {
              onChange("peopleAskAbout", result.peopleAskAbout);
            }
            if (result.enjoyHelpingWith) {
              onChange("enjoyHelpingWith", result.enjoyHelpingWith);
            }
            setChatMode(false);
            setSubstep(3);
          }}
        />
      ) : null}

      {!chatMode && substep === 0 ? (
        <div className="flex flex-col gap-5">
          <NicheChips
            label=""
            value={values.whatTheyDo}
            onChange={(whatTheyDo) => onChange("whatTheyDo", whatTheyDo)}
            error={errors.whatTheyDo}
          />
          {values.whatTheyDo === "Other" ? (
            <FormField
              id="custom-what-they-do"
              label="Describe your space in a few words"
              required
              name="customWhatTheyDo"
              placeholder="e.g. Parenting, UX mentoring, food diaries"
              value={values.customWhatTheyDo}
              error={errors.customWhatTheyDo}
              onChange={(event) =>
                onChange("customWhatTheyDo", event.target.value)
              }
            />
          ) : null}
        </div>
      ) : null}

      {!chatMode && substep === 1 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SHARING_STYLE_OPTIONS.map((option) => {
              const active = values.sharingStyles.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSharingStyle(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-left text-sm font-semibold transition",
                    active
                      ? "border-pine bg-sage-soft text-pine"
                      : "border-line bg-surface text-pine-ink hover:border-pine/40",
                  )}
                  aria-pressed={active}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {errors.sharingStyles ? (
            <p role="alert" className="text-xs font-medium text-error">
              {errors.sharingStyles}
            </p>
          ) : null}

          {values.sharingStyles.includes("Something else") ? (
            <FormField
              id="custom-sharing"
              label="What else do you love sharing?"
              name="customSharingStyle"
              placeholder="e.g. Behind-the-scenes of my craft"
              value={values.customSharingStyle}
              error={errors.customSharingStyle}
              onChange={(event) =>
                onChange("customSharingStyle", event.target.value)
              }
            />
          ) : null}

          <button
            type="button"
            onClick={() => setChatMode(true)}
            className="w-full rounded-2xl border border-dashed border-pine/35 bg-sage-soft/50 px-4 py-4 text-left transition hover:border-pine/60"
          >
            <p className="text-sm font-semibold text-pine">
              Help me figure it out
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
              Not sure how to describe yourself? We&apos;ll ask a few easy
              questions — one at a time.
            </p>
          </button>

          {values.usedConversationDiscovery && values.conversationSummary ? (
            <StatusBanner variant="notice" title="From our chat">
              {values.conversationSummary}
            </StatusBanner>
          ) : null}
        </div>
      ) : null}

      {!chatMode && substep === 2 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {askExamples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onChange("peopleAskAbout", example)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition",
                  values.peopleAskAbout === example
                    ? "border-pine bg-sage-soft text-pine"
                    : "border-line bg-paper text-ink-secondary hover:border-pine/40",
                )}
              >
                {example}
              </button>
            ))}
          </div>
          <FormField
            id="people-ask-about"
            label={`In ${nicheLabel}, what do people usually ask you?`}
            name="peopleAskAbout"
            placeholder="e.g. How do I get started without feeling overwhelmed?"
            value={values.peopleAskAbout}
            error={errors.peopleAskAbout}
            onChange={(event) => onChange("peopleAskAbout", event.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              onChange("peopleAskAbout", values.peopleAskAbout || "");
              setSubstep(3);
            }}
            className="text-xs font-semibold text-muted hover:text-ink"
          >
            Skip for now →
          </button>
        </div>
      ) : null}

      {!chatMode && substep === 3 ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {helpExamples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onChange("enjoyHelpingWith", example)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition",
                  values.enjoyHelpingWith === example
                    ? "border-pine bg-sage-soft text-pine"
                    : "border-line bg-paper text-ink-secondary hover:border-pine/40",
                )}
              >
                {example}
              </button>
            ))}
          </div>
          <FormField
            id="enjoy-helping"
            label="What do you enjoy helping people with? (optional)"
            name="enjoyHelpingWith"
            placeholder="A few words is enough"
            value={values.enjoyHelpingWith}
            error={errors.enjoyHelpingWith}
            onChange={(event) =>
              onChange("enjoyHelpingWith", event.target.value)
            }
          />

          <ResourceCollector
            resources={values.resources}
            onChange={(resources) => onChange("resources", resources)}
          />
        </div>
      ) : null}
    </ScreenShell>
  );
}

export function toGuidedAnswers(
  draft: GuidedDraft,
  instagramHandle?: string,
): GuidedAnswers | null {
  if (!draft.whatTheyDo) return null;

  const derived = deriveGuidedSynthesisFields({
    sharingStyles: draft.sharingStyles,
    customSharingStyle: draft.customSharingStyle,
    peopleAskAbout: draft.peopleAskAbout,
    enjoyHelpingWith: draft.enjoyHelpingWith,
    conversationSummary: draft.conversationSummary,
    contentInsightsSummary: draft.contentInsights?.summary,
  });

  return {
    whatTheyDo: draft.whatTheyDo,
    customWhatTheyDo: draft.customWhatTheyDo,
    sharingStyles: draft.sharingStyles,
    customSharingStyle: draft.customSharingStyle || undefined,
    peopleAskAbout: draft.peopleAskAbout,
    enjoyHelpingWith: draft.enjoyHelpingWith,
    usedConversationDiscovery: draft.usedConversationDiscovery,
    conversationSummary: draft.conversationSummary || undefined,
    contentInsights: draft.contentInsights,
    resources: draft.resources.length ? draft.resources : undefined,
    expertise: derived.expertise,
    whoTheyHelp: derived.whoTheyHelp,
    audienceComesFor: derived.audienceComesFor,
    instagramHandle: instagramHandle?.trim() || undefined,
  };
}
