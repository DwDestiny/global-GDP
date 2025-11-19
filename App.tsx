import React, { useState, useEffect } from 'react';
import { Globe3D } from './components/Globe3D';
import { InfoPanel } from './components/InfoPanel';
import { EconomicStats, VisualizationMode } from './types';
import { Layers, TrendingUp, Users, DollarSign, Activity, Menu } from 'lucide-react';

const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

// Known realistic data for major economies to keep the demo looking good
const getMajorEconomiesData = (): Record<string, EconomicStats> => ({
  "United States of America": { population: 331000000, gdpPerCapita: 70000, popGrowth: 0.5, gdpGrowth: 2.1 },
  "China": { population: 1400000000, gdpPerCapita: 12500, popGrowth: -0.1, gdpGrowth: 5.0 },
  "India": { population: 1380000000, gdpPerCapita: 2200, popGrowth: 0.9, gdpGrowth: 7.2 },
  "Germany": { population: 83000000, gdpPerCapita: 50000, popGrowth: 0.1, gdpGrowth: 1.8 },
  "United Kingdom": { population: 67000000, gdpPerCapita: 46000, popGrowth: 0.4, gdpGrowth: 1.5 },
  "France": { population: 65000000, gdpPerCapita: 43000, popGrowth: 0.3, gdpGrowth: 1.7 },
  "Japan": { population: 125000000, gdpPerCapita: 39000, popGrowth: -0.3, gdpGrowth: 1.2 },
  "Brazil": { population: 212000000, gdpPerCapita: 7500, popGrowth: 0.7, gdpGrowth: 2.9 },
  "Russia": { population: 144000000, gdpPerCapita: 10000, popGrowth: -0.2, gdpGrowth: 1.5 },
  "Canada": { population: 38000000, gdpPerCapita: 52000, popGrowth: 0.8, gdpGrowth: 2.3 },
  "Australia": { population: 25000000, gdpPerCapita: 51000, popGrowth: 1.1, gdpGrowth: 3.0 },
  "South Korea": { population: 51000000, gdpPerCapita: 31000, popGrowth: 0.1, gdpGrowth: 2.5 },
});

const App: React.FC = () => {
  const [data, setData] = useState<Record<string, EconomicStats>>({});
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{name: string, stats: EconomicStats} | null>(null);
  const [mode, setMode] = useState<VisualizationMode>('POPULATION');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch GeoJSON and generate data for ALL countries found
    const initData = async () => {
      try {
        const res = await fetch(GEOJSON_URL);
        const geoJson = await res.json();
        const feats = geoJson.features;
        
        setFeatures(feats);
        
        const fullData: Record<string, EconomicStats> = {};
        const majorData = getMajorEconomiesData();

        feats.forEach((feat: any) => {
          const name = feat.properties.ADMIN;
          
          if (majorData[name]) {
            fullData[name] = majorData[name];
          } else {
            // Generate plausible pseudo-random data for other countries
            // Use name characters to seed the random so it stays consistent between renders
            const seed = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const rand = (n: number) => {
              const x = Math.sin(seed + n) * 10000;
              return x - Math.floor(x);
            };

            fullData[name] = {
              population: Math.floor(1000000 + rand(1) * 80000000), // 1M to 81M
              gdpPerCapita: Math.floor(1000 + rand(2) * 30000), // $1k to $31k
              popGrowth: Number(((rand(3) * 3) - 0.5).toFixed(2)), // -0.5% to 2.5%
              gdpGrowth: Number(((rand(4) * 8) - 2).toFixed(2)) // -2% to 6%
            };
          }
        });

        setData(fullData);
      } catch (error) {
        console.error("Failed to load map data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      
      {/* 3D Globe Background */}
      <div className="absolute inset-0 z-0">
        {isLoading ? (
           <div className="flex items-center justify-center h-full flex-col gap-4">
             <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-cyan-500 font-mono text-sm animate-pulse">INITIALIZING PLANETARY DATA...</p>
           </div>
        ) : (
          <Globe3D 
            data={data} 
            mode={mode} 
            polygonsData={features}
            onCountryClick={(name, stats) => setSelectedCountry({ name, stats })} 
          />
        )}
      </div>

      {/* Top Navigation / Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              GeoPulse <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Global Economic Monitor</p>
          </div>
        </div>
      </header>

      {/* Mode Selection Control Bar (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto w-full max-w-2xl px-4 flex justify-center">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl p-2 flex gap-1 shadow-2xl overflow-x-auto max-w-full">
          <ModeButton 
            active={mode === 'POPULATION'} 
            onClick={() => setMode('POPULATION')} 
            icon={<Users className="w-4 h-4" />} 
            label="Population" 
          />
          <ModeButton 
            active={mode === 'GDP_PER_CAPITA'} 
            onClick={() => setMode('GDP_PER_CAPITA')} 
            icon={<DollarSign className="w-4 h-4" />} 
            label="GDP / Cap" 
          />
          <div className="w-px bg-slate-700 mx-1" />
          <ModeButton 
            active={mode === 'POP_GROWTH'} 
            onClick={() => setMode('POP_GROWTH')} 
            icon={<TrendingUp className="w-4 h-4" />} 
            label="Pop. Growth" 
          />
          <ModeButton 
            active={mode === 'GDP_GROWTH'} 
            onClick={() => setMode('GDP_GROWTH')} 
            icon={<Activity className="w-4 h-4" />} 
            label="GDP Growth" 
          />
        </div>
      </div>

      {/* Legend / Gradient Indicator (Bottom Left) */}
      <div className="absolute bottom-8 left-8 z-10 hidden md:block pointer-events-none">
        <div className="bg-slate-900/50 backdrop-blur p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 mb-2 font-mono uppercase">{mode.replace(/_/g, ' ')}</p>
          <div className="w-48 h-2 rounded-full bg-gradient-to-r from-blue-900 via-purple-500 to-orange-400 opacity-80" />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Info Panel (Sidebar) */}
      {selectedCountry && (
        <InfoPanel 
          countryName={selectedCountry.name} 
          stats={selectedCountry.stats} 
          onClose={() => setSelectedCountry(null)} 
        />
      )}
      
    </div>
  );
};

const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium whitespace-nowrap ${
      active 
        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20 scale-105' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default App;