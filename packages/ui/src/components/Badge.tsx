import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "solid-js";
import { cn } from "../lib/cn";

const badge = cva("no-select inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums", {
  variants: {
    tone: {
      neutral: "bg-sunken text-fg",
      accent: "bg-accent text-accent-fg",
      soft: "bg-accent-soft text-accent-ink",
      success: "bg-success/15 text-success-ink",
      warning: "bg-warning/20 text-warning",
      danger: "bg-danger text-white",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge(props: VariantProps<typeof badge> & { class?: string; children: JSX.Element }) {
  return <span class={cn(badge({ tone: props.tone }), props.class)}>{props.children}</span>;
}
