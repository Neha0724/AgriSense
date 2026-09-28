import React from 'react';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';

export const NutrientCard = ({ name, value, targetMin = 40, targetMax = 80, unit = 'mg/kg', color = 'emerald' }) => {
  const percentage = Math.min(100, Math.max(0, (value / (targetMax * 1.2)) * 100));
  const isDeficient = value < targetMin;
  const isOptimal = value >= targetMin && value <= targetMax;
  const isExcess = value > targetMax;

  let statusText = 'Optimal';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let barColor = 'bg-emerald-500';

  if (isDeficient) {
    statusText = 'Deficient';
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    barColor = 'bg-amber-500';
  } else if (isExcess) {
    statusText = 'Excess';
    badgeColor = 'bg-sky-50 text-sky-800 border-sky-200';
    barColor = 'bg-sky-500';
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{name}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {statusText}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-black text-slate-900">{value}</span>
        <span className="text-xs text-slate-400 font-medium">{unit}</span>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 font-medium">
          <span>0</span>
          <span>Target: {targetMin}-{targetMax} {unit}</span>
          <span>{Math.round(targetMax * 1.2)}</span>
        </div>
      </div>
    </div>
  );
};
