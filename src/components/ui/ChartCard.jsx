import React from 'react';
import { ResponsiveContainer } from 'recharts';

export const ChartCard = ({ title, subtitle, children, action, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
