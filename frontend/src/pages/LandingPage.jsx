import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Sparkles,
  Droplets,
  CloudSun,
  History,
  ArrowRight,
  CheckCircle2,
  Cpu,
  BarChart3,
  ShieldCheck,
  Layers,
  UserRound, 
  ChevronDown, 
  LogOut, 
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const isLoggedIn = Boolean(localStorage.getItem('agrisense_token'));

  const handleLogout = () => {
    localStorage.removeItem('agrisense_token');
    localStorage.removeItem('agrisense_user');
    setUser(null);
    setShowProfileMenu(false);
    window.location.href = '/';
  };

  const steps = [
    {
      step: '01',
      title: 'Collect Data',
      desc: 'Input real-time soil moisture, NPK nutrient levels, ambient temperature, humidity, and crop growth stage.',
      icon: Layers
    },
    {
      step: '02',
      title: 'Analyze Conditions',
      desc: 'AgriSense algorithms process multi-parameter sensor metrics alongside hyper-local 5-day weather forecasts.',
      icon: Cpu
    },
    {
      step: '03',
      title: 'AI Prediction',
      desc: 'Machine learning models calculate exact crop evapotranspiration rates and nutrient supplementation gaps.',
      icon: Sparkles
    },
    {
      step: '04',
      title: 'Smart Recommendation',
      desc: 'Receive personalized, actionable irrigation timing and NPK fertilizer dosages with high confidence ratings.',
      icon: CheckCircle2
    }
  ];

  const features = [
    {
      title: 'Smart Irrigation',
      desc: 'Prevent over-watering and root rot. Save up to 35% water while ensuring optimal soil moisture for crop yield.',
      icon: Droplets,
      color: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    {
      title: 'Fertilizer Optimization',
      desc: 'Precise N-P-K nutrient dosage recommendations tailored to specific growth stages (Vegetative, Flowering, Fruiting).',
      icon: Sprout,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Weather Intelligence',
      desc: 'Integrated 5-day hyper-local precipitation and temperature predictions to prevent wasted irrigation applications.',
      icon: CloudSun,
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      title: 'Historical Insights',
      desc: 'Track long-term field health trends, yield performance, and historical recommendations over time.',
      icon: History,
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-agri-200 selection:text-agri-900">
      
  {/* Top Navbar */}
  <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-agri-700 flex items-center justify-center text-white shadow-md">
        <Sprout className="w-6 h-6" />
      </div>
      <div>
        <span className="text-xl font-black text-slate-900">AgriSense</span>
        <span className="text-[10px] text-slate-500 block">Smarter Decisions. Healthier Fields.</span>
      </div>
    </div>

    <div className="flex items-center gap-2 sm:gap-3">
      {isLoggedIn && (
        <button
          onClick={() => navigate('/dashboard')}
          className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-emerald-700">Dashboard
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          aria-label="Open account menu"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2"
        >
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            {isLoggedIn ? ((user?.name || 'U').charAt(0).toUpperCase()) : (<UserRound className="w-5 h-5" />)}
          </span>

          {isLoggedIn && (
            <span className="hidden sm:inline text-sm font-semibold text-slate-800 max-w-32 truncate">
              {user?.name || 'My Profile'}
            </span>
          )}

          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-xl z-50 py-2">
            {isLoggedIn ? (
              <>
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'My Account'}</p>
                  <p className="text-xs text-slate-500">Signed in</p>
                </div>

                <button
                  onClick={() => navigate('/settings')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Profile & Settings
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  <Sprout className="w-4 h-4 inline mr-2" />
                  My Dashboard
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
                  Sign in
                </button>

                <button
                  onClick={() => navigate('/signup')}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                  Create account
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  </header>


      {/* Hero Section */}
      <section className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-agri-100/80 border border-agri-200 text-agri-800 text-xs font-bold mb-6">
            <Sparkles className="w-4 h-4 text-agri-700" />
            <span>AI-Driven Precision Agriculture Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            AI-Powered <span className="text-agri-700">Precision Agriculture</span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
            Make smarter irrigation and fertilizer decisions using soil, weather, and crop intelligence. Optimize yield while conserving vital farm resources.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              className="w-full sm:w-auto shadow-lg shadow-agri-700/25"
              onClick={() => navigate('/soil-analysis')}
            >
              Analyze My Field
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon={ArrowRight}
              className="w-full sm:w-auto"
              onClick={() => navigate('/dashboard')}
            >
              Explore Dashboard
            </Button>
          </div>
        </div>

        {/* Mock Field Dashboard Illustration */}
        <div className="mt-12 max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-agri-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-bold text-slate-400 ml-2">AgriSense Mock Field Monitor — North Field (Wheat)</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Live AI Analysis Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Soil Moisture</span>
              <div className="text-3xl font-black text-slate-900 mt-1">42%</div>
              <div className="mt-2 flex items-center text-xs text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                Below optimal target (50%)
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Irrigation Recommendation</span>
              <div className="text-2xl font-black text-agri-800 mt-1">18–22 L/m²</div>
              <div className="mt-2 flex items-center text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200/60">
                Confidence: 91% • Early Morning
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">NPK Supplement Plan</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">N: 40 | P: 20 | K: 25</div>
              <div className="mt-2 flex items-center text-xs text-sky-700 font-semibold bg-sky-50 p-2 rounded-lg border border-sky-200/60">
                Nitrogen deficiency detected
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How AgriSense Works */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">How AgriSense Works</h2>
            <p className="mt-2 text-sm text-slate-600">
              A 4-step connected process converting raw soil metrics into actionable irrigation and fertilizer plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-soft relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-agri-700">{item.step}</span>
                      <div className="w-10 h-10 rounded-xl bg-agri-100 text-agri-800 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Core System Capabilities</h2>
          <p className="mt-2 text-sm text-slate-600">
            Engineered specifically for agricultural precision support with nature-inspired, high-impact tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-agri-900 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ready to optimize your crop yield?</h2>
          <p className="mt-3 text-agri-200 text-sm sm:text-base max-w-xl mx-auto">
            Input your field parameters now or explore the interactive dashboard.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="bg-agri-600 text-agri-900 hover:bg-agri-50 shadow-lg shadow-agri-900/25"
              icon={Sparkles}
              onClick={() => navigate('/soil-analysis')}
            >
              Analyze My Field Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-agri-700 text-agri-700 hover:bg-agri-800"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
