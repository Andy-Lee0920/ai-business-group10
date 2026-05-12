import { Card } from '../../../src/components/ui';
import { PrescriptionCaptureClient } from './prescription-capture-client';
import styles from '../../onboarding/onboarding.module.css';

export default function PrescriptionCapturePage() {
  return (
    <main className={`app-shell ${styles.onboardingShell}`} data-testid="prescription-capture-onboarding">
      <Card className={`hero-card ${styles.onboardingCard}`}>
        <PrescriptionCaptureClient />
      </Card>
    </main>
  );
}
