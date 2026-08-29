/**
 * CropXense field survey visualization for the authentication layout.
 *
 * Renders a simplified SVG showing farm parcels, crop health indicators,
 * weather symbols, pest trap markers, and risk zones. Used as the left
 * panel on the two-column auth pages.
 *
 * Design: restrained, CropXense-branded — no neon, no gradients, no AI imagery.
 */

export function FieldSurveyVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <svg
        viewBox="0 0 320 400"
        className="w-full max-w-[280px]"
        fill="none"
        aria-hidden
      >
        {/* Background grid */}
        <defs>
          <pattern id="auth-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line)" strokeWidth="0.5" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="320" height="400" fill="url(#auth-grid)" />

        {/* Farm parcels */}
        <rect x="40" y="60" width="100" height="70" stroke="var(--forest)" strokeWidth="1" fill="var(--forest)" fillOpacity="0.06" />
        <rect x="160" y="40" width="120" height="90" stroke="var(--forest)" strokeWidth="1" fill="var(--forest)" fillOpacity="0.04" />
        <rect x="60" y="150" width="80" height="60" stroke="var(--leaf)" strokeWidth="1" fill="var(--leaf)" fillOpacity="0.06" />
        <rect x="160" y="150" width="100" height="80" stroke="var(--forest)" strokeWidth="1" fill="var(--forest)" fillOpacity="0.04" />
        <rect x="40" y="230" width="120" height="60" stroke="var(--amber)" strokeWidth="1" fill="var(--amber)" fillOpacity="0.06" />
        <rect x="180" y="250" width="90" height="70" stroke="var(--leaf)" strokeWidth="1" fill="var(--leaf)" fillOpacity="0.04" />

        {/* Crop health indicator dots */}
        <circle cx="70" cy="85" r="4" fill="var(--leaf)" />
        <circle cx="110" cy="100" r="4" fill="var(--leaf)" />
        <circle cx="200" cy="70" r="4" fill="var(--amber)" />
        <circle cx="240" cy="90" r="4" fill="var(--leaf)" />
        <circle cx="90" cy="170" r="4" fill="var(--leaf)" />
        <circle cx="115" cy="185" r="4" fill="var(--alert)" />
        <circle cx="190" cy="175" r="4" fill="var(--amber)" />
        <circle cx="230" cy="200" r="4" fill="var(--leaf)" />
        <circle cx="80" cy="250" r="4" fill="var(--amber)" />
        <circle cx="130" cy="265" r="4" fill="var(--alert)" />
        <circle cx="210" cy="275" r="4" fill="var(--leaf)" />

        {/* Risk zone overlay on at-risk parcel */}
        <rect x="40" y="230" width="120" height="60" fill="var(--alert)" fillOpacity="0.08" stroke="var(--alert)" strokeWidth="1" strokeDasharray="4 3" />

        {/* Weather station symbol */}
        <g transform="translate(280, 40)">
          <circle r="8" fill="var(--surface)" stroke="var(--water)" strokeWidth="1" />
          <path d="M-3 0 L3 0 M0 -3 L0 3" stroke="var(--water)" strokeWidth="1" />
        </g>

        {/* Pest trap markers (triangles) */}
        <g transform="translate(50, 140)">
          <polygon points="0,-6 5.2,3 -5.2,3" fill="none" stroke="var(--amber)" strokeWidth="1" />
        </g>
        <g transform="translate(270, 240)">
          <polygon points="0,-6 5.2,3 -5.2,3" fill="none" stroke="var(--amber)" strokeWidth="1" />
        </g>

        {/* Sensor nodes */}
        <g transform="translate(150, 120)">
          <rect x="-5" y="-5" width="10" height="10" fill="var(--surface)" stroke="var(--water)" strokeWidth="1" />
          <circle r="2" fill="var(--water)" />
        </g>
        <g transform="translate(90, 215)">
          <rect x="-5" y="-5" width="10" height="10" fill="var(--surface)" stroke="var(--water)" strokeWidth="1" />
          <circle r="2" fill="var(--water)" />
        </g>

        {/* Survey crosshair reticle (the CropXense X) */}
        <g transform="translate(160, 200)" opacity="0.3">
          <line x1="-30" y1="-30" x2="30" y2="30" stroke="var(--ink)" strokeWidth="0.5" />
          <line x1="30" y1="-30" x2="-30" y2="30" stroke="var(--ink)" strokeWidth="0.5" />
          <circle r="20" stroke="var(--ink)" strokeWidth="0.5" />
        </g>

        {/* Legend */}
        <g transform="translate(40, 340)" className="text-[0.6rem]">
          <circle cx="0" cy="0" r="3" fill="var(--leaf)" />
          <text x="10" y="3" fill="var(--ink-2)" fontSize="9" fontFamily="var(--font-sans)">Healthy</text>

          <circle cx="60" cy="0" r="3" fill="var(--amber)" />
          <text x="70" y="3" fill="var(--ink-2)" fontSize="9" fontFamily="var(--font-sans)">Watch</text>

          <circle cx="115" cy="0" r="3" fill="var(--alert)" />
          <text x="125" y="3" fill="var(--ink-2)" fontSize="9" fontFamily="var(--font-sans)">Critical</text>

          <rect x="-2" y="16" width="6" height="6" fill="none" stroke="var(--water)" strokeWidth="0.8" />
          <text x="10" y="22" fill="var(--ink-2)" fontSize="9" fontFamily="var(--font-sans)">Sensor</text>

          <polygon points="63,14 68.2,23 57.8,23" fill="none" stroke="var(--amber)" strokeWidth="0.8" />
          <text x="74" y="22" fill="var(--ink-2)" fontSize="9" fontFamily="var(--font-sans)">Trap</text>
        </g>
      </svg>

      <div className="text-center">
        <p className="text-caption">Field surveillance network</p>
        <p className="mt-1 text-[0.8125rem] text-ink-2">
          Real-time crop health monitoring across India
        </p>
      </div>
    </div>
  );
}
