interface InjectionCountdownArcProps {
  readonly totalMinutes: number;
  readonly remainingMinutes: number;
  readonly size?: number;
}

const STROKE_WIDTH = 12;
const PADDING = 18;

export function InjectionCountdownArc({
  totalMinutes,
  remainingMinutes,
  size = 240,
}: InjectionCountdownArcProps) {
  const radius = size / 2 - STROKE_WIDTH / 2;
  const center = size / 2;
  const height = size / 2 + PADDING;
  const circumference = Math.PI * radius;
  const progress = Math.max(0, Math.min(1, 1 - remainingMinutes / totalMinutes));
  const dashOffset = circumference * (1 - progress);
  const arcPath = [
    `M ${STROKE_WIDTH / 2} ${center}`,
    `A ${radius} ${radius} 0 0 1 ${size - STROKE_WIDTH / 2} ${center}`,
  ].join(' ');

  return (
    <svg
      aria-label={`주사까지 남은 시간 ${remainingMinutes}분`}
      data-testid="injection-countdown-arc"
      height={height}
      role="img"
      viewBox={`0 0 ${size} ${height}`}
      width={size}
    >
      <path
        d={arcPath}
        fill="none"
        stroke="var(--slc-border)"
        strokeLinecap="round"
        strokeWidth={STROKE_WIDTH}
      />
      <path
        d={arcPath}
        data-progress={progress.toFixed(2)}
        data-testid="injection-countdown-arc-fill"
        fill="none"
        stroke="var(--slc-coral)"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth={STROKE_WIDTH}
      />
    </svg>
  );
}
