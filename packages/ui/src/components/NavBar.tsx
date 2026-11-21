import { type JSX, Show } from "solid-js";
import { cn } from "../lib/cn";

/** iOS navigation bar with optional large title */
export function NavBar(props: { title: string; large?: boolean; leading?: JSX.Element; trailing?: JSX.Element; class?: string }) {
  return (
    <header data-slot="navbar" class={cn(
        "safe-top no-select z-20 px-4 pb-2",
        // Large titles scroll away with the content (as on iOS); compact bars stay pinned with a frosted backdrop.
        props.large ? "relative" : "sticky top-0 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl",
        props.class,
      )}>
      <div class="flex h-11 items-center justify-between gap-2">
        <div class="flex min-w-11 items-center">{props.leading}</div>
        <Show when={!props.large}>
          <h1 class="truncate text-[1.0625rem] font-semibold">{props.title}</h1>
        </Show>
        <div class="flex min-w-11 items-center justify-end gap-1">{props.trailing}</div>
      </div>
      <Show when={props.large}>
        <h1 class="font-display mt-1 text-[2.125rem] leading-tight">{props.title}</h1>
      </Show>
    </header>
  );
}
