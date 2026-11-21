import { cn } from "../lib/cn";

const hues = [350, 25, 45, 140, 190, 220, 265, 300];

export function Avatar(props: { name: string; size?: number; class?: string; ring?: boolean }) {
  const initials = () =>
    props.name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const hue = () => hues[[...props.name].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  const size = () => props.size ?? 40;
  return (
    <span
      role="img"
      aria-label={props.name}
      class={cn("no-select inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", props.ring && "ring-[3px] ring-accent ring-offset-2 ring-offset-bg animate-turn", props.class)}
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        "font-size": `${size() * 0.38}px`,
        background: `linear-gradient(135deg, hsl(${hue()} 80% 62%), hsl(${hue() + 25} 75% 48%))`,
      }}
    >
      {initials()}
    </span>
  );
}
