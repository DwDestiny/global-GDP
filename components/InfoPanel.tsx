import React, { useEffect, useState } from 'react';
import { X, Cpu, Activity, Users, TrendingUp, Globe } from 'lucide-react';
import { EconomicStats, AIInsight } from '../types';
import { StatsCard } from './StatsCard';
import { generateCountryInsight } from '../services/geminiService';

interface InfoPanelProps {
  countryName: string;
  stats: EconomicStats;
  onClose: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ countryName, stats, onClose }) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchInsight = async () => {
      setLoading(true);
      setInsight(null);
      
      try {
        // Artificial delay for UI "scanning" effect if Gemini is too fast, 
        // or to show the loading animation properly.
        const results = await Promise.all([
          generateCountryInsight(countryName, stats),
          new Promise(resolve => setTimeout(resolve, 1200))
        ]);
        
        const aiResult = results[0] as AIInsight;

        if (isMounted) {
          setInsight(aiResult);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to fetch insight", e);
        if (isMounted) {
          setInsight({
            summary: "Data unavailable.",
            keyFactors: ["Connection Error"],
            outlook: "Neutral"
          });
          setLoading(false);
        }
      }
    };

    fetchInsight();
    return () => { isMounted = false; };
  }, [countryName, stats]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-[480px] bg-slate-950/80 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-20 flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-b from-slate-900/50 to-transparent">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Globe className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-mono tracking-widest uppercase">Entity Analysis</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight">{countryName}</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatsCard 
            label="Total Population" 
            value={formatNumber(stats.population)} 
            trend={stats.popGrowth}
            delay={100}
          />
          <StatsCard 
            label="GDP Per Capita" 
            value={formatCurrency(stats.gdpPerCapita)} 
            trend={stats.gdpGrowth}
            delay={200}
          />
        </div>

        {/* AI Analysis Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-fuchsia-400 border-b border-slate-800 pb-2">
            <Cpu className="w-5 h-5" />
            <h3 className="font-display font-semibold uppercase tracking-wider text-sm">Gemini Intelligence</h3>
          </div>

          {loading ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 text-cyan-500/80">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                <span className="font-mono text-xs">ANALYZING MACROECONOMIC DATA STREAMS...</span>
              </div>
              <div className="h-4 bg-slate-800/50 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-800/50 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-800/50 rounded animate-pulse w-5/6" />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-700">
              
              {/* Outlook Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Projected Outlook</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  insight?.outlook === 'Positive' ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400' :
                  insight?.outlook === 'Negative' ? 'bg-rose-950/50 border-rose-500/30 text-rose-400' :
                  'bg-slate-800 border-slate-600 text-slate-300'
                }`}>
                  {insight?.outlook}
                </span>
              </div>

              {/* Summary */}
              <p className="text-slate-300 leading-relaxed text-sm border-l-2 border-fuchsia-500/50 pl-4">
                {insight?.summary}
              </p>

              {/* Key Factors */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Drivers</h4>
                <ul className="space-y-2">
                  {insight?.keyFactors && insight.keyFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 group">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-cyan-500 group-hover:scale-150 transition-transform" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Additional Decoration */}
        <div className="p-4 rounded-lg bg-slate-900/30 border border-dashed border-slate-800">
          <div className="flex items-center gap-4 text-slate-500 text-xs font-mono">
            <Activity className="w-4 h-4" />
            <span>REAL-TIME DATA SYNC ACTIVE</span>
            <span className="ml-auto opacity-50">V 2.4.0</span>
          </div>
        </div>

      </div>
    </div>
  );
};