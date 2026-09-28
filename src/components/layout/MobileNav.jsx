import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  FlaskConical,
  CloudSun,
  Sparkles,
  History,
  Settings
} from 'lucide-react';

export const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fields', path: '/fields', icon: Map },
    { name: 'Analyze', path: '/soil-analysis', icon: FlaskConical },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: 'AI Recs', path: '/recommendations', icon: Sparkles },
    { name: 'History', path: '/history', icon: History }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-agri-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-agri-100/70 text-agri-700' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
