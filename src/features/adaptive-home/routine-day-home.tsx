import { StateHomeScaffold } from './state-home-scaffold';
import type { AdaptiveStateHomeBaseProps } from './types';

export function RoutineDayHome({ context }: AdaptiveStateHomeBaseProps) {
  return (
    <StateHomeScaffold
      eyebrow="오늘의 케어 정리"
      title="해야 할 일과 쉬어도 되는 일을 나눠요"
      context={context}
      badge="오늘 챙길 일"
    />
  );
}
