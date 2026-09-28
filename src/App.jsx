import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyFieldsPage } from './pages/MyFieldsPage';
import { SoilAnalysisPage } from './pages/SoilAnalysisPage';
import { WeatherPage } from './pages/WeatherPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* App Dashboard Routes wrapped in MainLayout */}
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />
          <Route
            path="/fields"
            element={
              <MainLayout>
                <MyFieldsPage />
              </MainLayout>
            }
          />
          <Route
            path="/soil-analysis"
            element={
              <MainLayout>
                <SoilAnalysisPage />
              </MainLayout>
            }
          />
          <Route
            path="/weather"
            element={
              <MainLayout>
                <WeatherPage />
              </MainLayout>
            }
          />
          <Route
            path="/recommendations"
            element={
              <MainLayout>
                <RecommendationsPage />
              </MainLayout>
            }
          />
          <Route
            path="/history"
            element={
              <MainLayout>
                <HistoryPage />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            }
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
