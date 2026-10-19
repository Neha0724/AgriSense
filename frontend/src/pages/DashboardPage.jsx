import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { RecommendationCard } from '../components/ui/RecommendationCard';
import { WeatherCard } from '../components/ui/WeatherCard';
import { ChartCard } from '../components/ui/ChartCard';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import {
  Droplets,
  Thermometer,
  Wind,
  CloudRain,
  Sprout,
  Activity,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { selectedField, weather, chartsData, activeRecommendation, history } = useApp();

  const field = selectedField || { name: 'No field selected', crop: '—', growthStage: '—', soilMoisture: '—' };

  const tableColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Date', accessor: 'date' },
    { header: 'Field', accessor: 'field' },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Soil Moisture', render: (row) => `${row.soilMoisture}%` },
    { header: 'Irrigation Dosage', accessor: 'irrigation' },
    { header: 'NPK Dosage', accessor: 'fertilizer' },
    { header: 'Confidence', accessor: 'confidence' },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Good morning, Farmer 👋"
        subtitle="Here's your farm intelligence & real-time field recommendations for today."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/fields')}
            >
              Add Field
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate('/soil-analysis')}
            >
              New AI Analysis
            </Button>
          </div>
        }
      />

      {/* 6 Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Soil Moisture"
          value={field.soilMoisture ?? '—'}
          unit="%"
          status={typeof field.soilMoisture === 'number' ? (field.soilMoisture < 45 ? 'Moderate' : 'Optimal') : 'No data'}
          icon={Droplets}
          trend="-2% vs yesterday"
          trendDirection="down"
        />

        <StatCard
          title="Temperature"
          value={field.temperature ?? 28}
          unit="°C"
          icon={Thermometer}
          subtitle="Optimal range"
        />

        <StatCard
          title="Humidity"
          value={field.humidity ?? 65}
          unit="%"
          icon={Wind}
          subtitle="Relative level"
        />

        <StatCard
          title="Rainfall"
          value={field.rainfall ?? 12}
          unit="mm"
          icon={CloudRain}
          subtitle="Last 24 hours"
        />

        <StatCard
          title="Active Crop"
          value={field.crop || '—'}
          icon={Sprout}
          subtitle="Selected field"
        />

        <StatCard
          title="Growth Stage"
          value={field.growthStage || '—'}
          icon={Activity}
          subtitle="Phase 2 of 4"
        />
      </div>

      {/* AI Recommendations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-agri-600" />
            <h2 className="text-xl font-bold text-slate-900">AI Quick Recommendations ({field.name})</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/recommendations')}
          >
            View Detailed Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecommendationCard
            type="irrigation"
            data={activeRecommendation?.irrigation || { status: 'No prediction yet', confidence: 0, reasons: ['Run an analysis to see the model result.'] }}
          />

          <RecommendationCard
            type="fertilizer"
            data={activeRecommendation?.fertilizer || { recommendation: 'No prediction yet', confidence: 0, reasons: ['Run an analysis to see the model result.'] }}
          />
        </div>
      </div>

      {/* Weather Forecast & Recharts Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Card Column */}
        <div className="lg:col-span-1">
          <WeatherCard weather={weather} />
        </div>

        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Soil Moisture Trend */}
            <ChartCard title="Soil Moisture Trend (%)" subtitle="7-day tracking vs 50% target">
              <LineChart data={chartsData?.moistureTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[30, 70]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="moisture" name="Soil Moisture" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="dashed" dataKey="target" name="Target (50%)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ChartCard>

            {/* Rainfall Trend */}
            <ChartCard title="Rainfall History (mm)" subtitle="Daily precipitation volume">
              <BarChart data={chartsData?.rainfallTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="rain" name="Rainfall (mm)" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          {/* Irrigation Volume Trend */}
          <ChartCard title="Irrigation Recommendation vs Applied (L/m²)" subtitle="Water efficiency tracking">
            <AreaChart data={chartsData?.irrigationHistory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="recommended" name="Recommended L/m²" stroke="#0d9488" fill="#ccfbf1" strokeWidth={2} />
              <Area type="monotone" dataKey="applied" name="Applied L/m²" stroke="#15803d" fill="#dcfce7" strokeWidth={2} />
            </AreaChart>
          </ChartCard>
        </div>
      </div>

      {/* Recent Recommendations Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Recommendation Logs</h2>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/history')}
          >
            View Full History
          </Button>
        </div>

        <DataTable
          columns={tableColumns}
          data={history.slice(0, 4)}
          onRowClick={(row) => navigate('/history')}
        />
      </div>
    </div>
  );
};
