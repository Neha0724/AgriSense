
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
  TrendingUp,
  MapPin,
  CalendarDays,
  Info,
} from 'lucide-react';

const readSessionJSON = (key) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const formatNumber = (value, decimals = 2) => {
  const number = Number(value);
  return value !== null && value !== undefined && Number.isFinite(number)
    ? number.toFixed(decimals)
    : 'Unavailable';
};


const formatFeatureName = (name = '') => {
  const labels = {
    N: 'Nitrogen (N)',
    P: 'Phosphorus (P)',
    K: 'Potassium (K)',
    Crop_Stage: 'Crop Growth Stage',
    rainfall_mm: 'Rainfall',
    et0_mm: 'Reference Evapotranspiration (ET₀)',
    temperature_mean_c: 'Average Temperature',
    humidity_mean_pct: 'Relative Humidity',
    soil_moisture_0_7cm_m3m3: 'Surface Soil Moisture',
    soil_moisture_7_28cm_m3m3: 'Deeper Soil Moisture',
    soil_temperature_0_7cm_c: 'Soil Temperature',
    Soil_Type: 'Soil Type',
    Crop: 'Crop Type',
    pH: 'Soil pH',
  };

  return labels[name] || String(name)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getFeatureImportance = (rec) => {
  const candidates = [
    ...(Array.isArray(rec?.irrigation?.feature_importance)
      ? rec.irrigation.feature_importance.map((item) => ({
          ...item,
          task: 'Irrigation',
        }))
      : []),

    ...(Array.isArray(rec?.fertilizer?.feature_importance)
      ? rec.fertilizer.feature_importance.map((item) => ({
          ...item,
          task: 'Fertilizer',
        }))
      : []),

    // Use combined factors only if individual model factors are absent.
    ...(
      !rec?.irrigation?.feature_importance?.length &&
      !rec?.fertilizer?.feature_importance?.length &&
      Array.isArray(rec?.factorWeights)
        ? rec.factorWeights
        : []
    ),
  ];

  const unique = new Map();

  candidates.forEach((item) => {
    const factor = item.factor || item.feature || item.name;
    const task = item.task || 'Overall';
    const weight = Number(
      item.importance ?? item.weight ?? item.importance_percent
    );

    if (!factor || !Number.isFinite(weight) || weight < 0) return;

    const key = `${task}:${String(factor).toLowerCase()}`;

    if (!unique.has(key)) {
      unique.set(key, {
        ...item,
        factor,
        task,
        rawWeight: weight,
      });
    }
  });

  return [...unique.values()]
    .sort((a, b) => b.rawWeight - a.rawWeight)
    .slice(0, 8);
};

const getImportancePercent = (weight) => {
  // sklearn feature_importances_ normally uses values from 0 to 1.
  const percent = weight <= 1 ? weight * 100 : weight;
  return Math.max(0, Math.min(100, percent));
};

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const {
    activeRecommendation,
    addToast,
    handleSaveRecommendation,
  } = useApp();

  const rec = activeRecommendation;

  const [advisory, setAdvisory] = useState(() =>
    readSessionJSON('agrisense_irrigation_advisory')
  );

  const [mlAnalysisError, setMlAnalysisError] = useState(
    () => sessionStorage.getItem('agrisense_ml_analysis_error') || ''
  );

  const [advisoryError, setAdvisoryError] = useState(
    () => sessionStorage.getItem('agrisense_irrigation_advisory_error') || ''
  );

  useEffect(() => {
    setAdvisory(readSessionJSON('agrisense_irrigation_advisory'));
    setMlAnalysisError(
      sessionStorage.getItem('agrisense_ml_analysis_error') || ''
    );
    setAdvisoryError(
      sessionStorage.getItem('agrisense_irrigation_advisory_error') || ''
    );
  }, []);

  const water = advisory?.water_estimate;
  const featureImportance = getFeatureImportance(rec);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const summary = [
      `Field: ${rec?.fieldName || advisory?.location || 'Field'}`,
      `Crop: ${rec?.cropType || advisory?.crop || 'Not available'}`,
      `Irrigation need: ${rec?.irrigation?.prediction || 'Not available'}`,
      `Fertilizer: ${
        rec?.fertilizer?.recommendation ||
        rec?.fertilizer?.prediction ||
        'Not available'
      }`,
      water
        ? `Estimated crop water use: ${water.estimated_crop_water_use_mm_day} mm/day`
        : '',
      water
        ? `Estimated climate water deficit: ${water.estimated_climate_deficit_mm} mm`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      addToast('Field summary copied successfully.', 'success', 'Share');
    } catch {
      addToast(
        'Clipboard access is unavailable. Use Print Report to save a copy.',
        'info',
        'Share'
      );
    }
  };

  if (!rec && !advisory && !mlAnalysisError && !advisoryError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AgriSense | Smart Field Insights"
          subtitle="Your field analysis, fertilizer recommendations, and irrigation insights will appear here."
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-agri-50 text-agri-700">
            <Sprout className="h-7 w-7" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            Your field report is ready to begin
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enter your field details to generate crop, fertilizer, and
            weather-informed irrigation insights.
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={() => navigate('/fields')}>
              View Fields
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/soil-analysis')}
            >
              Analyze Field
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AgriSense | Smart Field Insights"
        subtitle="Crop-specific predictions, fertilizer recommendations, and weather-informed irrigation guidance."
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
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              Share Summary
            </Button>

            <span className="hidden xl:inline rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Field report
            </span>
          </div>
        }
      />

      {rec && (
        <>
          {/* Field overview */}
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-agri-200 bg-agri-100 text-agri-800">
                <Sprout className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {rec.fieldName || 'Your Field'}
                  </h2>

                  <StatusBadge
                    status={
                      rec.irrigation?.status ||
                      rec.irrigation?.prediction ||
                      'ANALYZED'
                    }
                  />
                </div>

                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>
                    Crop:{' '}
                    <strong>
                      {rec.cropType || 'Not available'}
                    </strong>
                  </span>

                  <span>•</span>

                  <span>
                    Growth stage:{' '}
                    <strong>
                      {rec.growthStage || 'Not available'}
                    </strong>
                  </span>

                  {rec.generatedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Generated:{' '}
                        <strong>{rec.generatedAt}</strong>
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={Sliders}
              onClick={() => navigate('/soil-analysis')}
            >
              Update Field Details
            </Button>
          </section>

          {/* ML recommendation cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {rec.irrigation && (
              <RecommendationCard
                type="irrigation"
                data={rec.irrigation}
              />
            )}

            {rec.fertilizer && (
              <RecommendationCard
                type="fertilizer"
                data={rec.fertilizer}
              />
            )}
          </div>

          {/* Explainability */}
          <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Why these recommendations?
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Explore the input factors the trained models rely on most.
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-agri-100 bg-agri-50 px-3 py-1 text-xs font-bold text-agri-700">
                <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
                Model insights
              </span>
            </div>

            {featureImportance.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
                  {featureImportance.map((item, index) => {
                    const percentage = getImportancePercent(
                      item.rawWeight
                    );

                    return (
                      <div
                        key={`${item.task}-${item.factor}-${index}`}
                        className="flex flex-col justify-between space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div>
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-800">
                              {formatFeatureName(item.factor)}
                            </span>

                            <span className="text-sm font-black text-agri-700">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-500">
                            {item.task} model
                          </p>
                        </div>

                        <div
                          className="h-2 overflow-hidden rounded-full bg-slate-200"
                          role="progressbar"
                          aria-label={`${item.factor} model importance`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percentage}
                        >
                          <div
                            className="h-full rounded-full bg-agri-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="flex items-start gap-2 text-xs text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  Feature importance describes how the model uses inputs
                  overall. It does not establish that a factor caused an
                  individual prediction.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                <h4 className="font-semibold text-slate-800">
                  Model insights are not available yet
                </h4>

                <p className="mt-2 text-sm text-slate-600">
                  Predictions are available, but this analysis did not
                  include feature-importance data. The backend response
                  must supply feature importance before these values can
                  be displayed.
                </p>
              </div>
            )}
          </section>

          {/* Action summary */}
          <section className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-agri-800 bg-agri-900 p-6 text-white shadow-lg md:flex-row md:items-center">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-agri-300">
                <CheckCircle2 className="h-4 w-4 text-agri-400" />
                Field insights summary
              </div>

              <h3 className="text-lg font-bold text-white">
                Fertilizer:{' '}
                {rec.fertilizer?.recommendation ||
                  rec.fertilizer?.prediction ||
                  'Unavailable'}
                {' · '}
                Irrigation:{' '}
                {rec.irrigation?.prediction || 'Unavailable'}
              </h3>

              <p className="text-xs leading-relaxed text-agri-100">
                These are model-generated recommendations based on the
                available dataset. They do not establish a validated
                fertilizer quantity, irrigation volume, or irrigation
                schedule. Confirm decisions with soil-test results and
                local agricultural guidance.
              </p>
            </div>

            <Button
              variant="earth"
              icon={BookmarkPlus}
              onClick={handleSaveRecommendation}
              className="shadow-md"
            >
              Save Field Report
            </Button>
          </section>
        </>
      )}

      {/* Error messages */}
      {(mlAnalysisError || advisoryError) && (
        <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <h3 className="font-bold">
            Some results could not be loaded
          </h3>

          {mlAnalysisError && (
            <p>
              <strong>Field analysis:</strong> {mlAnalysisError}
            </p>
          )}

          {advisoryError && (
            <p>
              <strong>Weather insights:</strong> {advisoryError}
            </p>
          )}

          <p className="text-xs">
            Any results that loaded successfully remain available above.
            Retry the analysis if information is missing.
          </p>
        </section>
      )}

      {/* Weather and crop water insights */}
      {advisory && water && (
        <section
          className="space-y-5 rounded-2xl border border-sky-200 bg-white p-6 shadow-soft"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-700">
              <Droplets className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">
                Weather & Crop Water Insights
              </h2>

              <p className="text-sm text-slate-500">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                {advisory.location || 'Location unavailable'}
                {' · '}
                {advisory.crop || rec?.cropType || 'Crop unavailable'}
                {' · '}
                {advisory.crop_stage ||
                  rec?.growthStage ||
                  'Stage unavailable'}
              </p>
            </div>
          </div>

          {/* Main metrics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Rainfall today
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatNumber(advisory.today_rainfall_mm, 1)} mm
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Reference evapotranspiration (ET₀)
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatNumber(advisory.today_et0_mm)} mm
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Estimated daily crop water demand
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatNumber(
                  water.estimated_crop_water_use_mm_day
                )}{' '}
                mm/day
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Estimated climate water deficit
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatNumber(water.estimated_climate_deficit_mm)} mm
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {water.estimated_climate_deficit_litres_per_hectare == null
                  ? 'Volume equivalent unavailable'
                  : `${Number(
                      water.estimated_climate_deficit_litres_per_hectare
                    ).toLocaleString()} L/ha equivalent`}
              </p>
            </div>
          </div>

          {/* Soil and interpretation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-slate-800">
                Soil & moisture overview
              </h3>

              <p className="text-sm text-slate-600">
                Estimated surface soil moisture:{' '}
                {water.soil_moisture?.surface_m3_m3 == null
                  ? 'Unavailable'
                  : `${water.soil_moisture.surface_m3_m3} m³/m³`}
              </p>

              <p className="text-sm text-slate-600">
                Estimated deeper soil moisture:{' '}
                {water.soil_moisture?.deep_m3_m3 == null
                  ? 'Unavailable'
                  : `${water.soil_moisture.deep_m3_m3} m³/m³`}
              </p>

              <p className="text-sm text-slate-600">
                Farmer-entered soil moisture:{' '}
                {advisory.farmer_entered_soil_moisture_pct == null
                  ? 'Not provided'
                  : `${advisory.farmer_entered_soil_moisture_pct}%`}
              </p>

              <p className="text-xs text-slate-500">
                Soil type: {water.soil_type || 'Not provided'}
              </p>

              <p className="text-xs text-slate-500">
                Weather source: {advisory.weather_source || 'Not specified'}
              </p>

              <p className="text-xs text-slate-500">
                Growth-stage source: {advisory.stage_source || 'Not specified'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                <CloudRain className="h-4 w-4 text-sky-600" />
                What this means
              </h3>

              <p className="text-sm leading-relaxed text-slate-700">
                {water.advisory_summary ||
                  'A weather-based estimate is available. Check actual field conditions before making an irrigation decision.'}
              </p>

              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                {water.moisture_interpretation ||
                  'Soil moisture values are model estimates, not direct field measurements.'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};