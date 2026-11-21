import { cva, type VariantProps } from "class-variance-authority";
import { type JSX, splitProps } from "solid-js";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  "press no-select inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg shadow-sm",
        secondary: "bg-sunken text-fg",
        glass: "glass text-fg shadow-sm",
        tinted: "bg-accent-soft text-accent-ink",
        ghost: "text-accent-ink hover:bg-accent-soft",
        destructive: "bg-danger text-white shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-sm",
        md: "h-11 px-5 text-[1.0625rem] rounded-md",
        lg: "h-14 px-6 text-[1.0625rem] rounded-lg w-full",
        icon: "h-11 w-11 rounded-full text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "size", "class"]);
  return <button type="button" data-slot="button" data-variant={local.variant ?? "primary"} data-xp-off={local.variant === "ghost" ? "" : undefined} class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)} {...rest} />;
}
