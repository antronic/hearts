import { Show } from "solid-js";
import { cn } from "../lib/cn";

/** Dynamic-island style toast for game messages ("You must follow suit") */
export function Toast(props: { message: string; icon?: string; tone?: "neutral" | "danger" | "success"; class?: string }) {
  return (
    <div data-slot="toast" role="status" aria-live="polite" class={cn("animate-pop no-select inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-2.5 text-[0.9375em] font-medium text-white shadow-lg", props.class)}>
      <Show when={props.icon}>
        <span aria-hidden="true" class={cn(props.tone === "danger" && "text-[#ff6b6b]", props.tone === "success" && "text-[#4ade80]")}>{props.icon}</span>
      </Show>
      {props.message}
    </div>
  );
}
