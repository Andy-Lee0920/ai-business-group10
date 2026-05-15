import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

type Tone = 'sage' | 'lavender' | 'coral' | 'neutral';
type Size = 'sm' | 'md';
type ShellTone = 'warm' | 'plain';
type StatusState = 'idle' | 'shared' | 'synced' | 'attention' | 'done';

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}


export const fevioPrimitiveStyles = {
  screenShell: (tone: ShellTone = 'warm'): CSSProperties => ({
    minHeight: '100dvh',
    maxWidth: 430,
    margin: '0 auto',
    padding: 'max(48px, env(safe-area-inset-top)) 24px max(112px, env(safe-area-inset-bottom))',
    background: tone === 'warm' ? 'var(--slc-bg)' : 'var(--slc-card)',
    color: 'var(--slc-text)',
  }),
  primaryCta: (disabled = false): CSSProperties => ({
    minHeight: 52,
    width: '100%',
    border: 'none',
    borderRadius: 999,
    background: disabled ? '#E5DDD8' : 'linear-gradient(180deg, #D86F56 0%, var(--slc-coral) 100%)',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '0 12px 26px rgba(196, 97, 74, 0.2)',
  }),
  choiceCard: (selected = false): CSSProperties => ({
    minHeight: 156,
    borderRadius: 20,
    border: selected ? '1.8px solid var(--slc-coral)' : '1.5px solid var(--slc-border)',
    background: selected ? 'var(--slc-coral-light)' : 'rgba(255,255,255,0.82)',
    color: 'var(--slc-text)',
    padding: '16px 14px',
    display: 'grid',
    alignContent: 'space-between',
    gap: 12,
    boxShadow: selected ? '0 12px 28px rgba(196, 97, 74, 0.14)' : '0 8px 22px rgba(80, 50, 40, 0.06)',
  }),
  settingsRow: (): CSSProperties => ({
    minHeight: 56,
    width: '100%',
    border: 'none',
    borderBottom: '1px solid var(--slc-border)',
    background: '#fff',
    color: 'var(--slc-text)',
    display: 'grid',
    gridTemplateColumns: '28px 1fr auto',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    textAlign: 'left',
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 800,
    textDecoration: 'none',
  }),
} as const;

export const uiClassNames = {
  card: (tone: Tone = 'neutral') => classNames('fevio-card', `fevio-card--${tone}`),
  button: (variant: 'primary' | 'secondary' | 'ghost' = 'primary') =>
    classNames('fevio-button', `fevio-button--${variant}`),
  badge: (tone: Tone = 'sage') => classNames('fevio-badge', `fevio-badge--${tone}`),
  notice: (tone: Exclude<Tone, 'neutral'> = 'sage') => classNames('fevio-notice', `fevio-notice--${tone}`),
  segment: (selected = false) => classNames('fevio-segment', selected && 'fevio-segment--selected'),
  selectionChip: (selected = false, tone: Tone = 'sage') =>
    classNames('fevio-selection-chip', `fevio-selection-chip--${tone}`, selected && 'fevio-selection-chip--selected'),
  confirmChip: (selected = false, tone: Tone = 'sage') =>
    classNames('fevio-confirm-chip', `fevio-confirm-chip--${tone}`, selected && 'fevio-confirm-chip--selected'),
  statusBadge: (state: StatusState = 'idle') => classNames('fevio-status-badge', `fevio-status-badge--${state}`),
  timeInput: () => 'fevio-time-input',
  touchSize: (size: Size = 'md') => `fevio-touch-${size}`,
};

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'article' | 'div';
  tone?: Tone;
};

export function Card({ as: Component = 'section', tone = 'neutral', className, ...props }: CardProps) {
  return <Component className={classNames(uiClassNames.card(tone), className)} {...props} />;
}

type CtaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function CtaButton({ variant = 'primary', className, ...props }: CtaButtonProps) {
  return <button className={classNames(uiClassNames.button(variant), className)} {...props} />;
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function Badge({ tone = 'sage', className, ...props }: BadgeProps) {
  return <span className={classNames(uiClassNames.badge(tone), className)} {...props} />;
}

type NoticeProps = HTMLAttributes<HTMLDivElement> & {
  tone?: Exclude<Tone, 'neutral'>;
};

export function Notice({ tone = 'sage', className, ...props }: NoticeProps) {
  return <div className={classNames(uiClassNames.notice(tone), className)} {...props} />;
}

type SelectionChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  tone?: Tone;
};

