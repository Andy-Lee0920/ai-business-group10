import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

type Tone = 'sage' | 'lavender' | 'coral' | 'neutral';
type Size = 'sm' | 'md';

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export const uiClassNames = {
  card: (tone: Tone = 'neutral') => classNames('fevio-card', `fevio-card--${tone}`),
  button: (variant: 'primary' | 'secondary' | 'ghost' = 'primary') =>
    classNames('fevio-button', `fevio-button--${variant}`),
  badge: (tone: Tone = 'sage') => classNames('fevio-badge', `fevio-badge--${tone}`),
  notice: (tone: Exclude<Tone, 'neutral'> = 'sage') => classNames('fevio-notice', `fevio-notice--${tone}`),
  segment: (selected = false) => classNames('fevio-segment', selected && 'fevio-segment--selected'),
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
