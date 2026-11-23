import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import StorefrontView from "@/components/storefront/StorefrontView";
import { getStorefront } from "@/lib/storefront-store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function StorefrontContent({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const storefront = await getStorefront(slug);

  if (!storefront) {
    notFound();
  }

  return <StorefrontView initial={storefront} />;
}

function StorefrontFallback() {
  return (
    <div className="app-atmosphere flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] overflow-hidden rounded-[24px] border border-line bg-surface p-6 shadow-[var(--card-shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">
          Opening store
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold text-pine-ink">
          Loading this creator’s page…
        </h1>
        <div className="mt-5 space-y-2" aria-hidden>
          <div className="h-2 w-full animate-pulse rounded-full bg-sage-soft" />
          <div className="h-2 w-[75%] animate-pulse rounded-full bg-sage-soft/70" />
        </div>
      </div>
    </div>
  );
}

export default function StorefrontPublicPage(props: PageProps) {
  return (
    <Suspense fallback={<StorefrontFallback />}>
      <StorefrontContent {...props} />
    </Suspense>
  );
}
