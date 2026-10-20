import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { NutrientCard } from '../components/ui/NutrientCard';
import { Button } from '../components/ui/Button';
import { apiService } from '../services/api';
import {
  Sparkles,
  FlaskConical,
  Droplets,
  Thermometer,
  CloudRain,
  Wind,
  Layers,
  Sprout,
  Activity,
  Maximize2
} from 'lucide-react';

export const SoilAnalysisPage = () => {
  const navigate = useNavigate();
  const { selectedField, fields, handleAnalyzeField, isAnalyzing } = useApp();

  // Form input state initialized with selected field values or default defaults
  const [formData, setFormData] = useState({
    fieldId: selectedField?.id || '',
    fieldName: selectedField?.name || 'North Field',
    soilMoisture: selectedField?.soilMoisture ?? 25,
    soilMoistureVolume: selectedField?.soilMoistureVolume ?? 1059,
    pH: selectedField?.pH ?? 7.1,
    nitrogen: selectedField?.nitrogen ?? 108,
    phosphorus: selectedField?.phosphorus ?? 11.59,
    potassium: selectedField?.potassium ?? 130,
    temperature: selectedField?.temperature ?? 28,
    humidity: selectedField?.humidity ?? 65,
    rainfall: selectedField?.rainfall ?? 12,
    cropType: selectedField?.cropType || selectedField?.crop || 'Cotton',
    growthStage: selectedField?.growthStage || 'Vegetative',
    soilType: selectedField?.soilType || 'Black',
    district: selectedField?.district || 'Nagpur',
    area: selectedField?.area ?? 2.5
  });
  const [sowingDate, setSowingDate] = useState('');
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState('');

  useEffect(() => {
    if (!selectedField) return;
    setFormData(prev => ({ ...prev, fieldId: selectedField.id, fieldName: selectedField.name, cropType: selectedField.cropType || selectedField.crop || 'Cotton', soilType: selectedField.soilType || 'Black', growthStage: selectedField.growthStage || 'Vegetative', soilMoisture: selectedField.soilMoisture ?? prev.soilMoisture, pH: selectedField.pH ?? prev.pH, nitrogen: selectedField.nitrogen ?? prev.nitrogen, phosphorus: selectedField.phosphorus ?? prev.phosphorus, potassium: selectedField.potassium ?? prev.potassium, district: selectedField.district || prev.district, soilMoistureVolume: selectedField.soilMoistureVolume ?? prev.soilMoistureVolume, area: selectedField.area ?? prev.area }));
  }, [selectedField]);

  const handleFieldChange = (fieldId) => {
    const f = fields.find(item => String(item.id) === String(fieldId));
    if (f) {
      setFormData({
        fieldId: f.id,
        fieldName: f.name,
        soilMoisture: f.soilMoisture,
        soilMoistureVolume: f.soilMoistureVolume ?? 1059,
        district: f.district || 'Nagpur',
        pH: f.pH ?? 7.1,
        nitrogen: f.nitrogen,
        phosphorus: f.phosphorus,
        potassium: f.potassium,
        temperature: f.temperature,
        humidity: f.humidity,
        rainfall: f.rainfall,
        cropType: f.cropType || f.crop,
        growthStage: f.growthStage,
        soilType: f.soilType,
        area: f.area
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' || e.target.type === 'range' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAdvisoryError('');

    // Run the existing ML analysis and the weather advisory together.
    const [mlOutcome, advisoryOutcome] = await Promise.allSettled([
      handleAnalyzeField(formData),
      apiService.getIrrigationAdvisory({ ...formData, sowingDate })
    ]);

    // Preserve advisory data while navigating to Recommendations.
    if (advisoryOutcome.status === 'fulfilled') {
      sessionStorage.setItem(
        'agrisense_irrigation_advisory',
        JSON.stringify(advisoryOutcome.value)
      );
      sessionStorage.removeItem('agrisense_irrigation_advisory_error');
    } else {
      sessionStorage.removeItem('agrisense_irrigation_advisory');
      sessionStorage.setItem(
        'agrisense_irrigation_advisory_error',
        advisoryOutcome.reason?.message || 'Weather advisory failed.'
      );
    }

    if (mlOutcome.status === 'rejected') {
      const message = mlOutcome.reason?.message || 'ML analysis failed.';
      sessionStorage.setItem('agrisense_ml_analysis_error', message);
    } else {
      sessionStorage.removeItem('agrisense_ml_analysis_error');
    }

    // Navigate if at least one result is available; the Recommendations page
    // can show whichever result succeeded and any corresponding error.
    if (mlOutcome.status === 'fulfilled' || advisoryOutcome.status === 'fulfilled') {
      navigate('/recommendations');
    } else {
      setAdvisoryError('Both ML analysis and weather advisory failed. Please check the backend and try again.');
    }
  };

  const handleGetIrrigationAdvisory = async () => {
    setAdvisoryLoading(true);
    setAdvisoryError('');
    try {
      const result = await apiService.getIrrigationAdvisory({ ...formData, sowingDate });
      sessionStorage.setItem('agrisense_irrigation_advisory', JSON.stringify(result));
      sessionStorage.removeItem('agrisense_irrigation_advisory_error');
      navigate('/recommendations');
    } catch (err) {
      const message = err.message || 'Unable to load irrigation advisory.';
      sessionStorage.setItem('agrisense_irrigation_advisory_error', message);
      setAdvisoryError(message);
    } finally {
      setAdvisoryLoading(false);
    }
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Soil & Environmental Analysis"
        subtitle="Input live field telemetry and soil lab parameters to generate fertilizer-category and irrigation-need predictions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Data Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-agri-700" />
                <h2 className="text-lg font-bold text-slate-900">Enter Field Conditions</h2>
              </div>

              {/* Pre-fill from Field Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Load Preset:</span>
                <select
                  value={formData.fieldId}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:ring-agri-500 text-slate-800"
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.crop})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Soil Hydration & Nutrients Sliders */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Soil Metrics & Nutrient Telemetry
              </h3>

              {/* Soil Moisture Slider */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" /> Soil Moisture (%)
                  </label>
                  <span className="font-black text-slate-900 text-sm">{formData.soilMoisture}%</span>
                </div>
                <input
                  type="range"
                  name="soilMoisture"
                  min="10"
                  max="90"
                  value={formData.soilMoisture}
                  onChange={handleChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-agri-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Dry (10%)</span>
                  <span>Optimal (50%)</span>
                  <span>Saturated (90%)</span>
                </div>
              </div>

              {/* Nitrogen (N) Slider */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" /> Nitrogen — N (mg/kg)
                  </label>
                  <span className="font-black text-slate-900 text-sm">{formData.nitrogen} mg/kg</span>
                </div>
                <input
                  type="range"
                  name="nitrogen"
                  min="10"
                  max="120"
                  value={formData.nitrogen}
                  onChange={handleChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Phosphorus & Potassium Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">Phosphorus — P (mg/kg)</label>
                    <span className="font-black text-slate-900">{formData.phosphorus} mg/kg</span>
                  </div>
                  <input
                    type="range"
                    name="phosphorus"
                    min="5"
                    max="80"
                    value={formData.phosphorus}
                    onChange={handleChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>

                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">Potassium — K (mg/kg)</label>
                    <span className="font-black text-slate-900">{formData.potassium} mg/kg</span>
                  </div>
                  <input
                    type="range"
                    name="potassium"
                    min="10"
                    max="100"
                    value={formData.potassium}
                    onChange={handleChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-earth-600"
                  />
                </div>
              </div>
            </div>

            {/* Environmental & Crop Parameters */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Weather & Crop Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Humidity (%)
                  </label>
                  <input
                    type="number"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Rainfall (mm)
                  </label>
                  <input
                    type="number"
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Soil pH</label>
                  <input
                    type="number"
                    name="pH"
                    min="0"
                    max="14"
                    step="0.1"
                    value={formData.pH}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district || 'Nagpur'}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crop Type</label>
                  <select
                    name="cropType"
                    value={formData.cropType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  >
                    <option value="Cotton">Cotton</option>
                    <option value="Soybean">Soybean</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Growth Stage</label>
                  <select
                    name="growthStage"
                    value={formData.growthStage}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Maturity">Maturity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Soil Type</label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                  >
                    <option value="Black">Black</option>
                    <option value="Red">Red</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Laterite">Laterite</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Sowing Date (optional)</label>
                <input
                  type="date"
                  name="sowingDate"
                  value={sowingDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full sm:w-1/2 px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
                />
                <p className="mt-1 text-[11px] text-slate-500">If provided, the advisory estimates crop stage from this date; otherwise it uses your selected growth stage.</p>
              </div>
            </div>

            {/* Existing ML analysis and separate weather-based advisory */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button type="button" variant="outline" size="lg" icon={Droplets} isLoading={advisoryLoading} onClick={handleGetIrrigationAdvisory} className="w-full sm:w-auto">
                Get Irrigation Advisory
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={Sparkles}
                isLoading={isAnalyzing}
                className="w-full sm:w-auto shadow-md shadow-agri-700/30"
              >
                Run Combined Analysis
              </Button>
            </div>
          </form>

          {advisoryError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <strong className="block mb-1">Could not load irrigation advisory</strong>
              {advisoryError}
            </div>
          )}
        </div>

        {/* Right 1 Column: Live Visual Health Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-agri-600" /> Live Soil Nutrient Status
            </h3>

            <div className="space-y-4">
              <NutrientCard
                name="Nitrogen (N)"
                value={formData.nitrogen}
                targetMin={60}
                targetMax={80}
              />
              <NutrientCard
                name="Phosphorus (P)"
                value={formData.phosphorus}
                targetMin={30}
                targetMax={50}
              />
              <NutrientCard
                name="Potassium (K)"
                value={formData.potassium}
                targetMin={40}
                targetMax={70}
              />
              <NutrientCard
                name="Soil Moisture"
                value={formData.soilMoisture}
                targetMin={45}
                targetMax={65}
                unit="%"
              />
            </div>
          </div>

          <div className="bg-agri-900 text-white rounded-2xl p-5 shadow-soft border border-agri-800 space-y-3">
            <div className="flex items-center gap-2 text-agri-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-agri-400" /> Backend API Contract Ready
            </div>
            <p className="text-xs text-agri-100 leading-relaxed">
              Submitting this form sends a request to the connected Flask ML backend: <code className="bg-agri-950 px-1.5 py-0.5 rounded text-agri-300 font-mono">POST /api/analyze</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};