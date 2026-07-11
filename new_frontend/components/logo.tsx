/**
 * Logo — crisp, scalable YesBroker brand mark.
 * A rounded badge (teal → sky brand gradient) holding a house whose roofline
 * doubles as a verification checkmark. Pure SVG so it stays sharp at any size
 * and blends with the app's brand palette (unlike the raster logo).
 */
export function Logo({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="YesBroker"
    >
      <defs>
        <linearGradient id="yb-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Badge */}
      <rect width="48" height="48" rx="13" fill="url(#yb-grad)" />
      <rect width="48" height="48" rx="13" fill="black" fillOpacity="0.06" />

      {/* House body */}
      <path
        d="M15 23.5 V33.5 H33 V23.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Roof */}
      <path
        d="M12.5 24 L24 14 L35.5 24"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Verification check inside the house */}
      <path
        d="M19.5 28.5 L22.8 31.6 L29 24.8"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
