import React from 'react';

export function Card({ className = '', children }) {
  return <div className={["card bg-white border border-slate-200 rounded-lg", className].join(' ')}>{children}</div>;
}

export function CardHeader({ className = '', children }) {
  return <div className={["px-4 py-3 border-b border-slate-200 bg-slate-50", className].join(' ')}>{children}</div>;
}

export function CardContent({ className = '', children }) {
  return <div className={["p-4", className].join(' ')}>{children}</div>;
}


