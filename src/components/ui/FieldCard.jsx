import React from 'react';
import { MapPin, Sprout, Layers, Activity, Sparkles, Eye } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';

export const FieldCard = ({ field, onSelect, onAnalyze }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 transition-all duration-200 hover:shadow-soft-lg hover:border-slate-300 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{field.name}</h3>
              <StatusBadge status={field.healthStatus} />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{field.coordinates || 'Farm Location'}</span>
            </p>
          </div>
          <div className="px-2.5 py-1 bg-agri-50 rounded-lg text-agri-800 text-xs font-bold border border-agri-100">
            {field.area} {field.unit}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 py-3 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-agri-600" />
            <div>
              <span className="text-slate-400 block">Crop</span>
              <span className="font-semibold text-slate-800">{field.crop}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-earth-600" />
            <div>
              <span className="text-slate-400 block">Soil Type</span>
              <span className="font-semibold text-slate-800">{field.soilType}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 col-span-2 pt-2 border-t border-slate-200/60">
            <Activity className="w-4 h-4 text-sky-600" />
            <div>
              <span className="text-slate-400">Growth Stage: </span>
              <span className="font-semibold text-slate-800">{field.growthStage}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-100 pt-3">
          <div>
            <span className="text-slate-400 block">Moisture</span>
            <span className="font-bold text-slate-800">{field.soilMoisture}%</span>
          </div>
          <div>
            <span className="text-slate-400 block">NPK Ratio</span>
            <span className="font-bold text-slate-800">{field.nitrogen}:{field.phosphorus}:{field.potassium}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Temp</span>
            <span className="font-bold text-slate-800">{field.temperature}°C</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          icon={Eye}
          onClick={() => onSelect && onSelect(field)}
        >
          View Field
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          icon={Sparkles}
          onClick={() => onAnalyze && onAnalyze(field)}
        >
          Analyze
        </Button>
      </div>
    </div>
  );
};
