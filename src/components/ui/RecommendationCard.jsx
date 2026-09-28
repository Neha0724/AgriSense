import React from 'react';
import { Droplets, Sprout, CheckCircle2, Clock, ShieldCheck, Info } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const RecommendationCard = ({ type = 'irrigation', data, className = '' }) => {
  if (!data) return null;

  const isIrrigation = type === 'irrigation';
  const confidence = data.confidence || (isIrrigation ? 91 : 87);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 transition-all duration-200 hover:shadow-soft-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            isIrrigation ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
            {isIrrigation ? <Droplets className="w-6 h-6" /> : <Sprout className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isIrrigation ? 'Watering Schedule' : 'NPK Dosage'}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              {isIrrigation ? 'Irrigation Recommendation' : 'Fertilizer Recommendation'}
            </h3>
          </div>
        </div>
        <StatusBadge status={isIrrigation ? data.status || 'Irrigate Today' : 'Required'} />
      </div>

      {/* Primary Value Display */}
      <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 font-medium block">
            {isIrrigation ? 'Recommended Dosage' : 'Recommended NPK Application'}
          </span>
          {isIrrigation ? (
            <div className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {data.amount || '18–22 L/m²'}
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-1">
              <div>
                <span className="text-xs text-slate-500 font-bold block">N (Nitrogen)</span>
                <span className="text-2xl font-black text-emerald-700">{data.nitrogen ?? 40} <span className="text-xs font-medium text-slate-500">kg/ha</span></span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <span className="text-xs text-slate-500 font-bold block">P (Phosphorus)</span>
                <span className="text-2xl font-black text-sky-700">{data.phosphorus ?? 20} <span className="text-xs font-medium text-slate-500">kg/ha</span></span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <span className="text-xs text-slate-500 font-bold block">K (Potassium)</span>
                <span className="text-2xl font-black text-earth-700">{data.potassium ?? 25} <span className="text-xs font-medium text-slate-500">kg/ha</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-agri-600" />
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">AI Confidence</span>
            <span className="text-lg font-black text-slate-900">{confidence}%</span>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      {data.timing && (
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Optimal Timing: <strong>{data.timing}</strong></span>
        </div>
      )}

      {/* Rationale List */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-agri-600" /> Key Decision Factors & Reasons
        </h4>
        <ul className="space-y-2">
          {(data.reasons || [
            isIrrigation
              ? 'Soil moisture is below optimal range and rainfall probability is low.'
              : 'Current nutrient levels indicate moderate nitrogen deficiency.'
          ]).map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
