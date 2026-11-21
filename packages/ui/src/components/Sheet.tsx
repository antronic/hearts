import { Dialog } from "@kobalte/core/dialog";
import { type JSX, Show } from "solid-js";

/**
 * Bottom sheet. iOS themes: glass sheet with grabber.
 * XP theme: the same markup is an XP window (.window/.title-bar from XP.css) docked to the bottom.
 * Kobalte Dialog provides focus trap, Escape and screen-reader semantics.
 */
export function Sheet(props: {
  open: boolean;
  onOpenChange?: (o: boolean) => void;
  title: string;
  description?: string;
  children: JSX.Element;
  footer?: JSX.Element;
  mount?: HTMLElement;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} modal>
      <Dialog.Portal mount={props.mount}>
        <Dialog.Overlay data-slot="overlay" class="absolute inset-0 z-40 bg-black/30" />
        <div class="absolute inset-x-0 bottom-0 z-50 flex justify-center">
          <Dialog.Content data-slot="sheet" class="window glass-strong animate-rise safe-bottom w-full max-w-[560px] rounded-t-xl px-5 pt-2 shadow-lg outline-none">
            <div data-slot="grabber" aria-hidden="true" class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-separator" />
            <div class="title-bar mb-1 flex items-center justify-between gap-4">
              <Dialog.Title class="title-bar-text font-display text-[1.375rem]">{props.title}</Dialog.Title>
              <div class="title-bar-controls">
                <Dialog.CloseButton aria-label="Close" class="hit-target press grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sunken text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <span class="xp-hide" aria-hidden="true">✕</span>
                </Dialog.CloseButton>
              </div>
            </div>
            <div class="window-body">
              <Show when={props.description}>
                <Dialog.Description class="mb-4 text-[0.9375rem] text-muted">{props.description}</Dialog.Description>
              </Show>
              <div class="flex flex-col gap-4">{props.children}</div>
              <Show when={props.footer}>
                <div class="mt-5 flex flex-col gap-2">{props.footer}</div>
              </Show>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
