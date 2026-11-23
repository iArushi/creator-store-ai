"use client";

import { useEffect } from "react";
import FallbackState from "@/components/ui/FallbackState";
import { toUserError } from "@/lib/user-errors";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const friendly = toUserError(error, "generic");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mobile-shell mx-auto flex min-h-full w-full max-w-[440px] flex-col justify-center px-3 py-8 sm:px-4">
      <FallbackState
        tone="error"
        title={friendly.title}
        message={friendly.message}
        tip={friendly.tip || "Your progress on this device may still be recoverable — try again."}
        primaryLabel="Try again"
        onPrimary={reset}
        secondaryLabel="Start over"
        onSecondary={() => {
          window.location.href = "/";
        }}
      />
    </main>
  );
}
