import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectProps } from "@/types/select.types";

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, disabled, ...props }, ref) => {
    return (
      <div className={cn("relative w-full min-w-0", wrapperClassName)}>
        <select
          ref={ref}
          data-slot="select"
          disabled={disabled}
          className={cn(
            "border-input bg-card text-foreground text-start text-base shadow-sm transition-colors",
            "flex h-12 min-h-[48px] w-full min-w-0 rounded-md border py-2 ps-3 pe-8",
            "appearance-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };

