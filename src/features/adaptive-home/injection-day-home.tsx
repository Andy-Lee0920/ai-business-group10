import { StateHomeScaffold } from './state-home-scaffold';
import type { AdaptiveStateHomeBaseProps } from './types';

export function InjectionDayHome({ context }: AdaptiveStateHomeBaseProps) {
  return <StateHomeScaffold eyebrow="발표 데모 · Injection Day" title="오늘의 실행 카드" context={context} badge="임박" />;
}
