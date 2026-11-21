export function Spinner(props: { size?: number; label?: string }) {
  const s = () => props.size ?? 20;
  return (
    <span role="status" aria-label={props.label ?? "Loading"} class="inline-block animate-spin rounded-full border-2 border-separator border-t-accent" style={{ width: `${s()}px`, height: `${s()}px` }} />
  );
}
