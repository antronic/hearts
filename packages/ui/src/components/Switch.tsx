import { Switch as K } from "@kobalte/core/switch";

export function Switch(props: { label: string; checked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <K data-slot="switch" class="no-select flex w-full items-center gap-3" checked={props.checked} onChange={props.onChange}>
      <K.Input class="peer" />
      <K.Label class="text-[1.0625rem]">{props.label}</K.Label>
      <K.Control data-slot="switch-control" class="relative ml-auto h-[31px] w-[51px] shrink-0 rounded-full bg-sunken transition-colors duration-200 data-[checked]:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
        <K.Thumb class="absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-300 ease-theme data-[checked]:translate-x-5" />
      </K.Control>
    </K>
  );
}
