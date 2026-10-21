import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  ChevronDown,
  Sprout,
  User,
  MapPin,
  Check,
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react';

export const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fields, selectedField, setSelectedField, settings, user, addToast } = useApp();
  const displayName = user?.name || settings?.profile?.name || 'Farmer';
  const displayEmail = user?.email || settings?.profile?.email || 'AgriSense account';
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem('agrisense_token');
    localStorage.removeItem('agrisense_user');
    window.location.href = '/';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToast(`Searching for "${searchQuery}" across field records...`, 'info', 'Search');
    }
  };

  return (
    <header className="min-h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sticky top-0 z-20 shadow-xs min-w-0">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm sm:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[42vw] sm:max-w-none">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
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
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-agri-50 hover:bg-agri-100/80 border border-agri-200/80 text-agri-900 text-xs font-bold transition-colors"
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
        
        {/* Profile Dropdown */}
        <div className="relative shrink-0">
          <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-earth-600 text-white flex items-center justify-center font-bold text-xs">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>

            <span className="hidden sm:block text-xs font-bold text-slate-900 max-w-28 truncate">
              {user?.name || 'My Profile'}
            </span>

            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

        {showProfileMenu && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'My Account'}</p>
              <p className="text-xs text-slate-500">Account</p>
            </div>
            <button
            onClick={() => navigate('/settings')}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50">
              <SettingsIcon className="w-4 h-4 inline mr-2" />Profile & Settings
            </button>

            <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 inline mr-2" />Log out
              </button>
          </div>
          )}
        </div>
      </div>
    </header>
  );
};
