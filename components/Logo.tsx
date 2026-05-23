// Brand mark per design doc §01.
// PDF-with-folded-corner icon: three lines, the bottom one in amber
// representing the key insight extracted from complexity.

type Variant = "default" | "dark" | "amber";

export function LogoMark({
  size = 22,
  variant = "default",
}: {
  size?: number;
  variant?: Variant;
}) {
  const palette =
    variant === "dark"
      ? { body: "#FAF8F5", fold: "#D1C9BE", line: "#0A2540", accent: "#C96A00" }
      : variant === "amber"
        ? { body: "#FAF8F5", fold: "#D1C9BE", line: "#0A2540", accent: "#7A4800" }
        : { body: "#0A2540", fold: "#15406B", line: "#FAF8F5", accent: "#C96A00" };

  const height = Math.round(size * (44 / 36));
  return (
    <svg
      viewBox="0 0 36 44"
      width={size}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M2 0 H24 L36 12 V44 H2 Z" fill={palette.body} />
      <path d="M24 0 L36 12 H24 Z" fill={palette.fold} />
      <rect x="8" y="18" width="20" height="2" rx="1" fill={palette.line} opacity="0.85" />
      <rect x="8" y="24" width="20" height="2" rx="1" fill={palette.line} opacity="0.85" />
      <rect x="8" y="30" width="14" height="2" rx="1" fill={palette.accent} />
    </svg>
  );
}

export function Wordmark({
  size = "base",
  variant = "default",
}: {
  size?: "sm" | "base" | "lg";
  variant?: Variant;
}) {
  const sizeClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const textColor = variant === "default" ? "text-navy" : "text-cream";
  const accentColor = "text-amber";

  return (
    <span
      className={`font-display font-bold leading-none tracking-tight ${sizeClass} ${textColor}`}
    >
      Know<span className={accentColor}>Ur</span>Policy
    </span>
  );
}

export function Logo({
  size = 22,
  showWordmark = true,
  showTagline = false,
  variant = "default",
}: {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  variant?: Variant;
}) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} variant={variant} />
      {showWordmark && (
        <div className="flex flex-col">
          <Wordmark variant={variant} />
          {showTagline && (
            <span className="mt-0.5 text-xs font-medium text-navy-mid">
              Understand before you sign.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
