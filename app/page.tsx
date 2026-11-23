import type { CSSProperties } from "react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { MEDIA } from "@/lib/media";

export default function Home() {
  return (
    <div
      className="app-atmosphere min-h-full"
      style={
        {
          "--atmosphere-image": `url(${MEDIA.pageAtmosphere})`,
        } as CSSProperties
      }
    >
      <main className="mobile-shell flex min-h-full flex-col px-3 pb-[calc(28px+env(safe-area-inset-bottom))] pt-4 sm:px-4 sm:pt-6">
        <OnboardingFlow />
      </main>
    </div>
  );
}
