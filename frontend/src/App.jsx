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
import { AuthPage } from './pages/AuthPage';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();
  return localStorage.getItem('agrisense_token') ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}


export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />

          {/* App Dashboard Routes wrapped in MainLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute><MainLayout>
                <DashboardPage />
              </MainLayout></ProtectedRoute>
            }
          />
          <Route
            path="/fields"
            element={
              <ProtectedRoute><MainLayout>
                <MyFieldsPage />
              </MainLayout></ProtectedRoute>
            }
          />
          <Route
            path="/soil-analysis"
            element={
              <ProtectedRoute><MainLayout>
                <SoilAnalysisPage />
              </MainLayout></ProtectedRoute>
            }
          />
          <Route
            path="/weather"
            element={
              <ProtectedRoute><MainLayout>
                <WeatherPage />
              </MainLayout></ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute><MainLayout>
                <RecommendationsPage />
              </MainLayout></ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute><MainLayout>
                <HistoryPage />
              </MainLayout></ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute><MainLayout>
                <SettingsPage />
              </MainLayout></ProtectedRoute>
            }
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
