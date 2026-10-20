import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { RecommendationCard } from '../components/ui/RecommendationCard';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Sprout,
  CheckCircle2,
  Sliders,
  Printer,
  BookmarkPlus,
  Droplets,
  CloudRain,
  AlertTriangle,
} from 'lucide-react';

const readSessionJSON = (key) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const { activeRecommendation, addToast, handleSaveRecommendation } = useApp();
  const rec = activeRecommendation;
  const [advisory, setAdvisory] = useState(() => readSessionJSON('agrisense_irrigation_advisory'));
  const [mlAnalysisError, setMlAnalysisError] = useState(() => sessionStorage.getItem('agrisense_ml_analysis_error') || '');
  const [advisoryError, setAdvisoryError] = useState(() => sessionStorage.getItem('agrisense_irrigation_advisory_error') || '');

  useEffect(() => {
    // Re-read after navigation so the latest analysis saved by Soil Analysis is shown.
    setAdvisory(readSessionJSON('agrisense_irrigation_advisory'));
    setMlAnalysisError(sessionStorage.getItem('agrisense_ml_analysis_error') || '');
    setAdvisoryError(sessionStorage.getItem('agrisense_irrigation_advisory_error') || '');
  }, []);

  const water = advisory?.water_estimate;

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const summary = [
      `Field: ${rec?.fieldName || advisory?.location || 'Field'}`,
      `Crop: ${rec?.cropType || advisory?.crop || 'Not available'}`,
      `Irrigation need: ${rec?.irrigation?.prediction || 'Not available'}`,
      `Fertilizer: ${rec?.fertilizer?.recommendation || 'Not available'}`,
      water ? `Estimated crop water use: ${water.estimated_crop_water_use_mm_day} mm/day` : '',
      water ? `Climate deficit proxy: ${water.climate_deficit_proxy_mm} mm` : '',
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      addToast('Recommendation summary copied to clipboard.', 'success', 'Share');
    } catch {
      addToast('Clipboard access was unavailable. You can use Print Report to save a copy.', 'info', 'Share');
    }
  };

  if (!rec && !advisory && !mlAnalysisError && !advisoryError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Field Analysis & Precision Recommendations"
          subtitle="Your fertilizer, irrigation and weather advisory results will appear here after analysis."
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-lg font-bold text-slate-900">No analysis yet</h2>
          <p className="mt-2 text-sm text-slate-500">Open Soil Analysis, enter your field details, and run the combined analysis.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={() => navigate('/fields')}>View Fields</Button>
            <Button variant="outline" onClick={() => navigate('/soil-analysis')}>Analyze Field</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Field Analysis & Precision Recommendations"
        subtitle="Fertilizer and irrigation predictions, plus the weather-based water-balance advisory."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>Print Report</Button>
            <Button variant="outline" size="sm" onClick={handleShare}>Share Summary</Button>
            <span className="hidden xl:inline text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Analysis results</span>
          </div>
        }
      />

      {rec && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-agri-100 text-agri-800 flex items-center justify-center border border-agri-200 shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-slate-900">{rec.fieldName || 'North Field'}</h2>
                  <StatusBadge status={rec.irrigation?.status || rec.irrigation?.prediction || 'ANALYZED'} />
                </div>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                  <span>Crop: <strong>{rec.cropType || 'Not available'}</strong></span><span>•</span>
                  <span>Growth Stage: <strong>{rec.growthStage || 'Not available'}</strong></span>
                  {rec.generatedAt && <><span>•</span><span>Generated: <strong>{rec.generatedAt}</strong></span></>}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon={Sliders} onClick={() => navigate('/soil-analysis')}>Adjust Inputs</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rec.irrigation && <RecommendationCard type="irrigation" data={rec.irrigation} />}
            {rec.fertilizer && <RecommendationCard type="fertilizer" data={rec.fertilizer} />}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Why this recommendation?</h3>
                <p className="text-xs text-slate-500">Available model factors and their reported influence.</p>
              </div>
              <span className="text-xs font-bold text-agri-700 bg-agri-50 px-3 py-1 rounded-full border border-agri-100">Explainability</span>
            </div>
            {Array.isArray(rec.factorWeights) && rec.factorWeights.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {rec.factorWeights.map((fw, idx) => (
                  <div key={`${fw.factor || 'factor'}-${idx}`} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 gap-2">
                        <span className="font-bold text-slate-800">{fw.factor || 'Factor'}</span>
                        <span className="font-black text-agri-700">{fw.weight ?? 'N/A'}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">Impact Level: {fw.impact || 'Not provided'}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 pt-2 border-t border-slate-200/60">State: <span className="text-agri-800">{fw.status || 'Not provided'}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600">
                The current analysis did not return factor-level weights. Predictions are shown below, but this section cannot claim feature contributions until the backend supplies them.
              </div>
            )}
          </div>

          <div className="bg-agri-900 text-white rounded-2xl p-6 shadow-lg border border-agri-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-agri-300 text-xs font-bold uppercase tracking-wider"><CheckCircle2 className="w-4 h-4 text-agri-400" /> Action Summary</div>
              <h3 className="text-lg font-bold text-white">Fertilizer: {rec.fertilizer?.recommendation || 'Unavailable'} · Irrigation: {rec.irrigation?.prediction || 'Unavailable'}</h3>
              <p className="text-xs text-agri-100 leading-relaxed">These are prototype model predictions. They do not establish validated fertilizer quantity, irrigation volume, or irrigation timing. Verify with soil-test results and local agricultural guidance.</p>
            </div>
            <Button variant="earth" icon={BookmarkPlus} onClick={handleSaveRecommendation} className="shadow-md">Save Recommendation</Button>
          </div>
        </>
      )}

      {(mlAnalysisError || advisoryError) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 space-y-2">
          <h3 className="font-bold">Some analysis results could not be loaded</h3>
          {mlAnalysisError && <p><strong>ML analysis:</strong> {mlAnalysisError}</p>}
          {advisoryError && <p><strong>Weather advisory:</strong> {advisoryError}</p>}
          <p className="text-xs">Any result that did load is still shown on this page.</p>
        </div>
      )}

      {advisory && water && (
        <section className="bg-white rounded-2xl border border-sky-200 shadow-soft p-6 space-y-5" aria-live="polite">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 text-sky-700 p-3"><Droplets className="w-6 h-6" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Weather-based Irrigation Advisory</h2>
              <p className="text-sm text-slate-500">{advisory.location || 'Location unavailable'} · {advisory.crop || rec?.cropType || 'Crop unavailable'} · {advisory.crop_stage || rec?.growthStage || 'Stage unavailable'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Rainfall today</p><p className="text-xl font-bold text-slate-900">{Number(advisory.today_rainfall_mm ?? 0).toFixed(1)} mm</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">ET₀ today</p><p className="text-xl font-bold text-slate-900">{Number(advisory.today_et0_mm ?? 0).toFixed(2)} mm</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Estimated crop water use</p><p className="text-xl font-bold text-slate-900">{Number(water.estimated_crop_water_use_mm_day ?? 0).toFixed(2)} mm/day</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Climate deficit proxy</p><p className="text-xl font-bold text-slate-900">{Number(water.climate_deficit_proxy_mm ?? 0).toFixed(2)} mm</p><p className="text-[11px] text-slate-500">{Number(water.climate_deficit_proxy_litres_per_hectare ?? 0).toLocaleString()} L/ha equivalent</p></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 p-4 space-y-2">
              <h3 className="text-sm font-bold text-slate-800">Soil & moisture details</h3>
              <p className="text-sm text-slate-600">Modelled surface moisture: {water.soil_moisture?.surface_m3_m3 == null ? 'Unavailable' : `${water.soil_moisture.surface_m3_m3} m³/m³`}</p>
              <p className="text-sm text-slate-600">Modelled deeper moisture: {water.soil_moisture?.deep_m3_m3 == null ? 'Unavailable' : `${water.soil_moisture.deep_m3_m3} m³/m³`}</p>
              <p className="text-sm text-slate-600">Farmer-entered soil moisture: {advisory.farmer_entered_soil_moisture_pct == null ? 'Not provided' : `${advisory.farmer_entered_soil_moisture_pct}%`}</p>
              <p className="text-xs text-slate-500">Soil type: {water.soil_type || 'Not provided'}</p>
              <p className="text-xs text-slate-500">Weather source: {advisory.weather_source || 'Not specified'} · Stage source: {advisory.stage_source || 'Not specified'}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><CloudRain className="w-4 h-4 text-sky-600" /> Interpretation</h3>
              <p className="text-sm text-slate-700">{water.advisory_summary || 'A climate-based estimate is available. Check field conditions before deciding.'}</p>
              <p className="text-xs text-slate-500 mt-2">{water.moisture_interpretation || 'Modelled soil moisture is not a field measurement.'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <strong className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Experimental estimate — not an irrigation dose</strong>
            <p>{water.warning || 'This climate-based estimate has not been field validated. Do not use it as a direct watering instruction.'}</p>
            <p className="mt-2 text-xs">{water.water_balance_status || 'Soil-water storage has not been calculated from validated soil parameters.'}</p>
          </div>
        </section>
      )}
    </div>
  );
};