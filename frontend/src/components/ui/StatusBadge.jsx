import React from 'react';

export const StatusBadge = ({ status, variant, className = '' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  const v = variant || (typeof status === 'string' ? status.toLowerCase() : '');

  if (v.includes('good') || v.includes('optimal') || v.includes('success')) {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (v.includes('irrigate') || v.includes('alert') || v.includes('high') || v.includes('danger')) {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
  } else if (v.includes('moderate') || v.includes('warning') || v.includes('medium')) {
    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200/80';
  } else if (v.includes('scheduled')) {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75 animate-pulse"></span>
      {status}
    </span>
  );
};
