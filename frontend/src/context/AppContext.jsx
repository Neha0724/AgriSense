import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('agrisense_user') || 'null'); } catch { return null; } });
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

  // Initial load
  useEffect(() => {
    if (!localStorage.getItem('agrisense_token')) { setFields([]); setHistory([]); setActiveRecommendation(null); setLoading(false); return; }
    const initData = async () => {
      try {
        setLoading(true);
        const [userData, fieldsData, weatherData, charts, recommendation, historyData, settingsData] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getFields(),
          apiService.getWeather(),
          apiService.getChartsData(),
          apiService.getRecommendations(),
          apiService.getHistory(),
          apiService.getSettings()
        ]);

        setUser(userData);
        localStorage.setItem('agrisense_user', JSON.stringify(userData));
        setFields(fieldsData);
        if (fieldsData.length > 0) {
          setSelectedField(fieldsData[0]);
        }
        setWeather(weatherData);
        setChartsData(charts);
        setActiveRecommendation(recommendation);
        setHistory(historyData);
        setSettings(settingsData);
      } catch (err) {
        console.error('Failed to load initial AgriSense data', err);
        addToast(err?.message || 'Could not load farm data. Check backend and MongoDB connection.', 'error');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

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
      addToast(err?.message || 'Failed to add field.', 'error');
      throw err;
    }
  };

  // Action: Run field analysis
  const handleAnalyzeField = async (inputData) => {
    try {
      setIsAnalyzing(true);
      const result = await apiService.analyzeField(inputData);
      setActiveRecommendation(result);
      setHistory(await apiService.getHistory());
      addToast('AI analysis completed and saved to your history!' , 'success', 'Analysis Complete');
      return result;
    } catch (err) {
      console.error(err);
      addToast(err?.message || 'Failed to complete AI analysis.', 'error');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Action: Save active recommendation to history
  const handleSaveRecommendation = async () => {
    try {
      setHistory(await apiService.getHistory());
      addToast('This analysis is already saved in MongoDB history.', 'success', 'Saved');
    } catch (err) {
      addToast(err?.message || 'Could not refresh analysis history.', 'error');
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
      addToast('Failed to update settings.', 'error');
    }
  };

  const value = {
    user,
    setUser,
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
