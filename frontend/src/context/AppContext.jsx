
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { apiService } from '../services/api';

const AppContext = createContext();

/**
 * Normalize model importance values without inventing any values.
 * Supports the backend response format:
 * { feature, importance, importance_percent }
 */
const normalizeFeatureImportance = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const feature = item?.feature || item?.factor || item?.name;

      const importance =
        item?.importance ??
        item?.weight ??
        (item?.importance_percent != null
          ? Number(item.importance_percent) / 100
          : null);

      if (
        !feature ||
        importance == null ||
        !Number.isFinite(Number(importance)) ||
        Number(importance) < 0
      ) {
        return null;
      }

      return {
        ...item,
        feature,
        importance: Number(importance),
        importance_percent:
          item?.importance_percent != null
            ? Number(item.importance_percent)
            : Number(importance) * 100,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.importance - a.importance);
};

/**
 * Keep the complete API response and normalize the fields used
 * by RecommendationsPage. Does not generate fake explanations.
 */
const normalizeRecommendation = (result) => {
  if (!result || typeof result !== 'object') return result;

  const normalized = { ...result };

  for (const task of ['irrigation', 'fertilizer']) {
    const modelResult = result[task];

    if (!modelResult || typeof modelResult !== 'object') continue;

    normalized[task] = {
      ...modelResult,
      feature_importance: normalizeFeatureImportance(
        modelResult.feature_importance
      ),
    };
  }

  // Support responses that provide factorWeights directly.
  if (Array.isArray(result.factorWeights)) {
    normalized.factorWeights = normalizeFeatureImportance(
      result.factorWeights
    ).map((item) => ({
      ...item,
      factor: item.factor || item.feature,
      weight: item.weight ?? item.importance,
    }));
  }

  return normalized;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('agrisense_user') || 'null'
      );
    } catch {
      return null;
    }
  });

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

  const addToast = (message, type = 'info', title = '') => {
    const id = Date.now();

    setToasts((prev) => [
      ...prev,
      { id, message, type, title },
    ]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Load saved application data.
  useEffect(() => {
    if (!localStorage.getItem('agrisense_token')) {
      setFields([]);
      setHistory([]);
      setActiveRecommendation(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const initData = async () => {
      try {
        setLoading(true);

        const [
          userData,
          fieldsData,
          weatherData,
          charts,
          recommendation,
          historyData,
          settingsData,
        ] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getFields(),
          apiService.getWeather(),
          apiService.getChartsData(),
          apiService.getRecommendations(),
          apiService.getHistory(),
          apiService.getSettings(),
        ]);

        if (cancelled) return;

        setUser(userData);
        localStorage.setItem(
          'agrisense_user',
          JSON.stringify(userData)
        );

        setFields(fieldsData);

        if (fieldsData.length > 0) {
          setSelectedField(fieldsData[0]);
        }

        setWeather(weatherData);
        setChartsData(charts);

        setActiveRecommendation(
          normalizeRecommendation(recommendation)
        );

        setHistory(historyData);
        setSettings(settingsData);
      } catch (err) {
        if (cancelled) return;

        console.error(
          'Failed to load initial AgriSense data:',
          err
        );

        addToast(
          err?.message ||
            'Could not load farm data. Check backend and MongoDB connection.',
          'error'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Add a new field.
  const handleAddField = async (fieldFormData) => {
    try {
      const created = await apiService.addField(fieldFormData);

      setFields((prev) => [created, ...prev]);
      setSelectedField(created);

      addToast(
        `Field "${created.name}" successfully registered.`,
        'success',
        'Field Added'
      );

      return created;
    } catch (err) {
      console.error('Failed to add field:', err);

      addToast(
        err?.message || 'Failed to add field.',
        'error'
      );

      throw err;
    }
  };

  // Run combined field analysis.
  const handleAnalyzeField = async (inputData) => {
    try {
      setIsAnalyzing(true);

      const result = await apiService.analyzeField(inputData);

      const normalizedResult = normalizeRecommendation(result);

      setActiveRecommendation(normalizedResult);

      const updatedHistory = await apiService.getHistory();
      setHistory(updatedHistory);

      addToast(
        'Field analysis completed successfully.',
        'success',
        'Analysis Complete'
      );

      return normalizedResult;
    } catch (err) {
      console.error('Field analysis failed:', err);

      addToast(
        err?.message || 'Failed to complete field analysis.',
        'error'
      );

      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Refresh saved recommendation history.
  const handleSaveRecommendation = async () => {
    try {
      const updatedHistory = await apiService.getHistory();

      setHistory(updatedHistory);

      addToast(
        'Analysis history refreshed successfully.',
        'success',
        'Saved'
      );
    } catch (err) {
      console.error('Failed to refresh history:', err);

      addToast(
        err?.message || 'Could not refresh analysis history.',
        'error'
      );
    }
  };

  // Update application settings.
  const handleUpdateSettings = async (newSettings) => {
    try {
      const updated = await apiService.updateSettings(newSettings);

      setSettings(updated);

      addToast(
        'Farm preferences saved.',
        'success'
      );
    } catch (err) {
      console.error('Failed to update settings:', err);

      addToast(
        err?.message || 'Failed to update settings.',
        'error'
      );
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
    handleUpdateSettings,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};