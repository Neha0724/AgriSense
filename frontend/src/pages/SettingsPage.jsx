import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { User, Sliders, Bell, Save, ShieldCheck } from 'lucide-react';

export const SettingsPage = () => {
  const { settings, user, handleUpdateSettings } = useApp();

  const [form, setForm] = useState(
    settings || {
      profile: {
        name: 'Rajesh Kumar',
        email: 'farmer.rajesh@agrisense.io',
        phone: '+91 98765 43210',
        location: 'Punjab, India',
        farmName: 'Green Valley Eco Farm'
      },
      preferences: {
        irrigationUnit: 'L/m²',
        areaUnit: 'hectares',
        tempUnit: '°C',
        alertThreshold: 45
      },
      notifications: {
        emailAlerts: true,
        smsAlerts: true,
        weatherWarnings: true,
        dailySummary: true
      }
    }
  );

  useEffect(() => {
    if (settings || user) {
      setForm(prev => ({
        ...prev,
        ...(settings || {}),
        profile: { ...prev.profile, ...(settings?.profile || {}), name: user?.name || settings?.profile?.name || prev.profile.name, email: user?.email || settings?.profile?.email || prev.profile.email }
      }));
    }
  }, [settings, user]);

  const [saving, setSaving] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      profile: { ...prev.profile, [name]: value }
    }));
  };

  const handlePrefChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [name]: value }
    }));
  };

  const handleToggleNotification = (key) => {
    setForm(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await handleUpdateSettings(form);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Settings & System Preferences"
        subtitle="Manage farmer profile details, measurement units, automated notification triggers, and farm parameters."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-agri-700" />
            <h3 className="text-base font-bold text-slate-900">Farmer Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.profile.name}
                onChange={handleProfileChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farm / Organization Name</label>
              <input
                type="text"
                name="farmName"
                value={form.profile.farmName}
                onChange={handleProfileChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.profile.email}
                onChange={handleProfileChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={form.profile.phone}
                onChange={handleProfileChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Farm Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-agri-700" />
            <h3 className="text-base font-bold text-slate-900">Farm Measurement Units</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Irrigation Unit</label>
              <select
                name="irrigationUnit"
                value={form.preferences.irrigationUnit}
                onChange={handlePrefChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
              >
                <option value="L/m²">Liters per m² (L/m²)</option>
                <option value="mm">Millimeters (mm)</option>
                <option value="gallons/acre">Gallons per Acre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area Unit</label>
              <select
                name="areaUnit"
                value={form.preferences.areaUnit}
                onChange={handlePrefChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
              >
                <option value="hectares">Hectares (ha)</option>
                <option value="acres">Acres</option>
                <option value="sqm">Square Meters (m²)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Temperature Unit</label>
              <select
                name="tempUnit"
                value={form.preferences.tempUnit}
                onChange={handlePrefChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-agri-500 bg-slate-50"
              >
                <option value="°C">Celsius (°C)</option>
                <option value="°F">Fahrenheit (°F)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-5 h-5 text-agri-700" />
            <h3 className="text-base font-bold text-slate-900">Notification Alerts</h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
              <span className="font-semibold text-slate-800">Email Recommendation Alerts</span>
              <input
                type="checkbox"
                checked={form.notifications.emailAlerts}
                onChange={() => handleToggleNotification('emailAlerts')}
                className="w-4 h-4 text-agri-600 rounded focus:ring-agri-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
              <span className="font-semibold text-slate-800">SMS Instant Weather Warnings</span>
              <input
                type="checkbox"
                checked={form.notifications.smsAlerts}
                onChange={() => handleToggleNotification('smsAlerts')}
                className="w-4 h-4 text-agri-600 rounded focus:ring-agri-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
              <span className="font-semibold text-slate-800">Daily Morning Field Intelligence Brief</span>
              <input
                type="checkbox"
                checked={form.notifications.dailySummary}
                onChange={() => handleToggleNotification('dailySummary')}
                className="w-4 h-4 text-agri-600 rounded focus:ring-agri-500"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            isLoading={saving}
            className="shadow-md shadow-agri-700/30"
          >
            Save All Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
