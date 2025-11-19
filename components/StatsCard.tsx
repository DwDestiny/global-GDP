import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  trend?: number;
  suffix?: string;
  isCurrency?: boolean;
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, trend, suffix = '', isCurrency = false, delay = 0 }) => {
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
      className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-md rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-500 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-display font-bold text-slate-100 group-hover:text-cyan-100 transition-colors">
          {value}
          <span className="text-sm text-slate-500 ml-1 font-normal">{suffix}</span>
        </h3>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${getTrendColor()} bg-slate-950/50 px-2 py-1 rounded-lg border border-slate-800`}>
            {getTrendIcon()}
            <span className="text-xs font-mono font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
