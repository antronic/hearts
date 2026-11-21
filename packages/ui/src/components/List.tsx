import { type JSX, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/cn";

/** iOS "inset grouped" list */
export function ListGroup(props: { header?: string; footer?: string; children: JSX.Element; class?: string }) {
  return (
    <section class={cn("flex flex-col gap-1.5", props.class)}>
      <Show when={props.header}>
        <h3 class="px-4 text-[0.8125rem] font-medium uppercase tracking-wide text-muted">{props.header}</h3>
      </Show>
      <div data-slot="list" class="overflow-hidden rounded-lg bg-surface shadow-sm [&>*+*]:border-t [&>*+*]:border-separator">{props.children}</div>
      <Show when={props.footer}>
        <p class="px-4 text-[0.8125rem] text-muted">{props.footer}</p>
      </Show>
    </section>
  );
}

export function ListItem(props: {
  title: string;
  subtitle?: string;
  leading?: JSX.Element;
  trailing?: JSX.Element;
  chevron?: boolean;
  onClick?: () => void;
}) {
  return (
    <Dynamic
      component={props.onClick ? "button" : "div"}
      type={props.onClick ? "button" : undefined}
      onClick={props.onClick}
      data-slot="list-row"
      data-xp-off={props.onClick ? "" : undefined}
      class={cn("no-select flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left", props.onClick && "active:bg-sunken transition-colors")}
    >
      {props.leading}
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-[1.0625rem]">{props.title}</span>
        <Show when={props.subtitle}>
          <span class="truncate text-[0.8125rem] text-muted">{props.subtitle}</span>
        </Show>
      </span>
      {props.trailing}
      <Show when={props.chevron}>
        <span aria-hidden="true" class="text-muted text-lg">›</span>
      </Show>
    </Dynamic>
  );
}
