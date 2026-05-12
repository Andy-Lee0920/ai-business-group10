import type { ReactNode } from 'react';
import styles from './dual-panel-demo.module.css';

export function DemoDeviceFrame({
  children,
  className,
  labelledBy,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  ariaLabel?: string;
}) {
  return (
    <article
      className={`${styles.panel} ${className ?? ''}`}
      data-testid="demo-device-frame"
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
    >
      <DeviceChrome />
      {children}
    </article>
  );
}

export function DeviceChrome() {
  return (
    <>
      <span className={styles.dynamicIsland} data-testid="demo-dynamic-island" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonLeftTop}`} data-testid="demo-device-button" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonLeftBottom}`} data-testid="demo-device-button" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonRightTop}`} data-testid="demo-device-button" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonRightBottom}`} data-testid="demo-device-button" aria-hidden="true" />
    </>
  );
}
