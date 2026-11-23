"use client";

import { useEffect, useState } from "react";
import ProgressIndicator from "@/components/onboarding/ProgressIndicator";
import ScreenGoals from "@/components/onboarding/ScreenGoals";
import ScreenGuidedFallback, {
  toGuidedAnswers,
  type GuidedDraft,
  type GuidedErrors,
} from "@/components/onboarding/ScreenGuidedFallback";
import ScreenOpportunities from "@/components/onboarding/ScreenOpportunities";
import ScreenProfileInput from "@/components/onboarding/ScreenProfileInput";
import ScreenProfileReview from "@/components/onboarding/ScreenProfileReview";
import ScreenStorefrontReady from "@/components/onboarding/ScreenStorefrontReady";
import LoadingPanel from "@/components/ui/LoadingPanel";
import type { InstagramRetrievedProfile } from "@/lib/instagram/schemas";
import type { CreatorIntelligence } from "@/lib/creator-intelligence";
import {
  AnalyseProfileResponseSchema,
  CreatorProfileSchema,
  GenerateOpportunitiesResponseSchema,
  GuidedAnswersSchema,
  type CreatorProfile,
  type GoalOption,
  type IntelligenceBrief,
  type LanguageOption,
  type MonetisationOpportunity,
  type ResearchMeta,
} from "@/lib/schemas";
import { formatUserError, toUserError } from "@/lib/user-errors";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const initialGuided: GuidedDraft = {
  whatTheyDo: "",
  customWhatTheyDo: "",
  sharingStyles: [],
  customSharingStyle: "",
  peopleAskAbout: "",
  enjoyHelpingWith: "",
  usedConversationDiscovery: false,
  conversationSummary: "",
  contentInsights: undefined,
  resources: [],
};

const IG_ERROR_MESSAGES: Record<string, string> = {
  not_configured:
    "Instagram OAuth isn't configured yet. Add Meta credentials, or continue manually.",
  user_denied:
    "Instagram connection was cancelled. You can try again or enter details manually.",
  oauth_error:
    "Instagram denied the connection request. Try again, or continue manually.",
  missing_code:
    "Instagram did not return an authorization code. Try connecting again.",
  invalid_state:
    "Instagram connection failed a security check. Please try connecting again.",
  token_exchange_failed:
    "We couldn't complete Instagram authorization. Retry, or continue manually.",
  connect_failed: "Could not start Instagram connection. Please try again.",
};

