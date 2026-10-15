import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { FieldCard } from '../components/ui/FieldCard';
import { AddFieldModal } from '../components/ui/AddFieldModal';
import { Button } from '../components/ui/Button';
import { Plus, MapPin, Layers } from 'lucide-react';

export const MyFieldsPage = () => {
  const navigate = useNavigate();
  const { fields, setSelectedField, handleAddField } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectField = (field) => {
    setSelectedField(field);
    navigate('/dashboard');
  };

  const handleAnalyzeField = (field) => {
    setSelectedField(field);
    navigate('/soil-analysis');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Management"
        subtitle="Manage farm plots, monitor growth stages, and initiate targeted AI soil analysis."
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Add New Field
          </Button>
        }
      />

      {/* Field Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => (
          <FieldCard
            key={field.id}
            field={field}
            onSelect={handleSelectField}
            onAnalyze={handleAnalyzeField}
          />
        ))}

        {/* Add Field Placeholder Card */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-agri-500 hover:bg-agri-50/40 transition-all duration-200 min-h-[280px] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-agri-100 group-hover:text-agri-700 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 group-hover:text-agri-800">Add New Field Plot</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Register a new farm sector to monitor soil moisture, nutrients, and customized irrigation schedules.
          </p>
        </div>
      </div>

      {/* Add Field Modal */}
      <AddFieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddField}
      />
    </div>
  );
};
