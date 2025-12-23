import React from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className,
  disabled,
  ...props
}: ButtonProps): React.ReactElement {
  const baseStyles =
    'inline-flex items-center justify-center rounded-full font-display uppercase tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variantStyles = {
    primary:
      'bg-brand-red text-white hover:bg-red-700 shadow-md hover:shadow-lg px-6 py-3',
    secondary:
      'border-2 border-brand-blue text-brand-blue hover:bg-blue-50 px-6 py-3',
    ghost: 'hover:bg-slate-100 px-4 py-2',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