export default function OnboardingFlow() {
  const [step, setStep] = useState<Step>(1);
  const [instagramConfigured, setInstagramConfigured] = useState(false);
  const [connectedProfile, setConnectedProfile] =
    useState<InstagramRetrievedProfile | null>(null);
  const [previewThemes, setPreviewThemes] = useState<string[]>([]);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [language, setLanguage] = useState<LanguageOption>("English");
  const [statusLoading, setStatusLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [handleError, setHandleError] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    if (params.get("ig") !== "error") return undefined;
    const reason = params.get("reason") || "";
    return (
      IG_ERROR_MESSAGES[reason] ||
      "Instagram connection failed. Try again or continue manually."
    );
  });
  const [profileNotice, setProfileNotice] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("ig") === "connected"
      ? "Instagram connected. Review your profile, then analyse."
      : undefined;
  });
  const [guidedBanner, setGuidedBanner] = useState<string | undefined>();
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [generatingOpportunities, setGeneratingOpportunities] = useState(false);
  const [guided, setGuided] = useState<GuidedDraft>(initialGuided);
  const [guidedErrors, setGuidedErrors] = useState<GuidedErrors>({});
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [confirmedProfile, setConfirmedProfile] =
    useState<CreatorProfile | null>(null);
  const [goals, setGoals] = useState<GoalOption[]>([
    "Help me figure out what to sell",
  ]);
  const [goalsError, setGoalsError] = useState<string | undefined>();
  const [opportunities, setOpportunities] = useState<MonetisationOpportunity[]>(
    [],
  );
  const [selectedOpportunityIndex, setSelectedOpportunityIndex] = useState<
    number | null
  >(null);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<MonetisationOpportunity | null>(null);
  const [reviewError, setReviewError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | undefined>();
  const [opportunityError, setOpportunityError] = useState<string | undefined>();
  const [researchMeta, setResearchMeta] = useState<ResearchMeta | undefined>();
  const [intelligenceBrief, setIntelligenceBrief] = useState<
    IntelligenceBrief | undefined
  >();
  const [creatorIntelligence, setCreatorIntelligence] = useState<
    CreatorIntelligence | undefined
  >();
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(
    null,
  );

  function resolveNicheLabel() {
    if (guided.whatTheyDo === "Other") {
      return guided.customWhatTheyDo?.trim() || "Creator";
    }
    return guided.whatTheyDo || undefined;
  }

  async function refreshInstagramStatus() {
    setStatusLoading(true);
    try {
      const response = await fetch("/api/instagram/status");
      const payload = await response.json();
      setInstagramConfigured(Boolean(payload.configured));

      if (payload.connected && payload.profile) {
        setConnectedProfile(payload.profile as InstagramRetrievedProfile);
        setInstagramHandle(
          `@${(payload.profile as InstagramRetrievedProfile).username}`,
        );
      } else {
        setConnectedProfile(null);
        if (payload.configured && payload.message && payload.reason !== "not_connected") {
          setProfileNotice(payload.message);
        }
      }
    } catch {
      setInstagramConfigured(false);
      setConnectedProfile(null);
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ig")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("ig");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.pathname);
    }
    const timer = window.setTimeout(() => {
      void refreshInstagramStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateGuided<K extends keyof GuidedDraft>(
    field: K,
    value: GuidedDraft[K],
  ) {
    setGuided((prev) => ({ ...prev, [field]: value }));
    setGuidedErrors((prev) => {
      const next = { ...prev };
      delete next[field as keyof GuidedErrors];
      if (field === "whatTheyDo") delete next.customWhatTheyDo;
      if (field === "sharingStyles") delete next.customSharingStyle;
      return next;
    });
    setApiError(undefined);
  }

  function goToGuided(message: string) {
    setGuidedBanner(message);
    setStep(2);
  }

  async function handleConnectInstagram() {
    setHandleError(undefined);
    setConnectLoading(true);
    try {
      const response = await fetch("/api/instagram/connect?format=json");
      const payload = await response.json();
      if (!response.ok || !payload.authorizeUrl) {
        throw new Error(
          payload.message ||
            "Instagram connect is unavailable. Continue manually for now.",
        );
      }
      window.location.href = payload.authorizeUrl as string;
    } catch (error) {
      setConnectLoading(false);
      setHandleError(formatUserError(error, "profile"));
    }
  }

  async function handleDisconnectInstagram() {
    await fetch("/api/instagram/disconnect", { method: "POST" });
    setConnectedProfile(null);
    setPreviewThemes([]);
    setInstagramHandle("");
    setProfileNotice("Instagram disconnected.");
  }

  async function handleAnalyseConnected() {
    setHandleError(undefined);
    setProfileNotice(undefined);
    setGeneratingProfile(true);

    try {
      const response = await fetch("/api/analyse-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "instagram_connected",
          language,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.fallback === "guided") {
          goToGuided(
            payload.error ||
              "We couldn't analyse the Instagram profile. Answer a few questions instead.",
          );
          return;
        }
        throw new Error(payload.error || "Could not analyse this profile.");
      }

      const parsed = AnalyseProfileResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("AI returned an unexpected profile shape.");
      }

      setProfile(parsed.data.profile);
      setPreviewThemes(parsed.data.profile.expertiseTags.slice(0, 4));
      if (parsed.data.profile.intelligenceBrief) {
        setIntelligenceBrief(parsed.data.profile.intelligenceBrief);
      }
      if (parsed.data.intelligence) {
        setCreatorIntelligence(
          parsed.data.intelligence as CreatorIntelligence,
        );
      }
      if (parsed.data.profile.needsClarification) {
        setGuidedBanner(
          parsed.data.profile.clarificationPrompt ||
            "Some Instagram details were unclear. Fill in anything missing.",
        );
      }
      setStep(3);
    } catch (error) {
      setHandleError(formatUserError(error, "profile"));
    } finally {
      setGeneratingProfile(false);
    }
  }

  function handleContinueManually() {
    setHandleError(undefined);
    setProfileNotice(undefined);
    goToGuided(
      "No problem. Answer a few short questions so we can understand your work.",
    );
  }

  async function handleGenerateFromInput() {
    setHandleError(undefined);
    setProfileNotice(undefined);

    const handle = instagramHandle.trim().replace(/^@/, "");
    const description = selfDescription.trim();

    if (description.length < 12 && handle.length < 2) {
      setHandleError(
        "Add your @handle or a short description of what you do (one clear sentence).",
      );
      return;
    }

    // Handle-only without a description can't be analysed without Instagram OAuth.
    if (description.length < 12) {
      goToGuided(
        handle
          ? `We can't read @${handle} without connecting Instagram. Add a short description above, or answer these questions.`
          : "Add a short description, or answer these questions so we can draft your store.",
      );
      return;
    }

    setGeneratingProfile(true);
    try {
      const response = await fetch("/api/analyse-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "description",
          description,
          instagramHandle: handle || undefined,
          language,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.fallback === "guided") {
          goToGuided(
            payload.error ||
              "That description wasn't quite enough. Answer a few short questions instead.",
          );
          return;
        }
        throw new Error(payload.error || "Could not analyse your description.");
      }

      const parsed = AnalyseProfileResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("AI returned an unexpected profile shape.");
      }

      setProfile(parsed.data.profile);
      setPreviewThemes(parsed.data.profile.expertiseTags.slice(0, 4));
      if (parsed.data.profile.intelligenceBrief) {
        setIntelligenceBrief(parsed.data.profile.intelligenceBrief);
      }
      if (parsed.data.intelligence) {
        setCreatorIntelligence(
          parsed.data.intelligence as CreatorIntelligence,
        );
      }
      if (parsed.data.profile.needsClarification) {
        setGuidedBanner(
          parsed.data.profile.clarificationPrompt ||
            "Add a bit more detail so we can continue confidently.",
        );
      }
      setStep(3);
    } catch (error) {
      setHandleError(formatUserError(error, "profile"));
    } finally {
      setGeneratingProfile(false);
    }
  }

  async function handleGuidedContinue() {
    setApiError(undefined);

    if (!guided.whatTheyDo) {
      setGuidedErrors({ whatTheyDo: "Pick what you do to continue." });
      return;
    }

    const candidate = toGuidedAnswers(
      guided,
      connectedProfile?.username
        ? `@${connectedProfile.username}`
        : instagramHandle,
    );
    const parsed = GuidedAnswersSchema.safeParse(candidate);

    if (!parsed.success) {
      const nextErrors: GuidedErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === "whatTheyDo" ||
          key === "customWhatTheyDo" ||
          key === "sharingStyles" ||
          key === "customSharingStyle" ||
          key === "peopleAskAbout" ||
          key === "enjoyHelpingWith"
        ) {
          nextErrors[key] = issue.message;
        }
      }
      setGuidedErrors(nextErrors);
      setApiError(
        formatUserError(
          parsed.error.issues[0]?.message ||
            "Add a bit more so we can draft your snapshot.",
          "discovery",
        ),
      );
      return;
    }

    setGuidedErrors({});
    setGeneratingProfile(true);

    try {
      const response = await fetch("/api/analyse-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "guided",
          instagramHandle: parsed.data.instagramHandle,
          guided: parsed.data,
          resources: guided.resources,
          language,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not generate your profile.");
      }

      const validated = AnalyseProfileResponseSchema.safeParse(payload);
      if (!validated.success) {
        throw new Error("AI returned an unexpected profile shape.");
      }

      setProfile(validated.data.profile);
      if (validated.data.profile.intelligenceBrief) {
        setIntelligenceBrief(validated.data.profile.intelligenceBrief);
      }
      if (validated.data.intelligence) {
        setCreatorIntelligence(
          validated.data.intelligence as CreatorIntelligence,
        );
      }
      setReviewError(undefined);
      setStep(3);
    } catch (error) {
      setApiError(formatUserError(error, "discovery"));
    } finally {
      setGeneratingProfile(false);
    }
  }

  function handleConfirmProfile() {
    if (!profile) return;

    const validated = CreatorProfileSchema.safeParse({
      ...profile,
      expertiseTags: profile.expertiseTags
        .map((tag) => tag.trim())
        .filter(Boolean),
      clarificationPrompt: profile.clarificationPrompt?.trim() || undefined,
    });
    if (!validated.success) {
      setReviewError(
        formatUserError(
          validated.error.issues[0]?.message ||
            "Please complete the profile insights before continuing.",
          "review",
        ),
      );
      return;
    }

    // If AI asked for clarification, send creator to guided fill for missing pieces.
    if (validated.data.needsClarification) {
      setGuidedBanner(
        validated.data.clarificationPrompt ||
          "Please add a bit more detail so we can continue confidently.",
      );
      setStep(2);
      return;
    }

    setReviewError(undefined);
    setConfirmedProfile(validated.data);
    setStep(4);
  }

  function toggleGoal(goal: GoalOption) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal],
    );
    setGoalsError(undefined);
  }

  async function generateOpportunities(
    activeProfile: CreatorProfile,
    activeGoals: GoalOption[],
    options?: {
      regenerateIndex?: number;
      existingOpportunities?: MonetisationOpportunity[];
      clearSelection?: boolean;
    },
  ) {
    setOpportunityError(undefined);
    setGeneratingOpportunities(true);
    if (typeof options?.regenerateIndex === "number") {
      setRegeneratingIndex(options.regenerateIndex);
    } else {
      setRegeneratingIndex(null);
    }

    try {
      const response = await fetch("/api/generate-opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: activeProfile,
          goals: activeGoals,
          niche: resolveNicheLabel(),
          language,
          resources: guided.resources,
          existingIntelligence: creatorIntelligence,
          guidedContext: {
            niche: resolveNicheLabel(),
            sharingStyles: guided.sharingStyles,
            peopleAskAbout: guided.peopleAskAbout,
            enjoyHelpingWith: guided.enjoyHelpingWith,
            conversationSummary: guided.conversationSummary,
            description: selfDescription.trim() || undefined,
          },
          instagramHandle:
            connectedProfile?.username
              ? `@${connectedProfile.username}`
              : instagramHandle.trim() || undefined,
          regenerateIndex: options?.regenerateIndex,
          existingOpportunities: options?.existingOpportunities,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload.intelligenceBrief) {
          setIntelligenceBrief(payload.intelligenceBrief);
        }
        throw new Error(
          payload.error || "Could not generate monetisation opportunities.",
        );
      }

      const validated = GenerateOpportunitiesResponseSchema.safeParse(payload);
      if (!validated.success) {
        throw new Error("AI returned an unexpected opportunities shape.");
      }

      setOpportunities(validated.data.opportunities);
      setResearchMeta(validated.data.research);
      if (validated.data.intelligenceBrief) {
        setIntelligenceBrief(validated.data.intelligenceBrief);
      }
      setValidationWarnings(validated.data.validationWarnings || []);
      if (options?.clearSelection !== false && options?.regenerateIndex === undefined) {
        setSelectedOpportunityIndex(null);
      }
      setStep(5);
    } catch (error) {
      setOpportunityError(formatUserError(error, "opportunities"));
      throw error;
    } finally {
      setGeneratingOpportunities(false);
      setRegeneratingIndex(null);
    }
  }

  async function handleGoalsContinue() {
    if (!confirmedProfile) return;

    if (goals.length === 0) {
      setGoalsError("Pick at least one goal to continue.");
      return;
    }

    try {
      await generateOpportunities(confirmedProfile, goals);
    } catch {
      setStep(5);
    }
  }

  async function handleRegenerateOpportunities() {
    if (!confirmedProfile || goals.length === 0) return;
    try {
      await generateOpportunities(confirmedProfile, goals);
    } catch {
      // Keep current list if regenerate fails; error is shown.
    }
  }

  async function handleRegenerateOneOpportunity(index: number) {
    if (!confirmedProfile || goals.length === 0) return;
    if (opportunities.length !== 3) return;
    try {
      await generateOpportunities(confirmedProfile, goals, {
        regenerateIndex: index,
        existingOpportunities: opportunities,
        clearSelection: false,
      });
    } catch {
      // Keep current list if regenerate fails; error is shown.
    }
  }

  function handleOpportunityContinue() {
    if (selectedOpportunityIndex === null) {
      setOpportunityError("Select one opportunity to continue.");
      return;
    }

    const chosen = opportunities[selectedOpportunityIndex];
    if (!chosen) return;

    setSelectedOpportunity(chosen);
    setOpportunityError(undefined);
    setStep(6);
  }

  const progressStep = step as 1 | 2 | 3 | 4 | 5 | 6;

  return (
    <div className="mx-auto w-full">
      <ProgressIndicator currentStep={progressStep} />

      {step === 1 ? (
        <ScreenProfileInput
          configured={instagramConfigured}
          connectedProfile={connectedProfile}
          previewThemes={previewThemes}
          handle={instagramHandle}
          description={selfDescription}
          language={language}
          error={handleError}
          notice={
            statusLoading
              ? "Checking Instagram connection…"
              : profileNotice
          }
          loading={connectLoading || statusLoading}
          analysing={generatingProfile}
          onHandleChange={setInstagramHandle}
          onDescriptionChange={(value) => {
            setSelfDescription(value);
            setHandleError(undefined);
          }}
          onLanguageChange={setLanguage}
          onConnectInstagram={handleConnectInstagram}
          onDisconnect={handleDisconnectInstagram}
          onAnalyseConnected={handleAnalyseConnected}
          onGenerateFromInput={handleGenerateFromInput}
          onContinueManually={handleContinueManually}
        />
      ) : null}

      {step === 2 ? (
        <>
          <ScreenGuidedFallback
            values={guided}
            errors={guidedErrors}
            language={language}
            loading={generatingProfile}
            banner={guidedBanner}
            apiError={apiError}
            onChange={updateGuided}
            onContinue={handleGuidedContinue}
            onBack={() => setStep(1)}
          />
        </>
      ) : null}

      {step === 3 && profile ? (
        <ScreenProfileReview
          profile={profile}
          error={reviewError}
          onChange={(next) => {
            setProfile(next);
            setReviewError(undefined);
          }}
          onReenterAnswers={() => setStep(2)}
          onConfirm={handleConfirmProfile}
        />
      ) : null}

      {step === 4 && confirmedProfile ? (
        <ScreenGoals
          selected={goals}
          error={goalsError}
          loading={generatingOpportunities}
          onToggle={toggleGoal}
          onContinue={handleGoalsContinue}
          onBack={() => setStep(3)}
        />
      ) : null}

      {step === 5 ? (
        opportunities.length > 0 ? (
          <ScreenOpportunities
            opportunities={opportunities}
            selectedIndex={selectedOpportunityIndex}
            research={researchMeta}
            intelligenceBrief={
              intelligenceBrief || confirmedProfile?.intelligenceBrief
            }
            validationWarnings={validationWarnings}
            error={opportunityError}
            loading={generatingOpportunities}
            regeneratingIndex={regeneratingIndex}
            onSelect={(index) => {
              setSelectedOpportunityIndex(index);
              setOpportunityError(undefined);
            }}
            onChangeOpportunity={(index, next) => {
              setOpportunities((prev) =>
                prev.map((item, itemIndex) =>
                  itemIndex === index ? next : item,
                ),
              );
            }}
            onConfirmIntelligenceGap={(gap, note) => {
              if (!note || !confirmedProfile) return;
              const nextProfile = {
                ...confirmedProfile,
                observedSignals: [
                  ...(confirmedProfile.observedSignals || []),
                  `Creator confirmed — ${gap}: ${note}`,
                ].slice(0, 8),
                inferredSignals: (confirmedProfile.inferredSignals || []).filter(
                  (s) => !s.toLowerCase().includes(gap.toLowerCase().slice(0, 24)),
                ),
              };
              setConfirmedProfile(nextProfile);
              if (intelligenceBrief) {
                setIntelligenceBrief({
                  ...intelligenceBrief,
                  needsConfirmation: intelligenceBrief.needsConfirmation.filter(
                    (g) => g !== gap,
                  ),
                  observed: [
                    `${gap}: ${note}`,
                    ...intelligenceBrief.observed,
                  ].slice(0, 6),
                });
              }
            }}
            onRegenerateAll={handleRegenerateOpportunities}
            onRegenerateOne={handleRegenerateOneOpportunity}
            onContinue={handleOpportunityContinue}
            onBack={() => setStep(4)}
          />
        ) : generatingOpportunities ? (
          <LoadingPanel
            tone="loading"
            niche={resolveNicheLabel()}
            title="Drafting offers that fit you"
            message="We’re reading your evidence, scanning the Indian market when available, and shaping three concrete product ideas."
            tip="This usually takes a few seconds."
            onBack={() => setStep(4)}
            backLabel="← Back to goals"
          />
        ) : (
          <LoadingPanel
            tone="error"
            niche={resolveNicheLabel()}
            title={toUserError(opportunityError, "opportunities").title}
            message={toUserError(opportunityError, "opportunities").message}
            tip={
              toUserError(opportunityError, "opportunities").tip ||
              "Your goals and snapshot are still saved."
            }
            onBack={() => setStep(4)}
            backLabel="← Back to goals"
            actionLabel="Try again"
            onAction={handleGoalsContinue}
          />
        )
      ) : null}

      {step === 6 &&
      confirmedProfile &&
      selectedOpportunity &&
      goals.length > 0 ? (
        <ScreenStorefrontReady
          profile={confirmedProfile}
          goals={goals}
          opportunity={selectedOpportunity}
          language={language}
          instagramHandle={
            connectedProfile?.username
              ? `@${connectedProfile.username}`
              : instagramHandle
          }
          niche={
            guided.whatTheyDo === "Other"
              ? guided.customWhatTheyDo || "Creator"
              : guided.whatTheyDo || undefined
          }
          profileImageUrl={connectedProfile?.profilePictureUrl}
          onBackToIdeas={() => setStep(5)}
        />
      ) : null}
    </div>
  );
}
