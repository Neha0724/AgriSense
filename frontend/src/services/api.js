
import {
  MOCK_WEATHER,
  MOCK_CHARTS_DATA,
  MOCK_SETTINGS,
} from '../data/mockData';

function mapFeatureImportance(items = [], task = 'Overall') {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const feature =
        item.feature ||
        item.factor ||
        item.name;

      let importance =
        item.importance ??
        item.weight ??
        item.importance_score;

      let importancePercent =
        item.importance_percent ??
        item.percentage ??
        item.importancePercentage;

      if (
        importance == null &&
        importancePercent != null
      ) {
        importance = Number(importancePercent) / 100;
      }

      if (
        importance == null ||
        !Number.isFinite(Number(importance))
      ) {
        return null;
      }

      importance = Number(importance);

      if (importancePercent == null) {
        importancePercent =
          importance <= 1 ? importance * 100 : importance;
      }

      return {
        ...item,
        feature: feature || 'Unknown feature',
        factor: feature || 'Unknown feature',
        importance,
        weight: importance,
        importance_percent: Number(importancePercent),
        task,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.importance - a.importance);
}

function getModelFeatureImportance(modelResult, task) {
  if (!modelResult || typeof modelResult !== 'object') {
    return [];
  }

  const candidates =
    modelResult.feature_importance ??
    modelResult.feature_importances ??
    modelResult.explainability?.feature_importance ??
    modelResult.explainability?.features ??
    [];

  return mapFeatureImportance(candidates, task);
}

function getProbabilityPercent(probabilities = {}) {
  const values = Object.values(probabilities)
    .map(Number)
    .filter(Number.isFinite);

  if (!values.length) return 0;

  return Math.round(Math.max(0, ...values) * 100);
}

function mapAnalysis(doc) {
  const inputs = doc.inputs || {};
  const fert = doc.fertilizer || {};
  const irr = doc.irrigation || {};

  const irrigationImportance = getModelFeatureImportance(
    irr,
    'Irrigation'
  );

  const fertilizerImportance = getModelFeatureImportance(
    fert,
    'Fertilizer'
  );

  const factorWeights = [
    ...irrigationImportance,
    ...fertilizerImportance,
  ].sort((a, b) => b.importance - a.importance);

  const irrLabel = String(irr.prediction || '').toLowerCase();

  return {
    id: doc.id,
    fieldId: doc.field_id,
    fieldName: doc.field_name,

    cropType:
      inputs.cropType ||
      inputs.Crop ||
      inputs.Crop_Type,

    growthStage:
      inputs.growthStage ||
      inputs.Crop_Stage,

    generatedAt: doc.created_at,

    soilMoisture:
      inputs.soilMoisture ??
      inputs.soil_moisture_pct,

    nitrogen: inputs.nitrogen ?? inputs.N,
    phosphorus: inputs.phosphorus ?? inputs.P,
    potassium: inputs.potassium ?? inputs.K,

    modelBased: true,

    modelDisclaimer:
      'Prototype prediction based on the supplied dataset; not a validated agronomic prescription.',

    irrigation: {
      prediction: irr.prediction,

      status: irrLabel
        ? `${irrLabel.charAt(0).toUpperCase()}${irrLabel.slice(1)} Irrigation Need`
        : 'Not available',

      amount: 'Not predicted by this model',
      timing: 'Not predicted by this model',

      confidence: getProbabilityPercent(
        irr.class_probabilities
      ),

      urgency: irrLabel,
      modelName: irr.model_name,
      modelBased: irr.model_based,

      probabilities: irr.class_probabilities || {},

      // Pass actual backend feature importance through to the UI.
      feature_importance: irrigationImportance,

      reasons: [
        irr.model_name
          ? `ML model: ${irr.model_name}`
          : 'ML model information unavailable',

        irr.prediction
          ? `Predicted irrigation need: ${irr.prediction}`
          : 'Irrigation prediction unavailable',
      ],
    },

    fertilizer: {
      recommendation: fert.prediction,
      modelName: fert.model_name,
      modelBased: fert.model_based,

      probabilities: fert.class_probabilities || {},

      confidence: getProbabilityPercent(
        fert.class_probabilities
      ),

      unit: 'Not predicted by this model',

      timing:
        'Follow soil-test results and local agricultural guidance.',

      // Pass actual backend feature importance through to the UI.
      feature_importance: fertilizerImportance,

      reasons: [
        fert.model_name
          ? `ML model: ${fert.model_name}`
          : 'ML model information unavailable',

        fert.prediction
          ? `Predicted fertilizer category: ${fert.prediction}`
          : 'Fertilizer prediction unavailable',
      ],
    },

    // The RecommendationsPage can read this combined array.
    factorWeights,
  };
}

function mapHistory(doc) {
  const fertilizer = doc.fertilizer || {};
  const irrigation = doc.irrigation || {};
  const inputs = doc.inputs || {};

  return {
    id: doc.id,
    date: (doc.created_at || '').slice(0, 10),
    time: (doc.created_at || '').slice(11, 16),
    field: doc.field_name || 'Field',

    crop:
      inputs.cropType ||
      inputs.Crop ||
      '—',

    soilMoisture:
      inputs.soilMoisture ??
      inputs.soil_moisture_pct ??
      '—',

    irrigation: irrigation.prediction || '—',
    fertilizer: fertilizer.prediction || '—',

    confidence: `${getProbabilityPercent(
      irrigation.class_probabilities
    )}%`,

    status: irrigation.prediction || '—',

    statusType:
      String(irrigation.prediction || '').toLowerCase() === 'high'
        ? 'alert'
        : 'success',

    fertilizerProbabilities:
      fertilizer.class_probabilities || {},

    irrigationProbabilities:
      irrigation.class_probabilities || {},
  };
}

