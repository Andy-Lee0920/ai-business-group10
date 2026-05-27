import {
  buildPresentationClinicUpdates,
  buildPresentationItems,
} from '../presentation/presentation-testbed';
import { TodayScreen } from './today-screen';

export function PresentationHomeDemo() {
  const now = new Date();
  return (
    <TodayScreen
      dailyBrief="병원 안내 기준으로 다음 실행을 정리했어요."
      initialClinicUpdates={buildPresentationClinicUpdates(now)}
      initialItems={buildPresentationItems(now)}
      userId="presentation-user"
    />
  );
}
