import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-garnet-600 text-white hover:bg-garnet-700 focus-visible:ring-garnet-400',
  secondary:
    'bg-white text-ink border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300',
  ghost: 'bg-transparent text-ink hover:bg-gray-100 focus-visible:ring-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
          transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="text-current" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
