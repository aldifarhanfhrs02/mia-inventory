/**
 * Animated warehouse illustration for the login split-card.
 * Faithfully reproduces the design prototype — animated forklift, floating
 * particles, and a scanning line. Animation CSS lives in app/globals.css.
 */
export function WarehouseIllustration() {
  return (
    <div className="w-full max-w-[480px]">
      <svg
        viewBox="0 0 560 380"
        className="h-auto w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Floor */}
        <rect
          x="0"
          y="300"
          width="560"
          height="80"
          fill="oklch(0.94 0.01 250)"
          className="lg-wh-floor"
        />
        <line
          x1="0"
          y1="300"
          x2="560"
          y2="300"
          stroke="oklch(0.85 0.02 250)"
          strokeWidth="1.5"
        />
        {[80, 160, 240, 320, 400, 480].map((x) => (
          <line
            key={x}
            x1={x}
            y1="300"
            x2={x}
            y2="380"
            stroke="oklch(0.90 0.01 250)"
            strokeWidth="0.5"
          />
        ))}

        {/* Back wall */}
        <rect
          x="30"
          y="50"
          width="500"
          height="250"
          rx="4"
          fill="oklch(0.96 0.005 250)"
          stroke="oklch(0.88 0.015 250)"
          strokeWidth="1.2"
          className="lg-wh-wall"
        />

        {/* Shelf 1 */}
        <g className="lg-wh-shelf">
          <rect
            x="55"
            y="85"
            width="140"
            height="215"
            rx="2"
            fill="none"
            stroke="oklch(0.75 0.02 250)"
            strokeWidth="1.3"
          />
          {[140, 195, 248].map((y) => (
            <line
              key={y}
              x1="55"
              y1={y}
              x2="195"
              y2={y}
              stroke="oklch(0.75 0.02 250)"
              strokeWidth="1.3"
            />
          ))}
          <rect x="64" y="97" width="28" height="38" rx="3" className="lg-box lg-box--blue" />
          <rect x="100" y="105" width="24" height="30" rx="3" className="lg-box lg-box--green" />
          <rect x="132" y="100" width="26" height="35" rx="3" className="lg-box lg-box--blue" />
          <rect x="166" y="108" width="20" height="26" rx="3" className="lg-box lg-box--yellow" />
          <rect x="66" y="150" width="34" height="38" rx="3" className="lg-box lg-box--green" />
          <rect x="108" y="156" width="24" height="30" rx="3" className="lg-box lg-box--yellow" />
          <rect x="140" y="152" width="28" height="36" rx="3" className="lg-box lg-box--blue" />
          <rect x="62" y="206" width="28" height="36" rx="3" className="lg-box lg-box--yellow" />
          <rect x="98" y="210" width="32" height="30" rx="3" className="lg-box lg-box--blue" />
          <rect x="140" y="204" width="26" height="34" rx="3" className="lg-box lg-box--green" />
          <rect x="68" y="256" width="36" height="40" rx="3" className="lg-box lg-box--blue" />
          <rect x="112" y="262" width="28" height="34" rx="3" className="lg-box lg-box--green" />
          <rect x="148" y="258" width="30" height="38" rx="3" className="lg-box lg-box--yellow" />
        </g>

        {/* Shelf 2 */}
        <g className="lg-wh-shelf">
          <rect
            x="220"
            y="85"
            width="140"
            height="215"
            rx="2"
            fill="none"
            stroke="oklch(0.75 0.02 250)"
            strokeWidth="1.3"
          />
          {[140, 195, 248].map((y) => (
            <line
              key={y}
              x1="220"
              y1={y}
              x2="360"
              y2={y}
              stroke="oklch(0.75 0.02 250)"
              strokeWidth="1.3"
            />
          ))}
          <rect x="230" y="96" width="30" height="38" rx="3" className="lg-box lg-box--green" />
          <rect x="268" y="104" width="24" height="30" rx="3" className="lg-box lg-box--blue" />
          <rect x="300" y="98" width="28" height="36" rx="3" className="lg-box lg-box--yellow" />
          <rect x="336" y="106" width="18" height="28" rx="3" className="lg-box lg-box--blue" />
          <rect x="228" y="148" width="34" height="38" rx="3" className="lg-box lg-box--yellow" />
          <rect x="270" y="155" width="28" height="32" rx="3" className="lg-box lg-box--green" />
          <rect x="306" y="150" width="24" height="36" rx="3" className="lg-box lg-box--blue" />
          <rect x="232" y="204" width="30" height="34" rx="3" className="lg-box lg-box--blue" />
          <rect x="270" y="208" width="34" height="30" rx="3" className="lg-box lg-box--yellow" />
          <rect x="312" y="202" width="28" height="36" rx="3" className="lg-box lg-box--green" />
          <rect x="228" y="254" width="34" height="42" rx="3" className="lg-box lg-box--green" />
          <rect x="272" y="260" width="26" height="34" rx="3" className="lg-box lg-box--blue" />
          <rect x="306" y="256" width="30" height="38" rx="3" className="lg-box lg-box--yellow" />
        </g>

        {/* Shelf 3 */}
        <g className="lg-wh-shelf">
          <rect
            x="390"
            y="135"
            width="120"
            height="165"
            rx="2"
            fill="none"
            stroke="oklch(0.75 0.02 250)"
            strokeWidth="1.3"
          />
          {[195, 248].map((y) => (
            <line
              key={y}
              x1="390"
              y1={y}
              x2="510"
              y2={y}
              stroke="oklch(0.75 0.02 250)"
              strokeWidth="1.3"
            />
          ))}
          <rect x="398" y="147" width="28" height="42" rx="3" className="lg-box lg-box--blue" />
          <rect x="434" y="153" width="24" height="36" rx="3" className="lg-box lg-box--green" />
          <rect x="466" y="149" width="26" height="38" rx="3" className="lg-box lg-box--yellow" />
          <rect x="400" y="203" width="32" height="38" rx="3" className="lg-box lg-box--yellow" />
          <rect x="440" y="209" width="26" height="30" rx="3" className="lg-box lg-box--blue" />
          <rect x="474" y="205" width="24" height="34" rx="3" className="lg-box lg-box--green" />
          <rect x="398" y="254" width="28" height="42" rx="3" className="lg-box lg-box--green" />
          <rect x="434" y="260" width="30" height="34" rx="3" className="lg-box lg-box--yellow" />
          <rect x="472" y="256" width="26" height="38" rx="3" className="lg-box lg-box--blue" />
        </g>

        {/* Forklift — drives across the warehouse */}
        <g className="lg-wh-forklift">
          <rect x="0" y="268" width="56" height="32" rx="4" fill="oklch(0.55 0.19 258)" />
          <rect x="7" y="260" width="18" height="12" rx="3" fill="oklch(0.65 0.15 258)" />
          <rect x="52" y="288" width="38" height="4" rx="1.5" fill="oklch(0.50 0.02 250)" />
          <rect x="52" y="296" width="38" height="4" rx="1.5" fill="oklch(0.50 0.02 250)" />
          <rect x="52" y="278" width="3.5" height="24" rx="1.5" fill="oklch(0.50 0.02 250)" />
          <circle cx="16" cy="304" r="7" fill="oklch(0.35 0.01 250)" />
          <circle cx="44" cy="304" r="7" fill="oklch(0.35 0.01 250)" />
          <circle cx="16" cy="304" r="3" fill="oklch(0.55 0.01 250)" />
          <circle cx="44" cy="304" r="3" fill="oklch(0.55 0.01 250)" />
          <rect
            x="57"
            y="272"
            width="26"
            height="20"
            rx="3"
            fill="oklch(0.62 0.15 258)"
            opacity="0.85"
          />
        </g>

        {/* Floating particles */}
        <circle cx="90" cy="65" r="2" fill="oklch(0.55 0.15 258)" className="lg-wh-p1" />
        <circle cx="280" cy="55" r="1.5" fill="oklch(0.55 0.15 258)" className="lg-wh-p2" />
        <circle cx="450" cy="70" r="2" fill="oklch(0.55 0.15 258)" className="lg-wh-p3" />
        <circle cx="180" cy="330" r="1.5" fill="oklch(0.55 0.15 258)" className="lg-wh-p4" />
        <circle cx="420" cy="325" r="2" fill="oklch(0.55 0.15 258)" className="lg-wh-p5" />

        {/* Scan line */}
        <line
          x1="400"
          y1="80"
          x2="500"
          y2="80"
          stroke="oklch(0.65 0.18 148)"
          strokeWidth="2"
          className="lg-wh-scan"
        />
      </svg>
    </div>
  );
}
