import Link from "next/link";
import FallbackState from "@/components/ui/FallbackState";

export default function StorefrontNotFound() {
  return (
    <main className="app-atmosphere flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <FallbackState
          tone="empty"
          eyebrow="Missing storefront"
          title="This store link isn’t live"
          message="The page may have expired, been renamed, or never published. Create a fresh storefront from the home flow."
          tip="Share links only after Generate my storefront finishes."
        >
          <Link
            href="/"
            className="cta-press inline-flex h-12 w-full items-center justify-center rounded-full bg-pine text-sm font-semibold text-white shadow-xs transition hover:bg-pine-dark"
          >
            Build a new storefront
          </Link>
        </FallbackState>
      </div>
    </main>
  );
}
