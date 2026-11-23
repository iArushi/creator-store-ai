"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  COVER_MOTIFS,
  PRODUCT_FORMATS,
  type CoverMotif,
  type Storefront,
  type StorefrontProduct,
} from "@/lib/schemas";
import { ProductArtifactPreview } from "@/components/storefront/ArtifactPreviews";
import CreatorDock from "@/components/storefront/CreatorDock";
import OfferModal from "@/components/storefront/OfferModal";
import {
  STOREFRONT_FILTERS,
  ctaLabelForProduct,
  filterIdForProduct,
  formatDurationHint,
  formatInr,
  heroCtaLabel,
  oneLinerFor,
} from "@/components/storefront/clarity-copy";
import {
  applyCreatorCapsInCopy,
  formatCreatorBrandName,
  formatStorefrontPathDisplay,
} from "@/lib/utils";

type StorefrontViewProps = {
  initial: Storefront;
};

type ViewMode = "cards" | "list";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function displayBrandName(name: string, handle?: string) {
  return formatCreatorBrandName(name, handle);
}

function withCreatorCaps(
  text: string,
  name: string,
  handle?: string,
) {
  return applyCreatorCapsInCopy(text, name, handle);
}

export default function StorefrontView({ initial }: StorefrontViewProps) {
  const [storefront, setStorefront] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [goalFilter, setGoalFilter] = useState("all");
  const [compactMode, setCompactMode] = useState(false);
  const [showPreviews, setShowPreviews] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<StorefrontProduct | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  const pathUrl = `/s/${storefront.slug}`;
  const brandName = displayBrandName(
    storefront.creatorName,
    storefront.handle,
  );
  const pathDisplay = formatStorefrontPathDisplay(
    storefront.slug,
    storefront.creatorName,
    storefront.handle,
  );
  const headlineDisplay = withCreatorCaps(
    storefront.headline,
    storefront.creatorName,
    storefront.handle,
  );
  const bioDisplay = withCreatorCaps(
    storefront.bio,
    storefront.creatorName,
    storefront.handle,
  );
  const introDisplay = withCreatorCaps(
    storefront.intro ||
      "Start small on your own, or pick the recommended offer above.",
    storefront.creatorName,
    storefront.handle,
  );
  const initials = initialsFromName(brandName);

  const nicheLabel = (() => {
    const raw = (storefront.niche || "").trim();
    if (raw && raw.toLowerCase() !== "creator" && raw.toLowerCase() !== "other") {
      return raw;
    }
    const fromTag = storefront.expertiseTags.find(Boolean);
    if (fromTag) return fromTag;
    if (storefront.slug.includes("financ")) return "Personal Finance";
    return "Creator";
  })();

  const pillars = useMemo(() => {
    const tags = storefront.expertiseTags.slice(0, 3);
    if (tags.length > 0) {
      return tags.map((title, i) => ({
        step: String(i + 1).padStart(2, "0"),
        title,
      }));
    }
    return [
      { step: "01", title: "Clear offers" },
      { step: "02", title: "Fair INR pricing" },
      { step: "03", title: "Trust-building copy" },
    ];
  }, [storefront.expertiseTags]);

  const orderedProducts = useMemo(() => {
    const featured =
      storefront.products.find((p) => p.featured) || storefront.products[0];
    const rest = storefront.products.filter((p) => p.id !== featured?.id);
    const base = featured ? [featured, ...rest] : [...storefront.products];

    if (goalFilter === "all") return base;
    return [...base].sort((a, b) => {
      const aMatch = filterIdForProduct(a) === goalFilter ? 1 : 0;
      const bMatch = filterIdForProduct(b) === goalFilter ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [storefront.products, goalFilter]);

  const flagship = orderedProducts[0];
  const quickStart =
    storefront.products.find((p) => p.priceInr <= 600) ||
    [...storefront.products].sort((a, b) => a.priceInr - b.priceInr)[0];

  const lowestPrice = Math.min(...storefront.products.map((p) => p.priceInr));

  const filterLabels = useMemo(() => {
    return STOREFRONT_FILTERS.map((f) => ({
      ...f,
      label:
        f.id === "all"
          ? `All (${storefront.products.length})`
          : f.label,
    }));
  }, [storefront.products]);

  function showToast(message: string) {
    setToastText(message);
    setTimeout(() => setToastText(null), 2400);
  }

  async function save(next: Storefront) {
    setSaving(true);
    setError(undefined);
    try {
      const cappedName = formatCreatorBrandName(next.creatorName, next.handle);
      const normalized: Storefront = {
        ...next,
        creatorName: cappedName,
        handle: next.handle
          ? formatCreatorBrandName(next.handle, next.handle)
          : next.handle,
        headline: applyCreatorCapsInCopy(
          next.headline,
          cappedName,
          next.handle,
        ),
        bio: applyCreatorCapsInCopy(next.bio, cappedName, next.handle),
        intro: applyCreatorCapsInCopy(next.intro, cappedName, next.handle),
      };
      const response = await fetch(`/api/storefront/${storefront.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save changes.");
      setStorefront(payload.storefront);
      setEditing(false);
      showToast("Saved — your shared link is updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function regenerate(
    target: "all" | "bio" | "products" | "product",
    productId?: string,
  ) {
    setRegenerating(productId || target);
    setError(undefined);
    try {
      const response = await fetch(
        `/api/storefront/${storefront.slug}/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target, productId }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Regeneration failed.");
      setStorefront(payload.storefront);
      setEditing(false);
      showToast(
        target === "bio"
          ? "Bio rewritten"
          : target === "products"
            ? "Offers regenerated"
            : "Page regenerated",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setRegenerating(null);
    }
  }

  function updateProduct(id: string, patch: Partial<StorefrontProduct>) {
    setStorefront((prev) => ({
      ...prev,
      products: prev.products.map((product) => {
        if (patch.featured === true) {
          return product.id === id
            ? { ...product, ...patch, featured: true }
            : { ...product, featured: false };
        }
        return product.id === id ? { ...product, ...patch } : product;
      }),
    }));
  }

  function updateDeliverable(id: string, index: number, value: string) {
    setStorefront((prev) => ({
      ...prev,
      products: prev.products.map((product) => {
        if (product.id !== id) return product;
        const deliverables = [...product.deliverables];
        deliverables[index] = value;
        return { ...product, deliverables };
      }),
    }));
  }

  function scrollToOffers(presetGoal?: string) {
    if (presetGoal) setGoalFilter(presetGoal);
    document
      .getElementById("offers-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const heroImage =
    storefront.profileImageUrl || "/images/advisor-hero.png";

  return (
    <div className="min-h-screen bg-paper pb-28 text-pine-ink selection:bg-sage-mid selection:text-pine-ink">
      {toastText ? (
        <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-pine-ink px-4 py-2 text-xs font-medium text-white shadow-lg">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
          <span>{toastText}</span>
        </div>
      ) : null}

      {/* Sticky Minimal Top Identity Bar — exact redesign */}
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="clarity-shell flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <a href="#top" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-sage-mid bg-sage-soft text-xs font-semibold tracking-tight text-pine">
              {initials}
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-[0.04em] text-pine-ink transition-colors group-hover:text-pine">
                {brandName}
              </div>
              <div className="hidden text-[11px] text-ink-muted sm:block">
                {nicheLabel}
              </div>
            </div>
          </a>

          <button
            type="button"
            onClick={() => scrollToOffers()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-pine px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-pine-dark"
          >
            <span>Offers</span>
            <span className="font-mono text-[11px] text-emerald-200">
              {formatInr(lowestPrice)}+
            </span>
          </button>
        </div>
      </header>

      <main
        id="top"
        className="clarity-shell space-y-9 px-4 pb-6 pt-6 sm:px-6 sm:pt-8"
      >
        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-[#fef3f2] px-4 py-3 text-sm text-error"
          >
            {error}
          </p>
        ) : null}

        {/* SECTION 1: AIRY, LOW-TEXT HERO — exact redesign structure */}
        <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="relative min-h-[220px] bg-paper-warm md:col-span-5 md:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt={brandName}
                className="h-56 w-full object-cover object-center md:h-full"
              />
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-line/80 bg-surface/92 py-1 pl-1.5 pr-3 shadow-xs backdrop-blur-md">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pine text-[10px] font-bold text-white">
                  {initials}
                </span>
                <span className="text-xs font-semibold tracking-[0.04em] text-pine-ink">
                  {brandName}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-5 p-6 sm:p-7 md:col-span-7">
              {editing ? (
                <div className="space-y-3">
                  <input
                    className="sp-field__control sp-field__control--plain text-lg font-semibold"
                    value={storefront.creatorName}
                    onChange={(e) =>
                      setStorefront((prev) => ({
                        ...prev,
                        creatorName: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      setStorefront((prev) => ({
                        ...prev,
                        creatorName: displayBrandName(
                          e.target.value,
                          prev.handle,
                        ),
                      }))
                    }
                  />
                  <input
                    className="sp-field__control sp-field__control--plain"
                    value={storefront.niche}
                    onChange={(e) =>
                      setStorefront((prev) => ({
                        ...prev,
                        niche: e.target.value,
                      }))
                    }
                  />
                  <input
                    className="sp-field__control sp-field__control--plain text-xl font-bold"
                    value={storefront.headline}
                    onChange={(e) =>
                      setStorefront((prev) => ({
                        ...prev,
                        headline: e.target.value,
                      }))
                    }
                  />
                  <textarea
                    className="sp-field__control sp-field__control--plain min-h-[96px] resize-y"
                    value={storefront.bio}
                    onChange={(e) =>
                      setStorefront((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save(storefront)}
                    className="rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-dark disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    <h1 className="font-display text-2xl font-semibold leading-[1.18] tracking-tight text-pine-ink sm:text-[30px]">
                      {headlineDisplay}
                    </h1>
                    <p className="text-sm leading-relaxed text-ink-secondary">
                      {bioDisplay}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pillars.map((pillar) => (
                        <span
                          key={pillar.step}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-paper px-3 py-1 text-xs font-medium text-pine-ink"
                        >
                          <span className="font-mono text-[10px] font-bold text-pine">
                            {pillar.step}
                          </span>
                          {pillar.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => scrollToOffers()}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-pine-dark"
                    >
                      <span>
                        {heroCtaLabel(storefront.products.length)}
                      </span>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    {quickStart ? (
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(quickStart)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2.5 text-xs font-semibold text-pine-ink transition-colors hover:bg-paper-warm sm:text-sm"
                      >
                        <Zap className="h-3.5 w-3.5 text-pine" />
                        <span>{formatInr(quickStart.priceInr)} Quick Start</span>
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: FILTER PILLS + OFFERS — exact redesign */}
        <section id="offers-section" className="scroll-mt-20 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-pine-ink sm:text-[26px]">
                Pick what fits you
              </h2>

              <div className="inline-flex rounded-full border border-line bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    viewMode === "cards"
                      ? "bg-pine text-white"
                      : "text-ink-secondary hover:text-pine-ink"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    viewMode === "list"
                      ? "bg-pine text-white"
                      : "text-ink-secondary hover:text-pine-ink"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Compare</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filterLabels.map((filter) => {
                const isSelected = filter.id === goalFilter;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setGoalFilter(filter.id)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-pine bg-pine text-white shadow-xs"
                        : "border-line bg-surface text-ink-secondary hover:border-pine/45 hover:text-pine-ink"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {viewMode === "list" && !editing ? (
            <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-2xs">
              {orderedProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedProduct(item)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-sage-soft/45"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-pine-ink group-hover:text-pine">
                        {item.title}
                      </span>
                      {item.featured ? (
                        <span className="shrink-0 rounded-full bg-pine px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs capitalize text-ink-muted">
                      {item.format} · {formatDurationHint(item.format)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-base font-bold text-pine">
                      {formatInr(item.priceInr)}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper transition-colors group-hover:border-pine group-hover:bg-pine group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {orderedProducts.map((offer, index) => {
                const isGoalMatch =
                  goalFilter !== "all" &&
                  filterIdForProduct(offer) === goalFilter;
                const isDimmed =
                  goalFilter !== "all" &&
                  filterIdForProduct(offer) !== goalFilter;
                const isFlagship = offer.featured || index === 0;

                return (
                  <article
                    key={offer.id}
                    className={`overflow-hidden rounded-3xl border bg-surface transition-all duration-200 ${
                      isGoalMatch
                        ? "border-pine shadow-md ring-2 ring-pine/15"
                        : isFlagship
                          ? "border-pine/35 shadow-sm"
                          : "border-line shadow-2xs"
                    } ${isDimmed ? "opacity-65 hover:opacity-100" : ""}`}
                  >
                    {isGoalMatch ? (
                      <div className="flex items-center justify-between bg-pine px-5 py-1.5 text-[11px] font-semibold tracking-wide text-white">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                          Best fit
                        </span>
                        <span className="font-mono text-emerald-200 capitalize">
                          {offer.format}
                        </span>
                      </div>
                    ) : null}

                    {isFlagship && !compactMode && !editing ? (
                      <div className="relative h-36 overflow-hidden border-b border-line bg-paper-warm sm:h-40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/workshop-editorial.png"
                          alt=""
                          className="h-full w-full object-cover object-center"
                        />
                        <div className="absolute left-4 top-3 flex items-center gap-2">
                          <span className="rounded-full bg-pine px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                            Recommended
                          </span>
                          <span className="rounded-full border border-line/70 bg-surface/92 px-2.5 py-1 text-[11px] font-semibold text-pine-ink backdrop-blur-xs">
                            {formatDurationHint(offer.format)}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3.5 p-5 sm:p-6">
                      {editing ? (
                        <ProductEditor
                          product={offer}
                          regenerating={regenerating === offer.id}
                          onChange={(patch) => updateProduct(offer.id, patch)}
                          onDeliverableChange={(i, v) =>
                            updateDeliverable(offer.id, i, v)
                          }
                          onRegenerate={() => regenerate("product", offer.id)}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                    offer.format === "1:1 call"
                                      ? "border border-amber-200 bg-ochre-soft text-ochre-ink"
                                      : "bg-sage-soft text-pine"
                                  }`}
                                >
                                  {offer.format}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDurationHint(offer.format)}
                                </span>
                              </div>
                              <h3 className="font-display text-xl font-semibold leading-snug text-pine-ink sm:text-[22px]">
                                {offer.title}
                              </h3>
                            </div>
                            <div className="shrink-0 font-mono text-xl font-bold text-pine sm:text-2xl">
                              {formatInr(offer.priceInr)}
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-ink-secondary">
                            {oneLinerFor(offer)}
                          </p>

                          {!compactMode && showPreviews ? (
                            <ProductArtifactPreview
                              product={{
                                ...offer,
                                niche: storefront.niche,
                                expertiseTags: storefront.expertiseTags,
                              }}
                            />
                          ) : null}

                          <div className="flex flex-col justify-between gap-3 border-t border-line/70 pt-2 sm:flex-row sm:items-center">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              {offer.deliverables.slice(0, 3).map((chip) => (
                                <span
                                  key={chip}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-secondary"
                                >
                                  <Check className="h-3.5 w-3.5 shrink-0 text-pine" />
                                  {chip}
                                </span>
                              ))}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedProduct(offer)}
                                className="cursor-pointer rounded-full px-3 py-2 text-xs font-semibold text-ink-secondary transition-colors hover:bg-paper hover:text-pine"
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedProduct(offer)}
                                className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition-all sm:flex-initial sm:text-sm ${
                                  isFlagship || isGoalMatch
                                    ? "bg-pine text-white shadow-xs hover:bg-pine-dark"
                                    : "bg-pine-ink text-white hover:bg-pine"
                                }`}
                              >
                                <span>
                                  {ctaLabelForProduct(offer)}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 3: MINIMAL DECISION CLOSER */}
        {!editing ? (
          <section className="space-y-3.5 rounded-3xl border border-sage-mid bg-sage-soft/80 p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sage-mid bg-surface text-xs font-bold text-pine shadow-2xs">
              {initials}
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-semibold text-pine-ink sm:text-2xl">
                Not sure where to start?
              </h3>
              <p className="text-xs text-ink-secondary sm:text-sm">
                {introDisplay}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pt-0.5 sm:flex-row">
              {flagship ? (
                <button
                  type="button"
                  onClick={() => setSelectedProduct(flagship)}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine-dark sm:w-auto"
                >
                  <span>
                    {flagship.format.toLowerCase().includes("workshop")
                      ? `Join Workshop · ${formatInr(flagship.priceInr)}`
                      : `${flagship.title.slice(0, 22)}${flagship.title.length > 22 ? "…" : ""} · ${formatInr(flagship.priceInr)}`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
              {quickStart && quickStart.id !== flagship?.id ? (
                <button
                  type="button"
                  onClick={() => setSelectedProduct(quickStart)}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-pine-ink transition-colors hover:bg-paper sm:w-auto"
                >
                  <span>Grab {formatInr(quickStart.priceInr)} Templates</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => scrollToOffers()}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-pine-ink transition-colors hover:bg-paper sm:w-auto"
                >
                  Compare all offers
                </button>
              )}
            </div>
          </section>
        ) : null}

        <footer className="pb-4 text-center">
          <span className="font-mono text-xs tracking-[0.04em] text-ink-muted">
            {pathDisplay}
          </span>
        </footer>
      </main>

      <OfferModal
        product={selectedProduct}
        creatorName={brandName}
        onClose={() => setSelectedProduct(null)}
      />

      <CreatorDock
        pathUrl={pathUrl}
        compactMode={compactMode}
        onToggleCompactMode={() => setCompactMode((v) => !v)}
        showPreviews={showPreviews}
        onTogglePreviews={() => setShowPreviews((v) => !v)}
        editing={editing}
        onToggleEditing={() => setEditing((v) => !v)}
        regenerating={Boolean(regenerating)}
        onRegenerateAll={() => regenerate("all")}
        onRegenerateBio={() => regenerate("bio")}
        onRegenerateProducts={() => regenerate("products")}
      />
    </div>
  );
}

function ProductEditor({
  product,
  regenerating,
  onChange,
  onDeliverableChange,
  onRegenerate,
}: {
  product: StorefrontProduct;
  regenerating: boolean;
  onChange: (patch: Partial<StorefrontProduct>) => void;
  onDeliverableChange: (index: number, value: string) => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="space-y-3">
      <input
        className="sp-field__control sp-field__control--plain font-semibold"
        value={product.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className="sp-field__control"
          value={product.format}
          onChange={(e) =>
            onChange({
              format: e.target.value as StorefrontProduct["format"],
            })
          }
        >
          {PRODUCT_FORMATS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
        <select
          className="sp-field__control"
          value={product.coverMotif}
          onChange={(e) =>
            onChange({ coverMotif: e.target.value as CoverMotif })
          }
        >
          {COVER_MOTIFS.map((motif) => (
            <option key={motif} value={motif}>
              cover: {motif}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="sp-field__control sp-field__control--plain min-h-[72px] resize-y"
        value={product.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <input
        className="sp-field__control sp-field__control--plain"
        value={product.outcome}
        onChange={(e) => onChange({ outcome: e.target.value })}
      />
      {product.deliverables.map((item, index) => (
        <input
          key={`${product.id}-d-${index}`}
          className="sp-field__control sp-field__control--plain"
          value={item}
          onChange={(e) => onDeliverableChange(index, e.target.value)}
        />
      ))}
      <input
        type="number"
        className="sp-field__control sp-field__control--plain"
        value={product.priceInr}
        onChange={(e) => onChange({ priceInr: Number(e.target.value || 0) })}
      />
      <textarea
        className="sp-field__control sp-field__control--plain min-h-[64px] resize-y"
        value={product.priceRationale}
        onChange={(e) => onChange({ priceRationale: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm text-pine-ink">
        <input
          type="checkbox"
          checked={product.featured}
          onChange={(e) => onChange({ featured: e.target.checked })}
        />
        Mark as recommended offer
      </label>
      <button
        type="button"
        disabled={regenerating}
        onClick={onRegenerate}
        className="text-xs font-semibold text-pine disabled:opacity-60"
      >
        {regenerating ? "Regenerating…" : "Regenerate this offer"}
      </button>
    </div>
  );
}
