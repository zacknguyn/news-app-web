import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const baseInput =
  'block w-full border bg-app-bg px-3 text-[15px] leading-[1.4] text-app-text outline-none transition-shadow placeholder:text-app-faint disabled:opacity-50';

const stateClass = (invalid?: boolean) =>
  invalid
    ? 'border-state-error-border focus:border-state-error-border focus:shadow-[var(--shadow-focus)]'
    : 'border-app-border focus:border-app-action focus:shadow-[var(--shadow-focus)]';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = 'text', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(baseInput, stateClass(invalid), 'h-10', className)}
      {...rest}
    />
  );
});

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(baseInput, stateClass(invalid), 'min-h-[6.5rem] resize-y py-2.5', className)}
      {...rest}
    />
  );
});

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
};

export const Field: React.FC<FieldProps> = ({ id, label, hint, error, children, optional }) => (
  <div className="space-y-1.5">
    <label
      htmlFor={id}
      className="flex items-baseline gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-app-muted"
    >
      <span>{label}</span>
      {optional && (
        <span className="font-mono text-[10px] font-normal normal-case tracking-wide text-app-faint">Optional</span>
      )}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="font-mono text-[11px] tracking-wide text-state-error">
        {error}
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="font-mono text-[11px] tracking-wide text-app-faint">
        {hint}
      </p>
    ) : null}
  </div>
);
