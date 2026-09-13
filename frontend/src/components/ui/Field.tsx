import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface FieldWrapperProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: (id: string) => ReactNode;
}

function FieldWrapper({ label, error, required, hint, children }: FieldWrapperProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label} {required && <span className="text-garnet-600">*</span>}
      </label>
      {children(id)}
      {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
      {error && (
        <span className="text-xs font-medium text-garnet-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

const inputBaseClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink shadow-sm placeholder:text-gray-400 focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100 disabled:bg-gray-100';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => (
    <FieldWrapper label={label} error={error} required={required} hint={hint}>
      {(id) => (
        <input
          ref={ref}
          id={id}
          className={`${inputBaseClass} ${error ? 'border-garnet-400' : ''} ${className}`}
          aria-invalid={!!error}
          {...props}
        />
      )}
    </FieldWrapper>
  ),
);
InputField.displayName = 'InputField';

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => (
    <FieldWrapper label={label} error={error} required={required} hint={hint}>
      {(id) => (
        <textarea
          ref={ref}
          id={id}
          className={`${inputBaseClass} min-h-[90px] resize-y ${error ? 'border-garnet-400' : ''} ${className}`}
          aria-invalid={!!error}
          {...props}
        />
      )}
    </FieldWrapper>
  ),
);
TextareaField.displayName = 'TextareaField';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, className = '', children, ...props }, ref) => (
    <FieldWrapper label={label} error={error} required={required} hint={hint}>
      {(id) => (
        <select
          ref={ref}
          id={id}
          className={`${inputBaseClass} ${error ? 'border-garnet-400' : ''} ${className}`}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  ),
);
SelectField.displayName = 'SelectField';
