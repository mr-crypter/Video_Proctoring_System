import React from 'react';

export function Button({ variant = 'default', size = 'md', className = '', disabled, children, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white';
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50',
    ghost: 'bg-transparent hover:bg-slate-100',
  };
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  };
  const classes = [base, variants[variant] || variants.default, sizes[size] || sizes.md, className].join(' ');
  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}


