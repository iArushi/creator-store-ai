import Link from "next/link";
import FallbackState from "@/components/ui/FallbackState";

export default function NotFound() {
  return (
    <main className="app-atmosphere flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <FallbackState
          tone="empty"
          eyebrow="Creator Store AI"
          title="This page isn’t here"
          message="The link may be mistyped, or the page moved. Head home to continue building your store."
          tip="Your onboarding flow always starts at the home page."
        >
          <Link
            href="/"
            className="cta-press inline-flex h-12 w-full items-center justify-center rounded-full bg-pine text-sm font-semibold text-white shadow-xs transition hover:bg-pine-dark"
          >
            Back to home
          </Link>
        </FallbackState>
      </div>
    </main>
  );
}
