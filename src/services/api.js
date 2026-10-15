import {
  MOCK_FIELDS,
  MOCK_WEATHER,
  MOCK_CHARTS_DATA,
  MOCK_RECOMMENDATION_ACTIVE,
  MOCK_HISTORY,
  MOCK_SETTINGS
} from '../data/mockData';

/**
 * AgriSense API Service Layer
 * 
 * FUTURE BACKEND INTEGRATION NOTE:
 * When connecting a real Python / Flask / FastAPI / Django backend:
 * 1. Replace simulated async delays with actual `fetch` or `axios` calls.
 * 2. Configure base URL env variable (e.g. `import.meta.env.VITE_API_URL`).
 * 3. The `analyzeField` endpoint matches the requested backend contract:
 *    POST /api/analyze
 */

const SIMULATED_DELAY = 600;

export const apiService = {
  /**
   * Fetch all registered fields for the user
   * Future API: GET /api/fields
   */
  async getFields() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const stored = localStorage.getItem('agrisense_fields');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return MOCK_FIELDS;
  },

  /**
   * Add a new field
   * Future API: POST /api/fields
   */
  async addField(newField) {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const current = await this.getFields();
    const created = {
      id: Date.now(),
      ...newField,
      healthStatus: 'Good',
      soilMoisture: newField.soilMoisture || 45,
      nitrogen: newField.nitrogen || 50,
      phosphorus: newField.phosphorus || 30,
      potassium: newField.potassium || 40,
      temperature: 28,
      humidity: 65,
      rainfall: 10,
      lastAnalyzed: 'Just now'
    };
    const updated = [created, ...current];
    localStorage.setItem('agrisense_fields', JSON.stringify(updated));
    return created;
  },

  /**
   * Fetch weather forecast & current conditions
   * Future API: GET /api/weather?fieldId=...
   */
  async getWeather() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    return MOCK_WEATHER;
  },

  /**
   * Run AI Analysis on field metrics
   * FUTURE BACKEND API CONTRACT:
   * Endpoint: POST /api/analyze
   * Request Payload:
   * {
   *   "fieldId": 1,
   *   "soilMoisture": 42,
   *   "nitrogen": 48,
   *   "phosphorus": 32,
   *   "potassium": 41,
   *   "temperature": 28,
   *   "humidity": 65,
   *   "rainfall": 12,
   *   "cropType": "Wheat",
   *   "growthStage": "Vegetative"
   * }
   */
  async analyzeField(inputData) {
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate AI computation delay

    const moisture = Number(inputData.soilMoisture);
    const n = Number(inputData.nitrogen);
    const p = Number(inputData.phosphorus);
    const k = Number(inputData.potassium);
    const rain = Number(inputData.rainfall);

    // Dynamic mock rule-based calculation engine
    let irrStatus = 'No Irrigation Needed';
    let irrAmount = '0 L/m²';
    let irrTiming = 'Not required';
    let irrConfidence = 94;
    let irrReasons = [];

    if (moisture < 35 || (moisture < 45 && rain < 10)) {
      irrStatus = 'Irrigate Today';
      irrAmount = '22–26 L/m²';
      irrTiming = 'Early morning (06:00 - 08:00 AM)';
      irrConfidence = 93;
      irrReasons.push(`Soil moisture (${moisture}%) is significantly below target range.`);
      irrReasons.push(`Expected rainfall (${rain} mm) is insufficient to meet crop evapotranspiration.`);
      irrReasons.push(`Crop in ${inputData.growthStage || 'Vegetative'} stage requires sustained root moisture.`);
    } else if (moisture < 48) {
      irrStatus = 'Irrigate Today';
      irrAmount = '18–22 L/m²';
      irrTiming = 'Early morning (06:00 - 08:00 AM)';
      irrConfidence = 91;
      irrReasons.push(`Soil moisture (${moisture}%) is moderate but declining.`);
      irrReasons.push(`Low rain forecast (${rain} mm) over next 24h.`);
      irrReasons.push(`Optimal timing prevents thermal stress during peak daytime temperature.`);
    } else {
      irrStatus = 'Optimal Moisture';
      irrAmount = '0 L/m²';
      irrTiming = 'Re-check in 24 hours';
      irrConfidence = 96;
      irrReasons.push(`Soil moisture (${moisture}%) is adequate for active growth.`);
      irrReasons.push(`Rainfall level (${rain} mm) supports current field capacity.`);
    }

    // Fertilizer calculation
    const targetN = 75;
    const targetP = 45;
    const targetK = 55;

    const nNeeded = Math.max(0, targetN - n);
    const pNeeded = Math.max(0, targetP - p);
    const kNeeded = Math.max(0, targetK - k);

    const result = {
      fieldId: inputData.fieldId || 1,
      fieldName: inputData.fieldName || 'Selected Field',
      cropType: inputData.cropType || 'Wheat',
      growthStage: inputData.growthStage || 'Vegetative',
      generatedAt: new Date().toLocaleString(),
      soilMoisture: moisture,
      nitrogen: n,
      phosphorus: p,
      potassium: k,
      temperature: inputData.temperature,
      humidity: inputData.humidity,
      rainfall: rain,
      irrigation: {
        status: irrStatus,
        amount: irrAmount,
        timing: irrTiming,
        confidence: irrConfidence,
        urgency: irrStatus === 'Irrigate Today' ? 'High' : 'Low',
        reasons: irrReasons
      },
      fertilizer: {
        nitrogen: nNeeded,
        phosphorus: pNeeded,
        potassium: kNeeded,
        confidence: 88,
        unit: 'kg/ha',
        timing: 'Apply within 48 hours',
        reasons: [
          nNeeded > 20 ? `Nitrogen deficit detected (${n} mg/kg). Supplement ${nNeeded} kg/ha.` : `Nitrogen (${n} mg/kg) is adequate.`,
          pNeeded > 10 ? `Phosphorus supplementation recommended (${pNeeded} kg/ha).` : `Phosphorus (${p} mg/kg) is healthy.`,
          kNeeded > 10 ? `Potassium boost of ${kNeeded} kg/ha recommended.` : `Potassium level (${k} mg/kg) is in range.`
        ]
      },
      factorWeights: [
        { factor: 'Soil Moisture', weight: '35%', impact: 'High', status: moisture < 45 ? 'Deficient' : 'Optimal' },
        { factor: 'Rainfall & Forecast', weight: '25%', impact: 'High', status: rain < 15 ? 'Low' : 'Sufficient' },
        { factor: 'Crop Growth Stage', weight: '20%', impact: 'Medium', status: inputData.growthStage || 'Vegetative' },
        { factor: 'NPK Nutrient Balance', weight: '20%', impact: 'Medium', status: nNeeded > 25 ? 'N-Deficient' : 'Balanced' }
      ]
    };

    // Save active recommendation into session/localStorage
    localStorage.setItem('agrisense_active_recommendation', JSON.stringify(result));
    return result;
  },

  /**
   * Get active AI recommendation
   * Future API: GET /api/recommendations/active?fieldId=...
   */
  async getRecommendations() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const stored = localStorage.getItem('agrisense_active_recommendation');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return MOCK_RECOMMENDATION_ACTIVE;
  },

  /**
   * Get recommendation history
   * Future API: GET /api/history
   */
  async getHistory() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const stored = localStorage.getItem('agrisense_history');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return MOCK_HISTORY;
  },

  /**
   * Save recommendation to history log
   * Future API: POST /api/history
   */
  async saveRecommendation(recommendation) {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const history = await this.getHistory();
    const newEntry = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      field: recommendation.fieldName || 'North Field',
      crop: recommendation.cropType || 'Wheat',
      soilMoisture: recommendation.soilMoisture || 42,
      irrigation: recommendation.irrigation?.amount || '18-22 L/m²',
      fertilizer: `N:${recommendation.fertilizer?.nitrogen}, P:${recommendation.fertilizer?.phosphorus}, K:${recommendation.fertilizer?.potassium} kg/ha`,
      confidence: `${recommendation.irrigation?.confidence || 90}%`,
      status: recommendation.irrigation?.status || 'Irrigate Today',
      statusType: recommendation.irrigation?.status === 'Irrigate Today' ? 'alert' : 'success'
    };

    const updated = [newEntry, ...history];
    localStorage.setItem('agrisense_history', JSON.stringify(updated));
    return newEntry;
  },

  /**
   * Chart trends data
   * Future API: GET /api/analytics
   */
  async getChartsData() {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    return MOCK_CHARTS_DATA;
  },

  /**
   * User Settings
   * Future API: GET /api/settings
   */
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
