/** Moment shown when hearts are broken for the first time in a round */
export function HeartBroken() {
  return (
    <div role="status" class="no-select flex flex-col items-center gap-1">
      <span aria-hidden="true" class="animate-heartbreak text-6xl drop-shadow-lg">💔</span>
      <span class="glass animate-rise rounded-full px-3 py-1 text-[0.8125rem] font-semibold text-fg">Hearts are broken</span>
    </div>
  );
}
