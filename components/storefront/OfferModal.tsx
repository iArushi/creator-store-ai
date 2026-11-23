"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { StorefrontProduct } from "@/lib/schemas";
import { ctaLabelForProduct, formatDurationHint } from "@/components/storefront/clarity-copy";

type OfferModalProps = {
  product: StorefrontProduct | null;
  creatorName: string;
  onClose: () => void;
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OfferModal({
  product,
  creatorName,
  onClose,
}: OfferModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!product) return null;

  const steps = product.deliverables.slice(0, 3).map((detail, i) => ({
    label:
      i === 0
        ? `Start · ${product.format}`
        : i === 1
          ? "Apply live"
          : "Walk away with a plan",
    detail,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-pine-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line bg-paper px-6 pb-4 pt-5">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-pine px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                {product.format}
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" />
                {formatDurationHint(product.format)}
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold leading-tight text-pine-ink sm:text-2xl">
              {product.title}
            </h3>
            <p className="mt-1 font-mono text-lg font-bold text-pine">
              {formatInr(product.priceInr)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="cursor-pointer rounded-full border border-line bg-surface p-2 text-ink-secondary transition-colors hover:text-pine-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          {confirmed ? (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-soft text-pine">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-pine">
                  Interest noted · Demo only
                </div>
                <h4 className="font-display text-2xl font-semibold text-pine-ink">
                  Thanks{name ? `, ${name.split(" ")[0]}` : ""}!
                </h4>
                <p className="mx-auto max-w-sm text-sm text-ink-secondary">
                  This MVP captures interest for{" "}
                  <span className="font-semibold text-pine-ink">{product.title}</span>
                  {email ? (
                    <>
                      {" "}
                      at{" "}
                      <span className="font-mono text-xs text-pine">{email}</span>
                    </>
                  ) : null}
                  . No payment was taken.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-full bg-pine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
              >
                Back to {creatorName}
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-sage-mid bg-sage-soft/75 p-4">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pine">
                  <Sparkles className="h-3.5 w-3.5" />
                  The Outcome You Walk Away With
                </div>
                <p className="text-sm font-medium leading-relaxed text-pine-ink">
                  {product.outcome}
                </p>
              </div>

              <div>
                <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Inside this offer
                </h4>
                <div className="space-y-2.5">
                  {steps.map((step, i) => (
                    <div
                      key={step.label}
                      className="flex items-start gap-3 rounded-xl border border-line bg-paper/65 px-3.5 py-2.5"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine/10 font-mono text-xs font-semibold text-pine">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-pine-ink">
                          {step.label}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.deliverables.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-pine-ink"
                  >
                    <Check className="h-3.5 w-3.5 text-pine" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="rounded-2xl border border-line bg-paper p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Why {formatInr(product.priceInr)}?
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                  {product.priceRationale}
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirmed(true);
                }}
                className="space-y-3 border-t border-line pt-2"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-pine">
                  <span className="h-2 w-2 rounded-full bg-pine" />
                  Demo interest form · no payment in this MVP
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Your first name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-pine-ink placeholder:text-ink-muted focus:border-pine focus:outline-none"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email (demo only)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-pine-ink placeholder:text-ink-muted focus:border-pine focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-pine px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pine-dark"
                >
                  <span>{ctaLabelForProduct(product)}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-pine" />
                  <span>Payments intentionally out of scope for this assignment demo</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
