import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
  ...props
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    danger: 'btn-danger',
    ghost: 'inline-flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium py-2 px-3 rounded-xl transition-all',
  };

  const sizes = {
    sm: 'text-xs py-2 px-3 rounded-lg',
    md: 'text-sm py-2.5 px-5 rounded-xl',
    lg: 'text-base py-3 px-6 rounded-xl font-semibold',
  };

  return (
    <button
      className={`${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="text-lg leading-none">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
