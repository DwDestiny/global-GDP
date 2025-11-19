import React, { useState, useEffect } from 'react';
import { Globe3D } from './components/Globe3D';
import { InfoPanel } from './components/InfoPanel';
import { EconomicStats, VisualizationMode, HistoricalPoint } from './types';
import { Activity } from 'lucide-react';

const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

// Helper to generate history based on current value and growth rate
const generateHistory = (currentValue: number, growthRate: number, years: number = 10): HistoricalPoint[] => {
  const history: HistoricalPoint[] = [];
  const currentYear = new Date().getFullYear();
  let val = currentValue;
  
  // Go backwards
  for (let i = 0; i < years; i++) {
    history.unshift({ year: currentYear - i, value: val });
    const fluctuation = (Math.random() - 0.5) * 0.02; 
    val = val / (1 + (growthRate / 100) + fluctuation);
  }
  return history;
};

const getMajorEconomiesData = (): Record<string, EconomicStats> => {
  const baseData = {
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
  };

  const result: Record<string, EconomicStats> = {};
  
  Object.entries(baseData).forEach(([key, data]) => {
    result[key] = {
      ...data,
      history: {
        population: generateHistory(data.population, data.popGrowth),
        gdp: generateHistory(data.gdpPerCapita, data.gdpGrowth)
      }
    };
  });

  return result;
};

const App: React.FC = () => {
  const [data, setData] = useState<Record<string, EconomicStats>>({});
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{name: string, stats: EconomicStats} | null>(null);
  const [mode] = useState<VisualizationMode>('POPULATION');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
            // Generate pseudo-random data
            const seed = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const rand = (n: number) => {
              const x = Math.sin(seed + n) * 10000;
              return x - Math.floor(x);
            };

            const pop = Math.floor(1000000 + rand(1) * 80000000);
            const gdp = Math.floor(1000 + rand(2) * 30000);
            const popG = Number(((rand(3) * 3) - 0.5).toFixed(2));
            const gdpG = Number(((rand(4) * 8) - 2).toFixed(2));

            fullData[name] = {
              population: pop,
              gdpPerCapita: gdp,
              popGrowth: popG,
              gdpGrowth: gdpG,
              history: {
                population: generateHistory(pop, popG),
                gdp: generateHistory(gdp, gdpG)
              }
            };
          }
        });

        // Calculate Rankings
        const countryNames = Object.keys(fullData);

        // Rank by Population
        countryNames.sort((a, b) => fullData[b].population - fullData[a].population);
        countryNames.forEach((name, index) => {
          fullData[name].populationRank = index + 1;
        });

        // Rank by GDP Per Capita
        countryNames.sort((a, b) => fullData[b].gdpPerCapita - fullData[a].gdpPerCapita);
        countryNames.forEach((name, index) => {
          fullData[name].gdpRank = index + 1;
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
            selectedCountryName={selectedCountry?.name || null}
            onCountryClick={(name, stats) => setSelectedCountry({ name, stats })} 
          />
        )}
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              GeoPulse
            </h1>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Global Data Monitor</p>
          </div>
        </div>
      </header>

      {/* Info Panel */}
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

export default App;