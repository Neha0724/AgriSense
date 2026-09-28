import React from 'react';
import { StatusBadge } from './StatusBadge';

export const StatCard = ({
  title,
  value,
  unit = '',
  status,
  icon: Icon,
  trend,
  trendDirection = 'neutral', // 'up', 'down', 'neutral'
  subtitle,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft transition-all duration-200 hover:shadow-soft-lg hover:border-slate-300 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-agri-50 text-agri-700 flex items-center justify-center border border-agri-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
          {unit && <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>}
        </div>
        {status && <StatusBadge status={status} />}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={`font-semibold ${trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-amber-600' : 'text-slate-600'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
