import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  ChevronDown,
  Sprout,
  User,
  MapPin,
  Check
} from 'lucide-react';

export const Topbar = () => {
  const location = useLocation();
  const { fields, selectedField, setSelectedField, settings, addToast } = useApp();
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Page titles map
  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard':
        return 'Dashboard Overview';
      case '/fields':
        return 'Field Management';
      case '/soil-analysis':
        return 'AI Soil & Crop Analysis';
      case '/weather':
        return 'Weather Intelligence';
      case '/recommendations':
        return 'AI Precision Recommendations';
      case '/history':
        return 'Recommendation History';
      case '/settings':
        return 'System & Farm Settings';
      default:
        return 'AgriSense Dashboard';
    }
  };

  const notificationsList = [
    { id: 1, text: 'North Field soil moisture reached 42% threshold', time: '10m ago', unread: true },
    { id: 2, text: 'Rain expected on Friday (18 mm)', time: '1h ago', unread: true },
    { id: 3, text: 'AI generated new fertilizer dosage plan', time: '3h ago', unread: false }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToast(`Searching for "${searchQuery}" across field records...`, 'info', 'Search');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search fields, crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100/80 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white w-48 lg:w-64 transition-all"
          />
        </form>

        {/* Selected Field Selector */}
        {fields && fields.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowFieldMenu(!showFieldMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-agri-50 hover:bg-agri-100/80 border border-agri-200/80 text-agri-900 text-xs font-bold transition-colors"
            >
              <Sprout className="w-4 h-4 text-agri-700" />
              <span className="max-w-[100px] sm:max-w-[140px] truncate">
                {selectedField ? selectedField.name : 'Select Field'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-agri-700" />
            </button>

            {/* Field Dropdown */}
            {showFieldMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in"
                onClick={() => setShowFieldMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Select Active Field
                </div>
                {fields.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedField(f)}
                    className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{f.name}</div>
                      <div className="text-[10px] text-slate-400">{f.crop} • {f.area} ha</div>
                    </div>
                    {selectedField?.id === f.id && <Check className="w-4 h-4 text-agri-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-600 flex items-center justify-center relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-agri-600 ring-2 ring-white"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in"
              onClick={() => setShowNotifications(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Farm Alerts</span>
                <span className="text-[10px] bg-agri-100 text-agri-800 font-bold px-2 py-0.5 rounded-full">
                  2 New
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notificationsList.map((n) => (
                  <div key={n.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                    <p className="text-slate-800 font-medium">{n.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Farmer Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-earth-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {settings?.profile?.name ? settings.profile.name.charAt(0) : 'R'}
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              {settings?.profile?.name || 'Farmer Rajesh'}
            </span>
            <span className="text-[10px] text-slate-500 block leading-tight">
              {settings?.profile?.farmName || 'Green Valley Farm'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
