import FallbackState from "@/components/ui/FallbackState";

type LoadingPanelProps = {
  title: string;
  message: string;
  tip?: string;
  niche?: string;
  tone?: "loading" | "error" | "empty";
  onBack?: () => void;
  backLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
};

export default function LoadingPanel({
  title,
  message,
  tip,
  niche,
  tone = "loading",
  onBack,
  backLabel = "← Back",
  actionLabel,
  onAction,
  actionLoading,
}: LoadingPanelProps) {
  return (
    <FallbackState
      tone={tone}
      niche={niche}
      title={title}
      message={message}
      tip={tip}
      primaryLabel={actionLabel}
      onPrimary={onAction}
      primaryLoading={actionLoading}
      secondaryLabel={onBack ? backLabel : undefined}
      onSecondary={onBack}
    />
  );
}
