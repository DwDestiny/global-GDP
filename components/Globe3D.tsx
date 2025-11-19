import React, { useEffect, useRef, useState, useMemo, ErrorInfo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { CountryGeoJson, EconomicStats, VisualizationMode } from '../types';
import { AlertTriangle, Globe as GlobeIcon } from 'lucide-react';

interface Globe3DProps {
  data: Record<string, EconomicStats>;
  mode: VisualizationMode;
  onCountryClick: (name: string, stats: EconomicStats) => void;
  polygonsData: any[];
}

// --- Utilities ---

// Check WebGL support
const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

// Simple Color Interpolation to replace D3 and avoid "s is not a function" errors
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const interpolateColor = (color1: string, color2: string, factor: number) => {
  if (factor < 0) factor = 0;
  if (factor > 1) factor = 1;
  
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));

  return `rgba(${r},${g},${b},0.9)`;
};

// --- Components ---

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary to catch WebGL Context Failures in react-globe.gl
class GlobeErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Globe3D crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const FallbackView: React.FC<{ data: any, mode: any, onCountryClick: any }> = ({ data, mode, onCountryClick }) => (
  <div className="w-full h-full bg-slate-950 overflow-y-auto p-8 pt-24 pb-24">
    <div className="max-w-5xl mx-auto">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-8 flex items-center gap-4 text-amber-400">
        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-lg">3D Visualization Unavailable</h3>
          <p className="text-sm text-slate-400">Your device graphics settings are preventing the 3D globe from loading. Switching to list view.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([name, stats]) => {
          const s = stats as EconomicStats;
          return (
            <button
              key={name}
              onClick={() => onCountryClick(name, s)}
              className="flex flex-col p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-left group"
            >
              <span className="text-cyan-400 text-sm font-mono uppercase mb-1 truncate w-full">{name}</span>
              <div className="flex justify-between items-end w-full">
                <span className="text-2xl font-display font-bold text-white group-hover:text-cyan-100">
                    {mode === 'POPULATION' ? (s.population / 1000000).toFixed(1) + 'M' :
                    mode === 'GDP_PER_CAPITA' ? '$' + s.gdpPerCapita.toLocaleString() :
                    mode === 'POP_GROWTH' ? s.popGrowth.toFixed(1) + '%' :
                    s.gdpGrowth.toFixed(1) + '%'}
                </span>
                <span className="text-xs text-slate-500">{mode.replace(/_/g, ' ')}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export const Globe3D: React.FC<Globe3DProps> = ({ data, mode, onCountryClick, polygonsData }) => {
  const globeEl = useRef<GlobeMethods>();
  const [hoverD, setHoverD] = useState<any | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebGLSupported(false);
    }

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getVal = (feat: any) => {
    if (!feat || !feat.properties) return 0;
    const name = feat.properties.ADMIN;
    const stats = data[name];
    if (!stats) return 0;
    
    switch (mode) {
      case 'POPULATION': return stats.population;
      case 'GDP_PER_CAPITA': return stats.gdpPerCapita;
      case 'POP_GROWTH': return stats.popGrowth;
      case 'GDP_GROWTH': return stats.gdpGrowth;
      default: return 0;
    }
  };

  const getColor = (val: number) => {
    if (!val && val !== 0) return 'rgba(200,200,200,0.1)';
    
    switch (mode) {
      case 'POPULATION': 
        // 0 to 100M scale (logarithmic-ish visualization adjustment)
        return interpolateColor('#3b0764', '#facc15', Math.min(val / 100000000, 1)); 
      case 'GDP_PER_CAPITA': 
        // 0 to 60k scale
        return interpolateColor('#064e3b', '#34d399', Math.min(val / 60000, 1));
      case 'POP_GROWTH':
        // -1% to 2%
        return interpolateColor('#f43f5e', '#10b981', Math.min(Math.max((val + 1) / 3, 0), 1));
      case 'GDP_GROWTH':
        // -2% to 6%
        return interpolateColor('#f43f5e', '#10b981', Math.min(Math.max((val + 2) / 8, 0), 1));
      default:
        return '#ffffff';
    }
  };

  if (!webGLSupported) {
    return <FallbackView data={data} mode={mode} onCountryClick={onCountryClick} />;
  }

  return (
    <GlobeErrorBoundary fallback={<FallbackView data={data} mode={mode} onCountryClick={onCountryClick} />}>
      <div className="cursor-move">
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          
          polygonsData={polygonsData}
          polygonAltitude={d => d === hoverD ? 0.12 : 0.06}
          polygonCapColor={(d: any) => {
            const val = getVal(d);
            const color = getColor(val);
            return d === hoverD ? '#06b6d4' : color;
          }}
          polygonSideColor={() => 'rgba(0,0,0,0.5)'}
          polygonStrokeColor={() => '#111'}
          polygonLabel={({ properties: d }: any) => {
            const stats = data[d.ADMIN];
            if (!stats) return `<div class="bg-slate-900 px-2 py-1 rounded text-xs text-slate-400">${d.ADMIN}</div>`;
            
            return `
            <div class="bg-slate-900/90 p-2 rounded border border-slate-700 backdrop-blur text-xs text-white font-sans">
              <strong class="text-cyan-400 block mb-1">${d.ADMIN}</strong>
              ${mode.replace(/_/g, ' ')}: <span class="font-mono">${
                 mode.includes('GROWTH') ? stats[mode === 'GDP_GROWTH' ? 'gdpGrowth' : 'popGrowth'].toFixed(2) + '%' : 
                 mode === 'GDP_PER_CAPITA' ? '$' + Math.round(stats.gdpPerCapita).toLocaleString() :
                 (stats.population / 1000000).toFixed(1) + 'M'
              }</span>
            </div>
          `}}
          
          onPolygonHover={setHoverD}
          onPolygonClick={(feat: any) => {
              const name = feat.properties.ADMIN;
              const stats = data[name];
              if (stats) onCountryClick(name, stats);
          }}
          
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.1}
        />
      </div>
    </GlobeErrorBoundary>
  );
};
