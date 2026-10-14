import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  FlaskConical,
  CloudSun,
  Sparkles,
  History,
  Settings,
  Home,
  ChevronRight,
  Sprout
} from 'lucide-react';

export const Sidebar = ({ className = '' }) => {
  const location = useLocation();

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Fields', path: '/fields', icon: Map },
    { name: 'Soil Analysis', path: '/soil-analysis', icon: FlaskConical },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: 'AI Recommendations', path: '/recommendations', icon: Sparkles },
    { name: 'History', path: '/history', icon: History }
  ];

  const systemNav = [
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800 z-30 ${className}`}>
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-agri-600 flex items-center justify-center text-white shadow-md shadow-agri-600/30 group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                AgriSense <span className="text-[10px] px-1.5 py-0.5 rounded bg-agri-500/20 text-agri-400 font-bold border border-agri-500/30">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Smarter Decisions. Healthier Fields.</p>
            </div>
          </NavLink>
        </div>

        {/* Main Navigation */}
        <div className="p-4 space-y-6 overflow-y-auto">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-2">
              Main Menu
            </span>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-agri-700 text-white shadow-sm shadow-agri-700/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-2">
              System
            </span>
            <nav className="space-y-1">
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-agri-700 text-white shadow-sm shadow-agri-700/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer / Landing Shortcut */}
      <div className="p-4 border-t border-slate-800/80">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Landing Homepage</span>
        </NavLink>
      </div>
    </aside>
  );
};
