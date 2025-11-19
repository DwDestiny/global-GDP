import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Trophy } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  trend?: number;
  suffix?: string;
  isCurrency?: boolean;
  delay?: number;
  rank?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, trend, suffix = '', isCurrency = false, delay = 0, rank }) => {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0.5) return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    if (trend < -0.5) return <ArrowDownRight className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return 'text-slate-400';
    if (trend > 0.5) return 'text-emerald-400';
    if (trend < -0.5) return 'text-rose-400';
    return 'text-slate-400';
  };

  return (
    <div 
      className="bg-slate-900/60 border border-slate-700/50 backdrop-blur-md rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-500 group relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        {rank && (
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] text-amber-400 font-mono">
            <Trophy className="w-3 h-3" />
            <span>#{rank}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-display font-bold text-slate-100 group-hover:text-cyan-100 transition-colors tracking-tight">
          {value}
          <span className="text-xs text-slate-500 ml-1 font-normal">{suffix}</span>
        </h3>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-xs font-mono font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};