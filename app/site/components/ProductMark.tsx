// Each glyph comes from its product's signature cut; no screenshots exist yet.
export function ProductMark({ slug }: { slug: string }) {
  return (
    <svg
      className="mark"
      viewBox="0 0 160 100"
      aria-hidden="true"
      focusable="false"
    >
      <g className="mark__ink">
        {slug === 'deck-workshop' && <VersionRail />}
        {slug === 'mugen-arena' && <FrameStrip />}
        {slug === 'wander' && <CompassDial />}
        {slug === 'gallery' && <AsOfStamp />}
      </g>
    </svg>
  )
}

function VersionRail() {
  return (
    <>
      <line x1="20" y1="50" x2="140" y2="50" />
      <path d="M76 50 C 92 50 92 30 108 30 L 120 30" />
      {[28, 52, 76, 132].map((cx) => (
        <circle key={cx} cx={cx} cy="50" r="5" className="mark__fill" />
      ))}
      <circle cx="120" cy="30" r="5" className="mark__accent" />
    </>
  )
}

// Startup outlined, active in accent, recovery faint: the frame-meter convention.
function FrameStrip() {
  const cells = ['s', 's', 's', 'a', 'a', 'r', 'r', 'r', 'r']
  return (
    <>
      {cells.map((kind, i) => (
        <rect
          key={i}
          x={22 + i * 13}
          y="40"
          width="10"
          height="20"
          rx="1"
          className={
            kind === 'a' ? 'mark__accent' : kind === 'r' ? 'mark__fill' : undefined
          }
          fillOpacity={kind === 'r' ? 0.25 : 1}
        />
      ))}
    </>
  )
}

function CompassDial() {
  return (
    <>
      <circle cx="80" cy="50" r="28" />
      <circle cx="80" cy="50" r="18" strokeDasharray="3 4" />
      <line x1="80" y1="18" x2="80" y2="30" className="mark__accent" />
      <line x1="80" y1="70" x2="80" y2="82" />
      <line x1="48" y1="50" x2="60" y2="50" />
      <line x1="100" y1="50" x2="112" y2="50" />
    </>
  )
}

function AsOfStamp() {
  return (
    <>
      <rect x="40" y="34" width="80" height="32" rx="6" />
      <circle cx="56" cy="50" r="5" className="mark__accent" />
      <line x1="70" y1="46" x2="108" y2="46" />
      <line x1="70" y1="55" x2="96" y2="55" />
    </>
  )
}
