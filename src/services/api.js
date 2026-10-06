/**
 * AgriSense API Service Layer
 *
 * Talks to the Flask backend in /backend. Every page gets its data through
 * this file (via AppContext), so the components don't need to know about HTTP.
 *
 * Base URL:
 *   - Development: "/api" is proxied to http://localhost:5000 by vite.config.js
 *   - Production:  set VITE_API_URL (e.g. https://agrisense-api.onrender.com/api)
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkError) {
    throw new Error('Cannot reach the AgriSense server. Is the backend running?');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const details = data?.details
      ? ' ' + Object.entries(data.details).map(([k, v]) => `${k} ${v}`).join('; ')
      : '';
    const error = new Error((data?.error || `Request failed (${response.status})`) + details);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }
  return data;
}

export const apiService = {
  /** GET /api/fields */
  getFields() {
    return request('/fields');
  },

  /** POST /api/fields */
  addField(newField) {
    return request('/fields', { method: 'POST', body: newField });
  },

  /** GET /api/weather?fieldId=... (live Open-Meteo data, or sample data as fallback) */
  getWeather(fieldId) {
    return request(fieldId ? `/weather?fieldId=${fieldId}` : '/weather');
  },

  /**
   * POST /api/analyze
   * Payload: { fieldId, fieldName, soilMoisture, nitrogen, phosphorus, potassium,
   *            temperature, humidity, rainfall, cropType, growthStage }
   */
  analyzeField(inputData) {
    return request('/analyze', { method: 'POST', body: inputData });
  },

  /** GET /api/recommendations/active (returns null if no analysis has been run yet) */
  async getRecommendations(fieldId) {
    try {
      return await request(fieldId ? `/recommendations/active?fieldId=${fieldId}` : '/recommendations/active');
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },

  /** GET /api/history */
  getHistory() {
    return request('/history');
  },

  /** POST /api/history */
  saveRecommendation(recommendation) {
    return request('/history', { method: 'POST', body: recommendation });
  },

  /** GET /api/analytics?fieldId=... */
  getChartsData(fieldId) {
    return request(fieldId ? `/analytics?fieldId=${fieldId}` : '/analytics');
  },

  /** GET /api/settings */
  getSettings() {
    return request('/settings');
  },

  /** PUT /api/settings */
  updateSettings(newSettings) {
    return request('/settings', { method: 'PUT', body: newSettings });
  }
};
