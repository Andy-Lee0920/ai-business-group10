import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingScreen } from '../../src/features/onboarding/onboarding-screen';

interface OnboardingPageProps {
  searchParams?: Promise<{ invite?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_gate_v1')?.value !== 'accepted') redirect('/privacy?next=/onboarding');
  const params = await searchParams;

  return <OnboardingScreen inviteCode={params?.invite} />;
}
