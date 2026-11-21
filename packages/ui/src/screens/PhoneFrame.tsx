import { createSignal, type JSX, Show } from "solid-js";

/**
 * iPhone-sized frame for screen stories (393×852 = iPhone 16/17 Pro).
 * On a real phone it fills the viewport. Children receive the frame element
 * so sheets/dialogs portal *inside* the device instead of the whole page.
 */
export function PhoneFrame(props: { children: (mount: HTMLElement) => JSX.Element }) {
  const [el, setEl] = createSignal<HTMLElement>();
  return (
    <div class="flex min-h-screen w-full items-center justify-center p-0 sm:p-6">
      <div
        ref={setEl}
        class="bg-app relative isolate flex h-[100dvh] w-full flex-col overflow-hidden text-fg sm:h-[852px] sm:w-[393px] sm:rounded-[55px] sm:shadow-[0_0_0_12px_#111,0_0_0_14px_#333,0_30px_80px_rgb(0_0_0/0.35)]"
        style={{ "--safe-top": "54px", "--safe-bottom": "30px" }}
      >
        <div aria-hidden="true" class="pointer-events-none absolute top-[11px] left-1/2 z-[60] hidden h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-black sm:block" />
        <div aria-hidden="true" class="pointer-events-none absolute bottom-[8px] left-1/2 z-[60] hidden h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-fg/80 sm:block" />
        <Show when={el()}>{(m) => props.children(m())}</Show>
      </div>
    </div>
  );
}
