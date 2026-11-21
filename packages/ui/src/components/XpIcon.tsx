/** Small XP-style message box icons (drawn in SVG, shown only in the XP theme). */
export function XpIcon(props: { kind: "warning" | "info" | "question" | "error"; size?: number }) {
  const s = () => props.size ?? 32;
  return (
    <svg width={s()} height={s()} viewBox="0 0 32 32" aria-hidden="true" class="shrink-0">
      {props.kind === "warning" ? (
        <>
          <path d="M16 2 L31 29 H1 Z" fill="#fcd116" stroke="#8a6d00" stroke-width="1.2" stroke-linejoin="round" />
          <rect x="14.5" y="10" width="3" height="11" rx="1" fill="#000" />
          <rect x="14.5" y="23" width="3" height="3" rx="1" fill="#000" />
        </>
      ) : (
        <>
          <circle cx="16" cy="16" r="14" fill={props.kind === "error" ? "#e0301e" : "#2f6fe4"} stroke="#fff" stroke-width="2" />
          <text x="16" y="22" text-anchor="middle" font-family="Times New Roman, serif" font-weight="700" font-size={props.kind === "error" ? "18" : "20"} fill="#fff">
            {props.kind === "info" ? "i" : props.kind === "question" ? "?" : "✕"}
          </text>
        </>
      )}
    </svg>
  );
}
