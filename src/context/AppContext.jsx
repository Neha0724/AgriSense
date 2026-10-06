import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [weather, setWeather] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [activeRecommendation, setActiveRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Add toast notification helper
  const addToast = (message, type = 'info', title = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initial load: fields first, then everything else for the first field
  const initialFieldId = useRef(null);
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const fieldsData = await apiService.getFields();
        const firstField = fieldsData[0] || null;
        initialFieldId.current = firstField?.id ?? null;

        const [weatherData, charts, recommendation, historyData, settingsData] = await Promise.all([
          apiService.getWeather(firstField?.id),
          apiService.getChartsData(firstField?.id),
          apiService.getRecommendations(),
          apiService.getHistory(),
          apiService.getSettings()
        ]);

        setFields(fieldsData);
        setSelectedField(firstField);
        setWeather(weatherData);
        setChartsData(charts);
        setActiveRecommendation(recommendation);
        setHistory(historyData);
        setSettings(settingsData);
      } catch (err) {
        console.error('Failed to load initial AgriSense data', err);
        addToast(err.message || 'Could not load farm data.', 'error', 'Server unavailable');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Reload weather and charts when the user switches fields
  const selectedFieldId = selectedField?.id;
  useEffect(() => {
    if (selectedFieldId == null || selectedFieldId === initialFieldId.current) return;
    initialFieldId.current = null; // only skip the very first (already loaded) field
    Promise.all([apiService.getWeather(selectedFieldId), apiService.getChartsData(selectedFieldId)])
      .then(([weatherData, charts]) => {
        setWeather(weatherData);
        setChartsData(charts);
      })
      .catch(err => console.error('Failed to refresh field data', err));
  }, [selectedFieldId]);

  // Action: Add new field
  const handleAddField = async (fieldFormData) => {
    try {
      const created = await apiService.addField(fieldFormData);
      setFields(prev => [created, ...prev]);
      setSelectedField(created);
      addToast(`Field "${created.name}" successfully registered.`, 'success', 'Field Added');
      return created;
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to add field. Please try again.', 'error');
      throw err;
    }
  };

  // Action: Run field analysis
  const handleAnalyzeField = async (inputData) => {
    try {
      setIsAnalyzing(true);
      const result = await apiService.analyzeField(inputData);
      setActiveRecommendation(result);

      // The backend updates the field's readings and trend data; pull them in
      const [fieldsData, charts] = await Promise.all([
        apiService.getFields(),
        apiService.getChartsData(result.fieldId)
      ]);
      setFields(fieldsData);
      setSelectedField(prev => fieldsData.find(f => f.id === prev?.id) || prev);
      setChartsData(charts);
      addToast('AI analysis completed successfully!', 'success', 'Analysis Complete');
      return result;
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to complete AI analysis.', 'error');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Action: Save active recommendation to history
  const handleSaveRecommendation = async () => {
    if (!activeRecommendation) return;
    try {
      const savedEntry = await apiService.saveRecommendation(activeRecommendation);
      setHistory(prev => [savedEntry, ...prev]);
      addToast(`Recommendation saved for ${savedEntry.field}.`, 'success', 'Saved');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to save recommendation.', 'error');
    }
  };

  // Action: Update settings
  const handleUpdateSettings = async (newSettings) => {
    try {
      const updated = await apiService.updateSettings(newSettings);
      setSettings(updated);
      addToast('Farm preferences saved.', 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to update settings.', 'error');
    }
  };

  const value = {
    fields,
    selectedField,
    setSelectedField,
    weather,
    chartsData,
    activeRecommendation,
    history,
    settings,
    loading,
    isAnalyzing,
    toasts,
    addToast,
    removeToast,
    handleAddField,
    handleAnalyzeField,
    handleSaveRecommendation,
    handleUpdateSettings
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
