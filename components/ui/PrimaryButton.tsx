import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrimaryButtonProps = Omit<ButtonProps, "variant"> & {
  loading?: boolean;
};

/** Back-compat wrapper used across onboarding screens. */
export default function PrimaryButton({
  className,
  loading,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      variant="default"
      loading={loading}
      className={cn("w-full", className)}
      {...props}
    />
  );
}
