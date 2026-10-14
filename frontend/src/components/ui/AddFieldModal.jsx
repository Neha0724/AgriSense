import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export const AddFieldModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    crop: 'Wheat',
    soilType: 'Loamy',
    area: '',
    unit: 'hectares',
    growthStage: 'Vegetative',
    soilMoisture: 45,
    nitrogen: 50,
    phosphorus: 30,
    potassium: 40
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Field name is required';
    if (!formData.area || isNaN(formData.area) || Number(formData.area) <= 0) {
      newErrors.area = 'Enter a valid field area (> 0)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ ...formData, area: Number(formData.area) });
      onClose();
      setFormData({
        name: '',
        crop: 'Wheat',
        soilType: 'Loamy',
        area: '',
        unit: 'hectares',
        growthStage: 'Vegetative',
        soilMoisture: 45,
        nitrogen: 50,
        phosphorus: 30,
        potassium: 40
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Field">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Field Name *
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g. North Plot B"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
              errors.name ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-agri-500'
            } focus:outline-none focus:ring-2 bg-slate-50/50`}
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>

        {/* Crop Type & Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Crop Type
            </label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agri-500 bg-slate-50/50"
            >
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Cotton">Cotton</option>
              <option value="Maize">Maize (Corn)</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Soybean">Soybean</option>
              <option value="Potato">Potato</option>
              <option value="Tomato">Tomato</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Field Area (Hectares) *
            </label>
            <input
              type="number"
              step="0.1"
              name="area"
              placeholder="e.g. 2.5"
              value={formData.area}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                errors.area ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-agri-500'
              } focus:outline-none focus:ring-2 bg-slate-50/50`}
            />
            {errors.area && <p className="text-xs text-rose-500 mt-1">{errors.area}</p>}
          </div>
        </div>

        {/* Soil Type & Growth Stage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Soil Type
            </label>
            <select
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agri-500 bg-slate-50/50"
            >
              <option value="Loamy">Loamy</option>
              <option value="Clay">Clay</option>
              <option value="Sandy Loam">Sandy Loam</option>
              <option value="Black Soil">Black Soil (Vertisol)</option>
              <option value="Silt">Silt</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Growth Stage
            </label>
            <select
              name="growthStage"
              value={formData.growthStage}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agri-500 bg-slate-50/50"
            >
              <option value="Germination">Germination</option>
              <option value="Vegetative">Vegetative</option>
              <option value="Flowering">Flowering</option>
              <option value="Fruiting">Fruiting</option>
              <option value="Maturity">Maturity / Harvest</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Save & Add Field
          </Button>
        </div>
      </form>
    </Modal>
  );
};
