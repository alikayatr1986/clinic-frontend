import { cva } from "class-variance-authority";

export const cardVariants = cva("flex text-card-foreground", {
  variants: {
    variant: {
      default: "bg-card flex-col gap-6 rounded-xl border border-border py-6 shadow-sm",
      trust: "h-full bg-muted flex-row items-center gap-3 rounded-xl border border-border px-5 py-5 shadow-sm lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:text-foreground lg:shadow-none [&_svg]:size-8 [&_svg]:shrink-0 [&_svg]:text-primary",
    },
  },
  defaultVariants: { variant: "default" },
});
