import { StateHomeScaffold } from './state-home-scaffold';
import type { AdaptiveStateHomeBaseProps } from './types';

export function RoutineDayHome({ context }: AdaptiveStateHomeBaseProps) {
  return <StateHomeScaffold eyebrow="Presentation demo" title="오늘의 실행 카드" context={context} badge="확정" />;
}
