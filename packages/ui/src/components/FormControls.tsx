import { createUniqueId, For, type JSX } from "solid-js";
import { cn } from "../lib/cn";

/** Checkbox (input + label; XP.css draws the XP box). */
export function Checkbox(props: { label: string; checked?: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  const id = createUniqueId();
  return (
    <span class="field-row flex min-h-11 items-center gap-3">
      <input id={id} type="checkbox" checked={props.checked} disabled={props.disabled} class="h-5 w-5 accent-[var(--accent)]" onChange={(e) => props.onChange?.(e.currentTarget.checked)} />
      <label for={id} class="text-[1.0625rem]">{props.label}</label>
    </span>
  );
}

/** Radio group (input + label pairs inside a fieldset). */
export function RadioGroup(props: { legend: string; name: string; options: string[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <fieldset class="flex flex-col">
      <legend class="mb-1 text-[0.8125rem] font-medium uppercase tracking-wide text-muted">{props.legend}</legend>
      <For each={props.options}>
        {(o) => {
          const id = createUniqueId();
          return (
            <span class="field-row flex min-h-11 items-center gap-3">
              <input id={id} type="radio" name={props.name} checked={o === props.value} class="h-5 w-5 accent-[var(--accent)]" onChange={() => props.onChange?.(o)} />
              <label for={id} class="text-[1.0625rem]">{o}</label>
            </span>
          );
        }}
      </For>
    </fieldset>
  );
}

/** Group box (fieldset + legend). */
export function GroupBox(props: { legend: string; children: JSX.Element; class?: string }) {
  return (
    <fieldset class={cn("rounded-lg border border-separator p-4", props.class)}>
      <legend class="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-muted">{props.legend}</legend>
      {props.children}
    </fieldset>
  );
}

/** Progress bar (native progress; XP.css draws the green XP blocks; no value = marquee). */
export function ProgressBar(props: { label: string; value?: number; max?: number }) {
  const id = createUniqueId();
  return (
    <div class="flex flex-col gap-1.5">
      <label for={id} class="text-[0.8125rem] text-muted">{props.label}</label>
      <progress id={id} {...(props.value != null ? { value: props.value } : {})} max={props.max ?? 100} class="h-2 w-full overflow-hidden rounded-full accent-[var(--accent)]" />
    </div>
  );
}

/** Slider (native range; XP.css draws the XP trackbar). */
export function Slider(props: { label: string; value: number; min?: number; max?: number; onInput?: (v: number) => void }) {
  const id = createUniqueId();
  return (
    <div class="flex flex-col gap-1.5">
      <label for={id} class="text-[0.8125rem] text-muted">{props.label}</label>
      <input id={id} type="range" min={props.min ?? 0} max={props.max ?? 100} value={props.value} class="w-full accent-[var(--accent)]" onInput={(e) => props.onInput?.(Number(e.currentTarget.value))} />
    </div>
  );
}
