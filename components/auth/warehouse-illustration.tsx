/** Decorative warehouse illustration for the login split-card. */
export function WarehouseIllustration() {
  const BOX = ["#6366f1", "#22c55e", "#eab308"];
  const shelves = [
    { x: 55, w: 140, rows: [97, 150, 206, 256] },
    { x: 220, w: 140, rows: [96, 148, 204, 254] },
  ];
  return (
    <svg
      viewBox="0 0 560 380"
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="300" width="560" height="80" fill="hsl(var(--muted))" />
      <rect
        x="30"
        y="50"
        width="500"
        height="250"
        rx="4"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="1.2"
      />
      {shelves.map((s) => (
        <g key={s.x}>
          <rect
            x={s.x}
            y={85}
            width={s.w}
            height={215}
            rx="2"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.3"
          />
          {[140, 195, 248].map((y) => (
            <line
              key={y}
              x1={s.x}
              y1={y}
              x2={s.x + s.w}
              y2={y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
            />
          ))}
          {s.rows.flatMap((y, ri) =>
            [0, 1, 2, 3].map((ci) => (
              <rect
                key={`${y}-${ci}`}
                x={s.x + 10 + ci * 33}
                y={y}
                width={26}
                height={36}
                rx={3}
                fill={BOX[(ri + ci) % 3]}
                opacity={0.85}
              />
            )),
          )}
        </g>
      ))}
      <g>
        <rect x="390" y="135" width="120" height="165" rx="2" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.3" />
        {[195, 248].map((y) => (
          <line key={y} x1="390" y1={y} x2="510" y2={y} stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
        ))}
        {[147, 203, 256].flatMap((y, ri) =>
          [0, 1, 2].map((ci) => (
            <rect
              key={`s3-${y}-${ci}`}
              x={398 + ci * 36}
              y={y}
              width={28}
              height={38}
              rx={3}
              fill={BOX[(ri + ci) % 3]}
              opacity={0.85}
            />
          )),
        )}
      </g>
      {/* Forklift */}
      <g>
        <rect x="0" y="268" width="56" height="32" rx="4" fill="hsl(var(--primary))" />
        <rect x="7" y="260" width="18" height="12" rx="3" fill="hsl(var(--primary))" opacity="0.7" />
        <rect x="52" y="288" width="38" height="4" rx="1.5" fill="hsl(var(--muted-foreground))" />
        <rect x="52" y="278" width="3.5" height="24" rx="1.5" fill="hsl(var(--muted-foreground))" />
        <circle cx="16" cy="304" r="7" fill="hsl(var(--foreground))" />
        <circle cx="44" cy="304" r="7" fill="hsl(var(--foreground))" />
      </g>
    </svg>
  );
}
