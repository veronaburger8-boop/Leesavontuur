import { speedPoints, speedTicks, type ReportResult } from "@/lib/reports";

// Reading speed over time (brief, section 5). One series, so no legend box:
// the title names it. 2px line, 5px markers with a surface ring, hairline
// gridlines, text in text colours, and a tooltip per point. The report table
// next to it is the text version of the same numbers.

const W = 640;
const H = 240;
const M = { top: 12, right: 16, bottom: 30, left: 44 };

export function SpeedChart({
  results,
  locale,
  labels,
}: {
  results: ReportResult[];
  locale: "af" | "en";
  labels: { title: string; tooFew: string; wpm: string; level: string; calibration: string };
}) {
  const points = speedPoints(results);
  if (points.length < 2)
    return (
      <figure style={{ margin: 0 }}>
        <figcaption>
          <h3>{labels.title}</h3>
        </figcaption>
        <p className="sub">{labels.tooFew}</p>
      </figure>
    );

  const ticks = speedTicks(Math.max(...points.map((p) => p.wpm)));
  const top = ticks[ticks.length - 1];
  const x = (i: number) => M.left + (points.length === 1 ? 0 : (i / (points.length - 1)) * (W - M.left - M.right));
  const y = (v: number) => M.top + (1 - v / top) * (H - M.top - M.bottom);
  const date = (s: string) => new Date(s).toLocaleDateString(locale === "af" ? "af-ZA" : "en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" });
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.wpm).toFixed(1)}`).join(" ");
  const hasCalibration = points.some((p) => p.calibration);

  return (
    <figure style={{ margin: 0 }}>
      <figcaption>
        <h3>{labels.title}</h3>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={labels.title} className="speed-chart">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} stroke="var(--stone)" strokeWidth={1} />
            <text x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--muted)">
              {v}
            </text>
          </g>
        ))}
        <text x={M.left} y={H - 8} fontSize={12} fill="var(--muted)">
          {date(points[0].at)}
        </text>
        <text x={W - M.right} y={H - 8} fontSize={12} fill="var(--muted)" textAnchor="end">
          {date(points[points.length - 1].at)}
        </text>
        <path d={path} fill="none" stroke="var(--leaf)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.at} className="speed-point" tabIndex={0}>
            <title>{`${date(p.at)} · ${p.title} · ${p.wpm} ${labels.wpm} · ${labels.level} ${p.level}${p.calibration ? ` · ${labels.calibration}` : ""}`}</title>
            {/* A bigger invisible circle makes the point easy to hover or tap. */}
            <circle cx={x(i)} cy={y(p.wpm)} r={12} fill="transparent" />
            <circle
              className="speed-dot"
              cx={x(i)}
              cy={y(p.wpm)}
              r={5}
              fill={p.calibration ? "var(--paper)" : "var(--leaf)"}
              stroke={p.calibration ? "var(--leaf)" : "var(--paper)"}
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>
      {hasCalibration && (
        <p className="sub" style={{ fontSize: 14, marginTop: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ verticalAlign: "-2px" }}>
            <circle cx="7" cy="7" r="5" fill="var(--paper)" stroke="var(--leaf)" strokeWidth="2" />
          </svg>{" "}
          = {labels.calibration}
        </p>
      )}
    </figure>
  );
}
