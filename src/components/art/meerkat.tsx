// Mika the meerkat (erdmannetjie), Leesavontuur's own mascot: standing on
// look-out with an open book. Original artwork, drawn as simple shapes.

export function Meerkat({
  size = 120,
  title,
  reading = true,
  pose,
  className,
}: {
  size?: number;
  title?: string;
  reading?: boolean;
  /** "wave": one paw waving hello; "cheer": both paws in the air. Overrides `reading`. */
  pose?: "wave" | "cheer";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 160"
      width={size}
      height={(size * 160) / 120}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* tail */}
      <path d="M78 128 C100 124 106 104 100 86" fill="none" stroke="#9c6b3c" strokeWidth="7" strokeLinecap="round" />
      <path d="M100 86 C99 81 98 78 96 76" fill="none" stroke="#3b2a1e" strokeWidth="7" strokeLinecap="round" />
      {/* feet */}
      <ellipse cx="48" cy="150" rx="12" ry="6" fill="#9c6b3c" />
      <ellipse cx="74" cy="150" rx="12" ry="6" fill="#9c6b3c" />
      {/* body */}
      <path d="M36 146 C28 118 34 84 46 70 L76 70 C88 84 94 118 86 146 Z" fill="#c9965f" />
      <path d="M48 142 C44 120 47 96 54 84 L68 84 C75 96 78 120 74 142 Z" fill="#ecd3a8" />
      {/* head */}
      <ellipse cx="61" cy="44" rx="26" ry="28" fill="#c9965f" />
      {/* ears */}
      <circle cx="37" cy="34" r="6" fill="#3b2a1e" />
      <circle cx="85" cy="34" r="6" fill="#3b2a1e" />
      {/* face */}
      <path d="M44 50 C44 62 52 72 61 72 C70 72 78 62 78 50 C74 56 48 56 44 50 Z" fill="#ecd3a8" />
      <ellipse cx="50" cy="42" rx="7" ry="8" fill="#3b2a1e" />
      <ellipse cx="72" cy="42" rx="7" ry="8" fill="#3b2a1e" />
      <circle cx="51" cy="42" r="3.4" fill="#ffffff" />
      <circle cx="71" cy="42" r="3.4" fill="#ffffff" />
      <circle cx="52" cy="43" r="1.8" fill="#1d2b36" />
      <circle cx="72" cy="43" r="1.8" fill="#1d2b36" />
      <ellipse cx="61" cy="56" rx="5" ry="3.5" fill="#3b2a1e" />
      <path d="M55 63 Q61 68 67 63" fill="none" stroke="#3b2a1e" strokeWidth="2" strokeLinecap="round" />
      {pose === "wave" ? (
        <>
          {/* one paw resting, the other waving hello (the arm swings in CSS) */}
          <ellipse cx="46" cy="96" rx="6" ry="8" fill="#9c6b3c" />
          <g className="mika-arm">
            <path d="M78 84 C88 74 94 64 97 54" fill="none" stroke="#c9965f" strokeWidth="9" strokeLinecap="round" />
            <ellipse cx="98" cy="48" rx="7" ry="8" fill="#9c6b3c" />
          </g>
        </>
      ) : pose === "cheer" ? (
        <>
          {/* both paws in the air */}
          <path d="M44 84 C34 74 28 64 25 54" fill="none" stroke="#c9965f" strokeWidth="9" strokeLinecap="round" />
          <ellipse cx="24" cy="48" rx="7" ry="8" fill="#9c6b3c" />
          <path d="M78 84 C88 74 94 64 97 54" fill="none" stroke="#c9965f" strokeWidth="9" strokeLinecap="round" />
          <ellipse cx="98" cy="48" rx="7" ry="8" fill="#9c6b3c" />
        </>
      ) : reading ? (
        <>
          {/* open book held in both paws */}
          <path d="M34 92 L60 98 L60 124 L34 118 Z" fill="#ffffff" stroke="#2e6b3f" strokeWidth="3" strokeLinejoin="round" />
          <path d="M86 92 L60 98 L60 124 L86 118 Z" fill="#ffffff" stroke="#2e6b3f" strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 101 L54 104 M40 108 L54 111 M66 104 L80 101 M66 111 L80 108" stroke="#8fb49a" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="34" cy="106" rx="6" ry="7" fill="#9c6b3c" />
          <ellipse cx="86" cy="106" rx="6" ry="7" fill="#9c6b3c" />
        </>
      ) : (
        <>
          {/* paws held up in front, on look-out */}
          <ellipse cx="50" cy="90" rx="6" ry="8" fill="#9c6b3c" />
          <ellipse cx="72" cy="90" rx="6" ry="8" fill="#9c6b3c" />
        </>
      )}
    </svg>
  );
}
