"use client";

import StatusBanner from "@/components/ui/StatusBanner";
import { toUserError } from "@/lib/user-errors";

type FriendlyErrorProps = {
  error?: string | null;
  context?:
    | "profile"
    | "discovery"
    | "review"
    | "goals"
    | "opportunities"
    | "storefront"
    | "chat"
    | "upload"
    | "generic";
  className?: string;
};

export default function FriendlyError({
  error,
  context = "generic",
  className = "mb-4",
}: FriendlyErrorProps) {
  if (!error) return null;
  const friendly = toUserError(error, context);

  return (
    <StatusBanner variant="error" title={friendly.title} className={className}>
      <p>{friendly.message}</p>
      {friendly.tip ? (
        <p className="mt-1.5 text-xs opacity-90">{friendly.tip}</p>
      ) : null}
    </StatusBanner>
  );
}
