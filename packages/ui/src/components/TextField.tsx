import { TextField as K } from "@kobalte/core/text-field";
import { Show } from "solid-js";
import { cn } from "../lib/cn";

export function TextField(props: {
  label: string;
  value?: string;
  placeholder?: string;
  type?: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  onChange?: (v: string) => void;
  class?: string;
}) {
  return (
    <K class={cn("flex flex-col gap-1.5", props.class)} value={props.value} onChange={props.onChange} validationState={props.error ? "invalid" : "valid"}>
      <K.Label data-slot="field-label" class={cn("px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-muted", props.hideLabel && "sr-only")}>{props.label}</K.Label>
      <K.Input
        data-slot="input"
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        class="h-12 w-full rounded-md bg-surface px-4 text-[1.0625rem] text-fg shadow-sm outline-none ring-1 ring-separator placeholder:text-muted focus:ring-2 focus:ring-accent data-[invalid]:ring-2 data-[invalid]:ring-danger"
      />
      <Show when={props.description && !props.error}>
        <K.Description class="px-1 text-[0.8125rem] text-muted">{props.description}</K.Description>
      </Show>
      <K.ErrorMessage class="px-1 text-[0.8125rem] text-danger-ink">{props.error}</K.ErrorMessage>
    </K>
  );
}
