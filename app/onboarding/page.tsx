import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_gate_v1')?.value !== 'accepted') redirect('/privacy?next=/onboarding');

  return <OnboardingClient />;
}
