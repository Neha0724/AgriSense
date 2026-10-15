import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { RecommendationCard } from '../components/ui/RecommendationCard';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Sparkles,
  BookmarkPlus,
  MapPin,
  Sprout,
  Activity,
  CheckCircle2,
  Sliders,
  Calendar,
  Share2,
  Printer
} from 'lucide-react';

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const { activeRecommendation, selectedField, handleSaveRecommendation, addToast } = useApp();

  const rec = activeRecommendation || {
    fieldName: selectedField?.name || 'North Field',
    cropType: selectedField?.crop || 'Wheat',
    growthStage: selectedField?.growthStage || 'Vegetative',
    generatedAt: '2026-09-04 09:30 AM',
    soilMoisture: 42,
    irrigation: {
      status: 'IRRIGATE TODAY',
      amount: '18–22 L/m²',
      timing: 'Early morning (06:00 - 08:00 AM)',
      confidence: 91,
      reasons: [
        'Soil moisture is below optimal range (42% vs 50% target).',
        'Low expected rainfall over the next 24 hours (2 mm).',
        'Crop is in vegetative stage requiring peak transpiration water.',
        'Temperature is moderately high (28°C).'
      ]
    },
    fertilizer: {
      nitrogen: 40,
      phosphorus: 20,
      potassium: 25,
      confidence: 87,
      reasons: [
        'Nitrogen level requires supplementation for optimal leaf canopy.',
        'Phosphorus is adequate for active root absorption.',
        'Potassium level is moderate.'
      ]
    },
    factorWeights: [
      { factor: 'Soil Moisture', weight: '38%', impact: 'High', status: 'Deficient (42%)' },
      { factor: 'Weather Forecast', weight: '27%', impact: 'High', status: 'Low Rain (2mm)' },
      { factor: 'Crop Growth Stage', weight: '20%', impact: 'Medium', status: 'Vegetative' },
      { factor: 'Nutrient Levels (NPK)', weight: '15%', impact: 'Medium', status: 'N-Deficient' }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    addToast('Recommendation summary link copied to clipboard.', 'info', 'Share');
  };

  return (
    <div className="space-y-8">
      {/* Top Page Header */}
      <PageHeader
        title="AI Field Analysis & Precision Recommendations"
        subtitle="Custom real-time irrigation & fertilizer prescription calculated by AgriSense AI algorithms."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
            >
              Print Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={BookmarkPlus}
              onClick={handleSaveRecommendation}
            >
              Save Recommendation
            </Button>
          </div>
        }
      />

      {/* Selected Field Metadata Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-agri-100 text-agri-800 flex items-center justify-center border border-agri-200 shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{rec.fieldName || 'North Field'}</h2>
              <StatusBadge status={rec.irrigation?.status || 'IRRIGATE TODAY'} />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
              <span>Crop: <strong>{rec.cropType}</strong></span>
              <span>•</span>
              <span>Growth Stage: <strong>{rec.growthStage}</strong></span>
              <span>•</span>
              <span>Generated: <strong>{rec.generatedAt}</strong></span>
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Sliders}
          onClick={() => navigate('/soil-analysis')}
        >
          Adjust Inputs
        </Button>
      </div>

      {/* Two Large Recommendation Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationCard
          type="irrigation"
          data={rec.irrigation}
        />

        <RecommendationCard
          type="fertilizer"
          data={rec.fertilizer}
        />
      </div>

      {/* Why This Recommendation? Factor Influence Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Why this recommendation?</h3>
            <p className="text-xs text-slate-500">
              Input telemetry factors and their weighted contribution to the final AI prescription model.
            </p>
          </div>
          <span className="text-xs font-bold text-agri-700 bg-agri-50 px-3 py-1 rounded-full border border-agri-100">
            Explainable AI Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {(rec.factorWeights || []).map((fw, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800">{fw.factor}</span>
                  <span className="font-black text-agri-700">{fw.weight}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">Impact Level: {fw.impact}</span>
              </div>
              <div className="text-xs font-bold text-slate-900 pt-2 border-t border-slate-200/60">
                State: <span className="text-agri-800">{fw.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Summary Banner */}
      <div className="bg-agri-900 text-white rounded-2xl p-6 shadow-lg border border-agri-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-agri-300 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-agri-400" /> Action Summary
          </div>
          <h3 className="text-lg font-bold text-white">Apply 18–22 L/m² water early tomorrow morning + 40 kg/ha N formulation</h3>
          <p className="text-xs text-agri-100 leading-relaxed">
            Following this recommendation will restore soil moisture to optimal 50% capacity, eliminate nitrogen deficiency, and support vigorous vegetative canopy formation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="earth"
            icon={BookmarkPlus}
            onClick={handleSaveRecommendation}
            className="shadow-md"
          >
            Save Recommendation
          </Button>
        </div>
      </div>
    </div>
  );
};