export function SelectionChip({ selected = false, tone = 'sage', className, ...props }: SelectionChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={classNames(uiClassNames.selectionChip(selected, tone), className)}
      type="button"
      {...props}
    />
  );
}

type ConfirmChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  tone?: Tone;
};

export function ConfirmChip({ selected = false, tone = 'sage', className, ...props }: ConfirmChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={classNames(uiClassNames.confirmChip(selected, tone), className)}
      type="button"
      {...props}
    />
  );
}

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  state?: StatusState;
};

export function StatusBadge({ state = 'idle', className, ...props }: StatusBadgeProps) {
  return <span className={classNames(uiClassNames.statusBadge(state), className)} {...props} />;
}

type TimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  helperText?: ReactNode;
};

export function TimeInput({ label, helperText, className, id, ...props }: TimeInputProps) {
  const helperId = helperText && id ? `${id}-helper` : undefined;

  return (
    <label className={classNames(uiClassNames.timeInput(), className)}>
      <span>{label}</span>
      <input aria-describedby={helperId} id={id} inputMode="numeric" type="time" {...props} />
      {helperText ? <small id={helperId}>{helperText}</small> : null}
    </label>
  );
}

type SegmentedButtonOption = {
  value: string;
  label: ReactNode;
};

type SegmentedButtonProps = {
  label: string;
  options: SegmentedButtonOption[];
  value: string;
  onSelect?: (value: string) => void;
};

export function SegmentedButton({ label, options, value, onSelect }: SegmentedButtonProps) {
  return (
    <div className="fevio-segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-pressed={selected}
            className={uiClassNames.segment(selected)}
            key={option.value}
            onClick={() => onSelect?.(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}


type ScreenShellProps = HTMLAttributes<HTMLDivElement> & {
  tone?: ShellTone;
};

export function ScreenShell({ tone = 'warm', style, ...props }: ScreenShellProps) {
  return <div style={{ ...fevioPrimitiveStyles.screenShell(tone), ...style }} {...props} />;
}

type PrimaryCTAProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function PrimaryCTA({ loading = false, disabled = false, style, children, ...props }: PrimaryCTAProps) {
  const inactive = disabled || loading;
  return (
    <button type="button" disabled={inactive} style={{ ...fevioPrimitiveStyles.primaryCta(inactive), ...style }} {...props}>
      {loading ? '처리 중...' : children}
    </button>
  );
}

type ChoiceCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function ChoiceCard({ selected = false, style, ...props }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-state={selected ? 'selected' : 'idle'}
      style={{ ...fevioPrimitiveStyles.choiceCard(selected), ...style }}
      {...props}
    />
  );
}

type SettingsRowBaseProps = {
  icon?: ReactNode;
  label: ReactNode;
  detail?: ReactNode;
  danger?: boolean;
};

type SettingsRowLinkProps = SettingsRowBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type SettingsRowButtonProps = SettingsRowBaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { href?: undefined };

export function SettingsRow(props: SettingsRowLinkProps | SettingsRowButtonProps) {
  const { icon, label, detail, danger = false } = props;
  const content = (
    <>
      <span aria-hidden style={{ color: danger ? '#C44F4F' : 'var(--slc-muted)', display: 'grid', placeItems: 'center' }}>{icon ?? '•'}</span>
      <span style={{ color: danger ? '#C44F4F' : 'var(--slc-text)' }}>{label}</span>
      <span style={{ color: 'var(--slc-muted)', fontSize: 13, fontWeight: 700 }}>{detail ?? '›'}</span>
    </>
  );

  if ('href' in props && props.href) {
    const { href, icon: _icon, label: _label, detail: _detail, danger: _danger, style, ...anchorProps } = props;
    return <Link href={href} style={{ ...fevioPrimitiveStyles.settingsRow(), ...style }} {...anchorProps}>{content}</Link>;
  }

  const buttonRowProps = props as SettingsRowButtonProps;
  const { icon: _icon, label: _label, detail: _detail, danger: _danger, style, ...buttonProps } = buttonRowProps;
  return <button type="button" style={{ ...fevioPrimitiveStyles.settingsRow(), ...style }} {...buttonProps}>{content}</button>;
}
