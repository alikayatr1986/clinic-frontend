import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import type { cardVariants } from "@/constants/card.constants";

export interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {}
