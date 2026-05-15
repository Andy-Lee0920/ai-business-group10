import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../src/config';
import { PresentationCalendarDemo } from '../../src/features/presentation/presentation-calendar-demo';
import { ScheduleInput } from './schedule-input';
import './schedule.css';

export default async function SchedulePage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) return <PresentationCalendarDemo />;

  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return <ScheduleInput />;
}
