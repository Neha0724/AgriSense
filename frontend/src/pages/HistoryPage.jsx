import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ChartCard } from '../components/ui/ChartCard';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Filter, Search, Calendar, History as HistoryIcon, FileText, CheckCircle2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const HistoryPage = () => {
  const { history, fields } = useApp();

  const [fieldFilter, setFieldFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filter history records based on selected dropdowns & search
  const filteredHistory = history.filter((item) => {
    const matchesField = fieldFilter === 'All' || item.field === fieldFilter;
    const matchesCrop = cropFilter === 'All' || item.crop === cropFilter;
    const matchesSearch =
      searchQuery === '' ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.includes(searchQuery) ||
      item.field.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesField && matchesCrop && matchesSearch;
  });

  const tableColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Date & Time', render: (row) => `${row.date} (${row.time || '09:00 AM'})` },
    { header: 'Field', accessor: 'field' },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Soil Moisture', render: (row) => `${row.soilMoisture}%` },
    { header: 'Irrigation Recommended', accessor: 'irrigation' },
    { header: 'Fertilizer Applied', accessor: 'fertilizer' },
    { header: 'Confidence', accessor: 'confidence' },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  // Recharts history data transformation
  const historyTrendData = [...history].reverse().map(item => ({
    date: item.date.slice(5),
    moisture: item.soilMoisture,
    confidence: parseInt(item.confidence) || 90
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Recommendation History & Analytics"
        subtitle="Complete log of past AI recommendation models, soil hydration trajectories, and NPK dosage applications."
      />

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-agri-600" /> Filter:
          </div>

          {/* Field Filter */}
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:ring-agri-500 text-slate-800"
          >
            <option value="All">All Fields</option>
            <option value="North Field">North Field</option>
            <option value="South Field">South Field</option>
            <option value="East Field">East Field</option>
          </select>

          {/* Crop Filter */}
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:ring-agri-500 text-slate-800"
          >
            <option value="All">All Crops</option>
            <option value="Wheat">Wheat</option>
            <option value="Rice">Rice</option>
            <option value="Cotton">Cotton</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, date, field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agri-500"
          />
        </div>
      </div>

      {/* History Data Table */}
      <DataTable
        columns={tableColumns}
        data={filteredHistory}
        onRowClick={(row) => setSelectedRecord(row)}
        emptyMessage="No history logs match the selected filters."
      />

      {/* History Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Soil Moisture Trajectory Over Time */}
        <ChartCard title="Soil Moisture Trajectory (%)" subtitle="Historical telemetry log">
          <LineChart data={historyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[30, 70]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="moisture" name="Soil Moisture (%)" stroke="#16a34a" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ChartCard>

        {/* Model AI Confidence Ratings Over Time */}
        <ChartCard title="AI Model Confidence (%)" subtitle="Historical prediction accuracy rating">
          <BarChart data={historyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="confidence" name="Confidence (%)" fill="#0284c7" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Detailed Record Inspection Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Recommendation Log details (${selectedRecord.id})`}
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-700">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Field & Crop</span>
                <span className="font-bold text-slate-900">{selectedRecord.field} ({selectedRecord.crop})</span>
              </div>
              <StatusBadge status={selectedRecord.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Date Recorded</span>
                <span className="font-semibold text-slate-800">{selectedRecord.date} {selectedRecord.time}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Soil Moisture</span>
                <span className="font-semibold text-slate-800">{selectedRecord.soilMoisture}%</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900">Irrigation Prescription</h4>
              <p className="p-3 bg-sky-50 text-sky-950 rounded-xl border border-sky-100 font-semibold">
                {selectedRecord.irrigation}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-900">NPK Fertilizer Dosage</h4>
              <p className="p-3 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-100 font-semibold">
                {selectedRecord.fertilizer}
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
