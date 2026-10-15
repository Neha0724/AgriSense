import React from 'react';
import { Sun, CloudSun, CloudRain, CloudLightning, Droplets, Wind, Gauge, Compass } from 'lucide-react';

export const WeatherCard = ({ weather }) => {
  if (!weather) return null;

  const getWeatherIcon = (iconName) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="w-6 h-6 text-amber-500" />;
      case 'cloud-rain':
        return <CloudRain className="w-6 h-6 text-sky-500" />;
      case 'cloud-lightning':
        return <CloudLightning className="w-6 h-6 text-indigo-500" />;
      default:
        return <CloudSun className="w-6 h-6 text-amber-500" />;
    }
  };

  const { current, forecast } = weather;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weather Forecast</span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{current.condition}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
          <CloudSun className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
          {current.temp}°<span className="text-xl text-slate-500 font-semibold">C</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 border-l border-slate-200 pl-4">
          <span className="flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-500" /> Humidity: <strong>{current.humidity}%</strong>
          </span>
          <span className="flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-500" /> Rain: <strong>{current.rainfall} mm</strong>
          </span>
          <span className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-teal-500" /> Wind: <strong>{current.windSpeed} km/h</strong>
          </span>
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-slate-400" /> UV Index: <strong>{current.uvIndex}</strong>
          </span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">5-Day Forecast</h4>
        <div className="grid grid-cols-5 gap-2">
          {forecast.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center bg-slate-50 rounded-xl p-2 border border-slate-100 text-center">
              <span className="text-xs font-bold text-slate-700">{day.day}</span>
              <div className="my-1.5">{getWeatherIcon(day.icon)}</div>
              <span className="text-sm font-extrabold text-slate-900">{day.temp}°</span>
              <span className="text-[10px] text-slate-400 font-medium">{day.tempLow}°</span>
              <div className="mt-1 flex items-center text-[10px] text-sky-600 font-semibold">
                <Droplets className="w-2.5 h-2.5 mr-0.5" />
                {day.rainProb}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
