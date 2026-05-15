interface InjectionCountdownArcProps {
  readonly totalSeconds: number;
  readonly remainingSeconds: number;
  readonly size?: number;
}

const STROKE_WIDTH = 12;
const PADDING = 18;

export function InjectionCountdownArc({
  totalSeconds,
  remainingSeconds,
  size = 240,
}: InjectionCountdownArcProps) {
  const radius = size / 2 - STROKE_WIDTH / 2;
  const center = size / 2;
  const height = size / 2 + PADDING;
  const circumference = Math.PI * radius;
  const clampedRemaining = Math.max(0, remainingSeconds);
  const ratio = Math.max(0, Math.min(1, totalSeconds > 0 ? clampedRemaining / totalSeconds : 0));
  const visibleLength = circumference * ratio;
  const showFill = ratio > 0;
  const arcPath = [
    `M ${STROKE_WIDTH / 2} ${center}`,
    `A ${radius} ${radius} 0 0 1 ${size - STROKE_WIDTH / 2} ${center}`,
  ].join(' ');

  return (
    <svg
      aria-label={`주사까지 남은 시간 ${clampedRemaining}초`}
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
      {showFill ? (
        <path
          d={arcPath}
          data-progress={ratio.toFixed(2)}
          data-testid="injection-countdown-arc-fill"
          fill="none"
          stroke="var(--slc-coral)"
          strokeDasharray={`${visibleLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          strokeWidth={STROKE_WIDTH}
        />
      ) : null}
    </svg>
  );
}
