import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../src/config';
import { PresentationCalendarDemo } from '../../src/features/presentation/presentation-calendar-demo';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) return <PresentationCalendarDemo />;

  redirect('/schedule');
}
