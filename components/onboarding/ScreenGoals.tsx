import FriendlyError from "@/components/ui/FriendlyError";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenShell from "@/components/ui/ScreenShell";
import { GOAL_OPTIONS, type GoalOption } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type ScreenGoalsProps = {
  selected: GoalOption[];
  error?: string;
  loading?: boolean;
  onToggle: (goal: GoalOption) => void;
  onContinue: () => void;
  onBack: () => void;
};

export default function ScreenGoals({
  selected,
  error,
  loading = false,
  onToggle,
  onContinue,
  onBack,
}: ScreenGoalsProps) {
  return (
    <ScreenShell
      title="What should this store do for you?"
      subtitle="'Help me figure out' is already selected — keep it, or add more. Next we'll suggest what to sell and how to price it."
      onBack={onBack}
      footer={
        <PrimaryButton type="button" loading={loading} onClick={onContinue}>
          Show me what I can sell
        </PrimaryButton>
      }
    >
      <FriendlyError error={error} context="goals" />

      <ul className="space-y-2.5">
        {GOAL_OPTIONS.map((goal) => {
          const active = selected.includes(goal);
          return (
            <li key={goal}>
              <button
                type="button"
                onClick={() => onToggle(goal)}
                className={cn(
                  "flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
                  active
                    ? "border-pine bg-sage-soft text-pine-ink ring-2 ring-pine/15"
                    : "border-line bg-surface text-ink-secondary hover:border-pine/35",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    active
                      ? "border-pine bg-pine text-white"
                      : "border-line bg-paper text-transparent",
                  )}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="text-sm font-semibold leading-snug">{goal}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </ScreenShell>
  );
}
