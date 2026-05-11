import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ScheduleInput } from './schedule-input';
import './schedule.css';

export default async function SchedulePage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return <ScheduleInput />;
}
