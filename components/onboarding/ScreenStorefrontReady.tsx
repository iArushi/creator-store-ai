"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StorefrontGenerationProgress from "@/components/onboarding/StorefrontGenerationProgress";
import { Badge } from "@/components/ui/badge";
import FriendlyError from "@/components/ui/FriendlyError";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenShell from "@/components/ui/ScreenShell";
import type {
  CreatorProfile,
  GoalOption,
  LanguageOption,
  MonetisationOpportunity,
} from "@/lib/schemas";
import {
  applyGenerationEvent,
  initialGenerationSnapshot,
  streamStorefrontGeneration,
  type GenerationUiSnapshot,
} from "@/lib/storefront-generation/client";
import { MEDIA, nicheImage } from "@/lib/media";
import { formatUserError, toUserError } from "@/lib/user-errors";
import { cn } from "@/lib/utils";

type ScreenStorefrontReadyProps = {
  profile: CreatorProfile;
  goals: GoalOption[];
  opportunity: MonetisationOpportunity;
  language?: LanguageOption;
  instagramHandle?: string;
  niche?: string;
  profileImageUrl?: string;
  onBackToIdeas: () => void;
};

function formatInr(min: number, max: number) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

export default function ScreenStorefrontReady({
  profile,
  goals,
  opportunity,
  language = "English",
  instagramHandle,
  niche,
  profileImageUrl,
  onBackToIdeas,
}: ScreenStorefrontReadyProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "running" | "success" | "error">(
    "idle",
  );
  const [snapshot, setSnapshot] = useState<GenerationUiSnapshot>(
    initialGenerationSnapshot,
  );
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const cover = nicheImage(niche) || MEDIA.readyPanel;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleGenerate() {
    if (inFlightRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    inFlightRef.current = true;

    setPhase("running");
    setError(undefined);
    setStartedAt(Date.now());
    setSnapshot(initialGenerationSnapshot());

    try {
      const storefront = await streamStorefrontGeneration({
        signal: controller.signal,
        body: {
          profile,
          goals,
          selectedOpportunity: opportunity,
          language,
          instagramHandle: instagramHandle || undefined,
          niche: niche || undefined,
          profileImageUrl: profileImageUrl || undefined,
        },
        onEvent: (event) => {
          setSnapshot((prev) => applyGenerationEvent(prev, event));
        },
      });

      if (controller.signal.aborted) return;

      setPhase("success");
      setSnapshot((prev) =>
        applyGenerationEvent(prev, {
          type: "complete",
          storefront,
          at: new Date().toISOString(),
        }),
      );

      // Brief success beat, then navigate to the published page.
      window.setTimeout(() => {
        router.push(`/s/${storefront.slug}`);
      }, 700);
    } catch (err) {
      if (controller.signal.aborted) {
        setPhase("idle");
        setSnapshot(initialGenerationSnapshot());
        setStartedAt(null);
        return;
      }
      const friendly = toUserError(err, "storefront");
      const message = formatUserError(err, "storefront");
      setPhase("error");
      setError(message);
      setSnapshot((prev) => ({
        ...prev,
        done: true,
        error: friendly.message,
        activeStage: undefined,
      }));
    } finally {
      inFlightRef.current = false;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    inFlightRef.current = false;
    setPhase("idle");
    setSnapshot(initialGenerationSnapshot());
    setStartedAt(null);
    setError(undefined);
  }

  const showProgress = phase === "running" || phase === "success" || phase === "error";

  return (
    <ScreenShell
      kicker="Almost there"
      title="Generate your shareable store"
      subtitle="AI writes your bio and 2–4 products with formats and INR prices. You'll get a public link you can edit or regenerate."
      onBack={phase === "running" || phase === "success" ? undefined : onBackToIdeas}
      backLabel="← Back to offers"
      className={cn(showProgress && "screen-with-dock--tall")}
      footerClassName={showProgress ? "sticky-actions--panel" : undefined}
      footer={
        showProgress ? (
          <StorefrontGenerationProgress
            snapshot={snapshot}
            startedAt={startedAt}
            success={phase === "success"}
            onRetry={phase === "error" ? handleGenerate : undefined}
            onCancel={
              phase === "running" || phase === "error"
                ? handleCancel
                : undefined
            }
          />
        ) : (
          <PrimaryButton type="button" onClick={handleGenerate}>
            Generate my storefront
          </PrimaryButton>
        )
      }
    >
      {phase === "idle" ? (
        <FriendlyError error={error} context="storefront" />
      ) : null}

      <div className="overflow-hidden rounded-[22px] border border-border">
        <div className="relative isolate min-h-[160px]">
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 720px) 100vw, 640px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/15" />
          <div className="relative z-10 px-5 py-6 sm:px-6">
            <Badge variant="default">Selected product</Badge>
            <h2 className="display mt-3 text-xl font-semibold text-white sm:text-[1.45rem]">
              {opportunity.productName}
            </h2>
            <p className="mt-2 text-sm text-white/80">
              {opportunity.format ? `${opportunity.format} · ` : ""}
              {opportunity.suggestedPriceInr
                ? `From ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(opportunity.suggestedPriceInr)} · `
                : ""}
              {formatInr(opportunity.priceInr.min, opportunity.priceInr.max)}
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-surface px-5 py-5 sm:px-6">
          <p className="text-sm leading-relaxed text-ink">
            {opportunity.problemSolved}
          </p>
          {opportunity.pricingBasis === "ai_estimate" ? (
            <p className="text-xs text-muted">
              Pricing labelled as an AI estimate (not a researched market
              benchmark).
            </p>
          ) : null}
          {instagramHandle ? (
            <p className="text-sm text-muted">
              Instagram:{" "}
              <span className="font-medium text-ink">
                @{instagramHandle.replace(/^@/, "")}
              </span>
            </p>
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Creator identity
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">
              {profile.positioningStatement}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.expertiseTags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Goals
            </p>
            <p className="mt-1 text-sm text-ink">{goals.join(" · ")}</p>
          </div>
          {showProgress ? (
            <p className="rounded-xl border border-line/60 bg-canvas/50 px-3 py-2 text-xs leading-relaxed text-muted">
              Your profile and selected offer stay on this screen while we
              build — nothing is cleared if generation takes longer or fails.
            </p>
          ) : null}
        </div>
      </div>
    </ScreenShell>
  );
}
