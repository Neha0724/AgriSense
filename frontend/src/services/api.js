function mapAnalysis(doc) {
  const inputs = doc.inputs || {}; const fert = doc.fertilizer || {}; const irr = doc.irrigation || {};
  const probPercent = (obj={}) => Math.round(Math.max(0,...Object.values(obj).map(Number))*100);
  const irrLabel = String(irr.prediction || '').toLowerCase();
  return { id: doc.id, fieldId: doc.field_id, fieldName: doc.field_name, cropType: inputs.cropType || inputs.Crop || inputs.Crop_Type, growthStage: inputs.growthStage || inputs.Crop_Stage, generatedAt: doc.created_at, soilMoisture: inputs.soilMoisture ?? inputs.soil_moisture_pct, nitrogen: inputs.nitrogen ?? inputs.N, phosphorus: inputs.phosphorus ?? inputs.P, potassium: inputs.potassium ?? inputs.K, modelBased: true, modelDisclaimer: 'Prototype prediction based on the supplied dataset; not a validated agronomic prescription.', irrigation: { prediction: irr.prediction, status: `${irrLabel.charAt(0).toUpperCase()+irrLabel.slice(1)} Irrigation Need`, amount: 'Not predicted by this model', timing: 'Not predicted by this model', confidence: probPercent(irr.class_probabilities), urgency: irrLabel, modelName: irr.model_name, modelBased: irr.model_based, probabilities: irr.class_probabilities || {}, reasons: [`ML model: ${irr.model_name}`, `Predicted irrigation need: ${irr.prediction}`] }, fertilizer: { recommendation: fert.prediction, modelName: fert.model_name, modelBased: fert.model_based, probabilities: fert.class_probabilities || {}, confidence: probPercent(fert.class_probabilities), unit: 'Not predicted by this model', timing: 'Follow soil-test results and local agricultural guidance.', reasons: [`ML model: ${fert.model_name}`, `Predicted fertilizer category: ${fert.prediction}`] }, factorWeights: [] };
}
function mapHistory(doc) { const r = doc.fertilizer || {}; const i = doc.irrigation || {}; return { id: doc.id, date: (doc.created_at || '').slice(0,10), time: (doc.created_at || '').slice(11,16), field: doc.field_name || 'Field', crop: (doc.inputs || {}).cropType || (doc.inputs || {}).Crop || '—', soilMoisture: (doc.inputs || {}).soilMoisture ?? (doc.inputs || {}).soil_moisture_pct ?? '—', irrigation: i.prediction || '—', fertilizer: r.prediction || '—', confidence: `${Math.round(Math.max(0,...Object.values(i.class_probabilities || {}).map(Number))*100)}%`, status: i.prediction || '—', statusType: String(i.prediction).toLowerCase()==='high'?'alert':'success', fertilizerProbabilities: r.class_probabilities || {}, irrigationProbabilities: i.class_probabilities || {} }; }

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('agrisense_token');
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

import {
  MOCK_FIELDS,
  MOCK_WEATHER,
  MOCK_CHARTS_DATA,
  MOCK_RECOMMENDATION_ACTIVE,
  MOCK_HISTORY,
  MOCK_SETTINGS
} from '../data/mockData';


const SIMULATED_DELAY = 600;

export const apiService = {
    async getCurrentUser() { const data = await apiRequest('/api/auth/me'); return data.user || data; },

    async getFields() { return (await apiRequest('/api/fields')).map(f => ({ ...f, crop: f.crop || f.cropType, cropType: f.cropType || f.crop, soilType: String(f.soilType || '').replace(/^./, c => c.toUpperCase()) })); },

    async addField(newField) { const f = await apiRequest('/api/fields', { method: 'POST', body: JSON.stringify(newField) }); return { ...f, crop: f.crop || f.cropType, cropType: f.cropType || f.crop, soilType: String(f.soilType || '').replace(/^./, c => c.toUpperCase()) }; },

    async getWeather() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    return MOCK_WEATHER;
  },

    async analyzeField(inputData) {
    const crop = String(inputData.cropType || '').toLowerCase().trim();
    const soil = String(inputData.soilType || '').toLowerCase().replace(/\s+soil$/i, '').trim();
    const stage = String(inputData.growthStage || '').toLowerCase().trim();
    if (!['cotton','soybean'].includes(crop)) throw new Error('ML model currently supports Cotton and Soybean only.');
    if (!['black','red','alluvial','laterite'].includes(soil)) throw new Error('ML model supports Black, Red, Alluvial, and Laterite soil only.');
    const payload = { fieldId: String(inputData.fieldId || ''), fieldName: inputData.fieldName || 'Selected Field', inputs: { ...inputData, Soil_Type: soil, Crop: crop, Crop_Stage: stage, pH: Number(inputData.pH ?? 6.5), N: Number(inputData.nitrogen), P: Number(inputData.phosphorus), K: Number(inputData.potassium), soil_moisture_pct: Number(inputData.soilMoisture), soil_moisture_volume: Number(inputData.soilMoistureVolume ?? 1059.165), district: inputData.district || 'Nagpur' } };
    const saved = await apiRequest('/api/analyze', { method: 'POST', body: JSON.stringify(payload) });
    const result = mapAnalysis(saved);
    localStorage.setItem('agrisense_active_recommendation', JSON.stringify(result));
    return result;
  },

    async getRecommendations() { const rows = await apiRequest('/api/analyses?limit=1'); const result = rows.length ? mapAnalysis(rows[0]) : null; if (result) localStorage.setItem('agrisense_active_recommendation', JSON.stringify(result)); return result; },

    async getHistory() { return (await apiRequest('/api/analyses?limit=200')).map(mapHistory); },

    async saveRecommendation(recommendation) { return mapHistory(recommendation); },

    async getChartsData() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    return MOCK_CHARTS_DATA;
  },

    async getSettings() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const stored = localStorage.getItem('agrisense_settings');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return MOCK_SETTINGS;
  },

  async updateSettings(newSettings) {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    localStorage.setItem('agrisense_settings', JSON.stringify(newSettings));
    return newSettings;
  }
};
