import {
  buildPresentationClinicUpdates,
  buildPresentationItems,
} from '../presentation/presentation-testbed';
import { TodayScreen } from './today-screen';

export function PresentationHomeDemo() {
  const now = new Date('2026-05-26T09:00:00+09:00');
  return (
    <TodayScreen
      dailyBrief="병원 안내 기준으로 오늘 일정을 정리했어요."
      initialClinicUpdates={buildPresentationClinicUpdates(now)}
      initialItems={buildPresentationItems(now)}
      userId="presentation-user"
    />
  );
}
