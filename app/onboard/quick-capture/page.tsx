import { Card } from '../../../src/components/ui';
import { QuickCaptureClient } from './quick-capture-client';
import styles from '../../onboarding/onboarding.module.css';

export default function QuickCapturePage() {
  return (
    <main className={`app-shell ${styles.onboardingShell}`} data-testid="quick-capture-onboarding">
      <Card className={`hero-card ${styles.onboardingCard}`}>
        <QuickCaptureClient />
      </Card>
    </main>
  );
}
