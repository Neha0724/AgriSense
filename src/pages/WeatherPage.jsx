import React from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { WeatherCard } from '../components/ui/WeatherCard';
import { ChartCard } from '../components/ui/ChartCard';
import { CloudSun, Info, Droplets, Thermometer, Wind, ShieldAlert } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const WeatherPage = () => {
  const { weather, chartsData } = useApp();

  const hourlyData = weather?.hourly || [
    { time: '06:00', temp: 22, humidity: 80, rainProb: 10 },
    { time: '09:00', temp: 25, humidity: 72, rainProb: 15 },
    { time: '12:00', temp: 28, humidity: 65, rainProb: 20 },
    { time: '15:00', temp: 29, humidity: 60, rainProb: 25 },
    { time: '18:00', temp: 26, humidity: 68, rainProb: 15 },
    { time: '21:00', temp: 24, humidity: 75, rainProb: 10 }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Weather Intelligence"
        subtitle="Real-time atmospheric monitoring, 5-day precipitation forecasts, and irrigation impact assessments."
      />

      {/* Main Weather Snapshot & Forecast Card */}
      <WeatherCard weather={weather} />

      {/* Weather Impact on Irrigation Box */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 shadow-soft flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-amber-950">Weather Impact on Irrigation Schedule</h3>
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            Low rainfall probability (20%) over the next 24 hours combined with a peak daytime temperature of 28°C increases crop evapotranspiration. Early morning irrigation is recommended to prevent soil moisture depletion without risk of runoff loss.
          </p>
        </div>
      </div>

      {/* Weather Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 24-Hour Temperature Profile */}
        <ChartCard title="24-Hour Temperature Curve (°C)" subtitle="Hourly ambient temperature variation">
          <AreaChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis domain={[18, 35]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#d97706" fill="#fef3c7" strokeWidth={3} />
          </AreaChart>
        </ChartCard>

        {/* 5-Day Rainfall & Rain Probability */}
        <ChartCard title="Precipitation & Rain Probability" subtitle="5-day rain probability % vs volume (mm)">
          <BarChart data={weather?.forecast || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="rainProb" name="Rain Prob (%)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rainfall" name="Rainfall (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
};