const API_BASE_URL = (
  import.meta.env.API_URL
).replace(/\/+$/, '');

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('agrisense_token');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,

    headers: {
      'Content-Type': 'application/json',

      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),

      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

const SIMULATED_DELAY = 600;

export const apiService = {
  async getCurrentUser() {
    const data = await apiRequest('/api/auth/me');
    return data.user || data;
  },

  async getFields() {
    return (await apiRequest('/api/fields')).map((field) => ({
      ...field,
      crop: field.crop || field.cropType,
      cropType: field.cropType || field.crop,

      soilType: String(field.soilType || '').replace(
        /^./,
        (character) => character.toUpperCase()
      ),
    }));
  },

  async addField(newField) {
    const field = await apiRequest('/api/fields', {
      method: 'POST',
      body: JSON.stringify(newField),
    });

    return {
      ...field,
      crop: field.crop || field.cropType,
      cropType: field.cropType || field.crop,

      soilType: String(field.soilType || '').replace(
        /^./,
        (character) => character.toUpperCase()
      ),
    };
  },

  async getWeather() {
    await new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_DELAY)
    );

    return MOCK_WEATHER;
  },

  async analyzeField(inputData) {
    const crop = String(inputData.cropType || '')
      .toLowerCase()
      .trim();

    const soil = String(inputData.soilType || '')
      .toLowerCase()
      .replace(/\s+soil$/i, '')
      .trim();

    const stage = String(inputData.growthStage || '')
      .toLowerCase()
      .trim();

    if (!['cotton', 'soybean'].includes(crop)) {
      throw new Error(
        'ML model currently supports Cotton and Soybean only.'
      );
    }

    if (!['black', 'red', 'alluvial', 'laterite'].includes(soil)) {
      throw new Error(
        'ML model supports Black, Red, Alluvial, and Laterite soil only.'
      );
    }

    const payload = {
      fieldId: String(inputData.fieldId || ''),
      fieldName: inputData.fieldName || 'Selected Field',

      inputs: {
        ...inputData,

        Soil_Type: soil,
        Crop: crop,
        Crop_Stage: stage,

        pH: Number(inputData.pH ?? 6.5),
        N: Number(inputData.nitrogen),
        P: Number(inputData.phosphorus),
        K: Number(inputData.potassium),

        soil_moisture_pct: Number(inputData.soilMoisture),

        soil_moisture_volume: Number(
          inputData.soilMoistureVolume ?? 1059.165
        ),

        district: inputData.district || 'Nagpur',
      },
    };

    const saved = await apiRequest('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Map the returned backend document, including importance fields.
    const result = mapAnalysis(saved);

    localStorage.setItem(
      'agrisense_active_recommendation',
      JSON.stringify(result)
    );

    return result;
  },

  async getIrrigationAdvisory(inputData) {
    const crop = String(inputData.cropType || '').trim();

    const soil = String(inputData.soilType || '')
      .replace(/\s+soil$/i, '')
      .trim()
      .toLowerCase();

    const location = String(
      inputData.district || 'Nagpur'
    ).trim();

    if (!['Cotton', 'Soybean'].includes(crop)) {
      throw new Error(
        'Choose Cotton or Soybean for the irrigation advisory.'
      );
    }

    const allowedSoils = [
      'black',
      'red',
      'alluvial',
      'laterite',
    ];

    if (!allowedSoils.includes(soil)) {
      throw new Error(
        'Choose Black, Red, Alluvial, or Laterite soil.'
      );
    }

    if (!location) {
      throw new Error('Enter a district or location.');
    }

    const advisoryPayload = {
      crop,
      location,
      soil_type: soil,

      farmer_soil_moisture_pct: Number(
        inputData.soilMoisture
      ),

      ...(inputData.sowingDate
        ? { sowing_date: inputData.sowingDate }
        : {
            current_stage:
              inputData.growthStage || undefined,
          }),
    };

    return apiRequest('/api/irrigation/advisory', {
      method: 'POST',
      body: JSON.stringify(advisoryPayload),
    });
  },

  async getRecommendations() {
    const rows = await apiRequest('/api/analyses?limit=1');

    const result = rows.length
      ? mapAnalysis(rows[0])
      : null;

    if (result) {
      localStorage.setItem(
        'agrisense_active_recommendation',
        JSON.stringify(result)
      );
    }

    return result;
  },

  async getHistory() {
    return (
      await apiRequest('/api/analyses?limit=200')
    ).map(mapHistory);
  },

  async saveRecommendation(recommendation) {
    return mapHistory(recommendation);
  },

  async getChartsData() {
    await new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_DELAY)
    );

    return MOCK_CHARTS_DATA;
  },

  async getSettings() {
    await new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_DELAY)
    );

    const stored = localStorage.getItem('agrisense_settings');

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Could not read saved settings:', error);
      }
    }

    return MOCK_SETTINGS;
  },

  async updateSettings(newSettings) {
    await new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_DELAY)
    );

    localStorage.setItem(
      'agrisense_settings',
      JSON.stringify(newSettings)
    );

    return newSettings;
  },
};