const STEPS = [
  { id: 1, label: "Start" },
  { id: 2, label: "Discover" },
  { id: 3, label: "Confirm" },
  { id: 4, label: "Goals" },
  { id: 5, label: "Offers" },
  { id: 6, label: "Publish" },
] as const;

type ProgressIndicatorProps = {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
};

export default function ProgressIndicator({
  currentStep,
}: ProgressIndicatorProps) {
  const activeLabel =
    STEPS.find((step) => step.id === currentStep)?.label || "Start";

  return (
    <nav
      aria-label="Onboarding progress"
      className="mb-4 rounded-2xl border border-border/80 bg-surface/90 px-3.5 py-3 shadow-[var(--card-shadow)] backdrop-blur"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink">
          Step {currentStep} of {STEPS.length}
        </p>
        <p className="text-xs font-semibold text-accent">{activeLabel}</p>
      </div>

      <ol className="flex items-center gap-1.5">
        {STEPS.map((step) => {
          const active = step.id === currentStep;
          const complete = step.id < currentStep;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div
                className={[
                  "h-1.5 w-full rounded-full transition-all",
                  complete || active ? "bg-accent" : "bg-border",
                  active
                    ? "ring-2 ring-accent/20 ring-offset-1 ring-offset-surface"
                    : "",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
                title={step.label}
              />
              <span className="sr-only">
                {step.label}
                {complete ? " complete" : active ? " current" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
