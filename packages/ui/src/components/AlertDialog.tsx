import { AlertDialog as K } from "@kobalte/core/alert-dialog";
import { For } from "solid-js";
import { cn } from "../lib/cn";
import { XpIcon } from "./XpIcon";

export type AlertAction = { label: string; style?: "default" | "cancel" | "destructive"; onClick?: () => void };

/**
 * Alert (replaces native alert()/confirm()).
 * iOS themes: centered alert with stacked/side-by-side actions.
 * XP theme: a message box window with an icon and centered push buttons.
 */
export function AlertDialog(props: {
  open: boolean;
  onOpenChange?: (o: boolean) => void;
  title: string;
  message?: string;
  icon?: "warning" | "info" | "question" | "error";
  actions: AlertAction[];
  mount?: HTMLElement;
}) {
  return (
    <K open={props.open} onOpenChange={props.onOpenChange}>
      <K.Portal mount={props.mount}>
        <K.Overlay data-slot="overlay" class="absolute inset-0 z-40 bg-black/30" />
        <div class="absolute inset-0 z-50 grid place-items-center p-8">
          <K.Content data-slot="alert" class="window glass-strong animate-pop w-full max-w-[290px] overflow-hidden rounded-lg text-center shadow-lg outline-none">
            <div class="title-bar xp-only">
              <div class="title-bar-text">{props.title}</div>
              <div class="title-bar-controls">
                <button type="button" aria-label="Close" onClick={() => props.onOpenChange?.(false)} />
              </div>
            </div>
            <div class="window-body flex items-start gap-3 px-4 pt-5 pb-4">
              <span class="xp-only">
                <XpIcon kind={props.icon ?? "warning"} />
              </span>
              <div class="flex-1">
                <K.Title class="xp-hide text-[1.0625rem] font-semibold">{props.title}</K.Title>
                <K.Description class="mt-1 text-[0.8125rem] text-fg/80">{props.message}</K.Description>
              </div>
            </div>
            <div data-slot="alert-actions" class={cn("grid border-t border-separator", props.actions.length === 2 ? "grid-cols-2 divide-x" : "divide-y", "divide-separator")}>
              <For each={props.actions}>
                {(a) => (
                  <button
                    type="button"
                    onClick={() => {
                      a.onClick?.();
                      props.onOpenChange?.(false);
                    }}
                    class={cn("h-11 text-[1.0625rem] text-accent-ink active:bg-sunken", a.style === "cancel" && "font-semibold", a.style === "destructive" && "text-danger-ink")}
                  >
                    {a.label}
                  </button>
                )}
              </For>
            </div>
          </K.Content>
        </div>
      </K.Portal>
    </K>
  );
}
