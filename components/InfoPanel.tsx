import React from 'react';
import { X, Globe, TrendingUp } from 'lucide-react';
import { EconomicStats, HistoricalPoint } from '../types';
import { StatsCard } from './StatsCard';

interface InfoPanelProps {
  countryName: string;
  stats: EconomicStats;
  onClose: () => void;
}

// Simple SVG Line Chart Component
const TrendChart: React.FC<{ 
  data: HistoricalPoint[]; 
  color: string; 
  label: string; 
  isCurrency?: boolean;
}> = ({ data, color, label, isCurrency = false }) => {
  const height = 50; // Reduced height for compact view
  const width = 140;
  const padding = 4;

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - minVal) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-3 flex flex-col h-full group hover:bg-slate-900/60 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</span>
      </div>
      
      <div className="relative flex-1 w-full min-h-[50px]">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
          <path 
            d={`M ${points}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className={`${color} opacity-80`}
            vectorEffect="non-scaling-stroke"
          />
          {data.map((d, i) => {
             const x = (i / (data.length - 1)) * width;
             const y = height - ((d.value - minVal) / range) * (height - padding * 2) - padding;
             return (
               <circle cx={x} cy={y} r="2" className={`fill-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`} key={i} />
             )
          })}
        </svg>
      </div>
      
      <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-600">
        <span>{data[0].year}</span>
        <span>{data[data.length-1].year}</span>
      </div>
    </div>
  );
};

export const InfoPanel: React.FC<InfoPanelProps> = ({ countryName, stats, onClose }) => {

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-[420px] bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-20 flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-right">
      
      {/* Header - More compact */}
      <div className="p-5 pb-4 border-b border-slate-800 flex justify-between items-start bg-gradient-to-b from-slate-900 to-transparent">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Globe className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase">Country Insight</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight leading-none">{countryName}</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Single Page Content - Compact Grid */}
      <div className="flex-1 p-5 space-y-4 overflow-hidden flex flex-col">
        
        {/* 1. Key Stats Cards with Ranking */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard 
            label="Population" 
            value={formatNumber(stats.population)} 
            trend={stats.popGrowth}
            rank={stats.populationRank}
            delay={100}
          />
          <StatsCard 
            label="GDP Per Capita" 
            value={formatCurrency(stats.gdpPerCapita)} 
            trend={stats.gdpGrowth}
            rank={stats.gdpRank}
            delay={200}
          />
        </div>

        {/* 2. Historical Trends Section - Side by Side */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">10-Year Trends</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 h-32">
             <TrendChart 
                 data={stats.history.population} 
                 label="Pop. Curve" 
                 color="text-fuchsia-400" 
             />
             <TrendChart 
                 data={stats.history.gdp} 
                 label="Wealth Curve" 
                 color="text-emerald-400" 
                 isCurrency={true}
             />
          </div>

          {/* 3. Decorative / Footer Area (Takes remaining space visually) */}
          <div className="mt-4 flex-1 rounded-xl bg-slate-900/20 border border-dashed border-slate-800 p-4 flex items-center justify-center flex-col text-center gap-2">
             <p className="text-slate-500 text-xs font-display max-w-[200px]">
               Global ranking and historical data analysis based on current economic models.
             </p>
             <div className="flex gap-1 mt-2">
               <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></div>
               <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping delay-75"></div>
               <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping delay-150"></div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};