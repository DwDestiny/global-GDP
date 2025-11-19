import React, { Component, ErrorInfo, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { EconomicStats, VisualizationMode } from '../types';
import { AlertTriangle } from 'lucide-react';

interface Globe3DProps {
  data: Record<string, EconomicStats>;
  mode: VisualizationMode;
  onCountryClick: (name: string, stats: EconomicStats) => void;
  polygonsData: any[];
  selectedCountryName: string | null;
}

// --- Utilities ---

const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Multi-stop gradient interpolation
const getGradientColor = (value: number, stops: { pos: number, color: string }[]) => {
  // Ensure stops are sorted
  const sortedStops = [...stops].sort((a, b) => a.pos - b.pos);
  
  if (value <= sortedStops[0].pos) return sortedStops[0].color;
  if (value >= sortedStops[sortedStops.length - 1].pos) return sortedStops[sortedStops.length - 1].color;

  // Find the two stops bounding the value
  let startStop = sortedStops[0];
  let endStop = sortedStops[1];

  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (value >= sortedStops[i].pos && value <= sortedStops[i + 1].pos) {
      startStop = sortedStops[i];
      endStop = sortedStops[i + 1];
      break;
    }
  }

  // Interpolate
  const range = endStop.pos - startStop.pos;
  const relativeValue = (value - startStop.pos) / range;
  
  const c1 = hexToRgb(startStop.color);
  const c2 = hexToRgb(endStop.color);

  const r = Math.round(c1.r + relativeValue * (c2.r - c1.r));
  const g = Math.round(c1.g + relativeValue * (c2.g - c1.g));
  const b = Math.round(c1.b + relativeValue * (c2.b - c1.b));

  return `rgba(${r},${g},${b},0.95)`;
};

// --- Components ---

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GlobeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

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
            <button key={name} onClick={() => onCountryClick(name, s)} className="flex flex-col p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-cyan-500/50 text-left group">
              <span className="text-cyan-400 text-sm font-mono uppercase mb-1 truncate w-full">{name}</span>
              <div className="flex justify-between items-end w-full">
                <span className="text-2xl font-display font-bold text-white">
                    {mode === 'POPULATION' ? (s.population / 1000000).toFixed(1) + 'M' :
                    mode === 'GDP_PER_CAPITA' ? '$' + s.gdpPerCapita.toLocaleString() :
                    s.gdpGrowth.toFixed(1) + '%'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export const Globe3D: React.FC<Globe3DProps> = ({ data, mode, onCountryClick, polygonsData, selectedCountryName }) => {
  const globeEl = useRef<GlobeMethods>();
  const [hoverD, setHoverD] = useState<any | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    if (!isWebGLAvailable()) setWebGLSupported(false);
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-focus camera on selection
  useEffect(() => {
    if (selectedCountryName && globeEl.current && polygonsData.length > 0) {
      const country = polygonsData.find(d => d.properties.ADMIN === selectedCountryName);
      if (country) {
        // Calculate simple centroid from bbox if available, or just use the first coordinate of the first polygon
        // React-globe.gl provides polygonAltitude which helps, but for camera we need lat/lng.
        // A simple approach: find the bounding box or just a point.
        // Since we don't have a geo lib here, we rely on user interaction or just look cool.
        // Actually, let's just let the user explore, but strictly highlight the geometry.
        
        // Optional: We could implement a simple centroid calc if needed, 
        // but visually the pop-up is often enough. 
        // Let's rely on the visual "pop" implemented in polygonAltitude.
      }
    }
  }, [selectedCountryName, polygonsData]);

  const getVal = (feat: any) => {
    if (!feat || !feat.properties) return 0;
    const stats = data[feat.properties.ADMIN];
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
    if (!val && val !== 0) return 'rgba(30, 41, 59, 0.8)'; // Slate 800 for no data
    
    switch (mode) {
      case 'POPULATION': 
        // Rich Purple -> Pink -> Gold Gradient
        return getGradientColor(Math.min(val / 100000000, 1), [
          { pos: 0.0, color: '#312e81' }, // Indigo 900
          { pos: 0.3, color: '#7c3aed' }, // Violet 600
          { pos: 0.6, color: '#db2777' }, // Pink 600
          { pos: 1.0, color: '#facc15' }  // Yellow 400
        ]);
      case 'GDP_PER_CAPITA': 
        // Deep Ocean -> Cyan -> White Gradient
        return getGradientColor(Math.min(val / 65000, 1), [
          { pos: 0.0, color: '#022c22' }, // Teal 950
          { pos: 0.3, color: '#0d9488' }, // Teal 600
          { pos: 0.7, color: '#22d3ee' }, // Cyan 400
          { pos: 1.0, color: '#e0f2fe' }  // Sky 100
        ]);
      case 'POP_GROWTH':
      case 'GDP_GROWTH':
        // Red -> Slate -> Neon Green
        const normalized = Math.min(Math.max((val + 2) / 8, 0), 1);
        return getGradientColor(normalized, [
          { pos: 0.0, color: '#ef4444' }, // Red 500
          { pos: 0.4, color: '#475569' }, // Slate 600
          { pos: 1.0, color: '#10b981' }  // Emerald 500
        ]);
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
          
          // Improved Visuals
          backgroundColor="#020617" // Slate 950
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.15}
          
          // Polygons
          polygonsData={polygonsData}
          polygonAltitude={d => d.properties.ADMIN === selectedCountryName ? 0.3 : (d === hoverD ? 0.12 : 0.01)}
          polygonCapColor={(d: any) => {
            if (d.properties.ADMIN === selectedCountryName) return '#a5f3fc'; // Cyan 200 (Bright highlight)
            if (d === hoverD) return '#7dd3fc'; // Sky 300
            return getColor(getVal(d));
          }}
          polygonSideColor={(d: any) => {
             if (d.properties.ADMIN === selectedCountryName) return 'rgba(34, 211, 238, 0.8)'; // Cyan Glow
             return 'rgba(0,0,0,0.6)';
          }}
          polygonStrokeColor={() => '#1e293b'}
          
          // Interaction
          polygonLabel={({ properties: d }: any) => {
            const stats = data[d.ADMIN];
            const isSelected = d.ADMIN === selectedCountryName;
            
            if (!stats) return '';
            
            return `
            <div class="${isSelected ? 'bg-cyan-950/90 border-cyan-500' : 'bg-slate-900/90 border-slate-700'} p-3 rounded-xl border backdrop-blur-md shadow-2xl text-white font-sans min-w-[150px]">
              <strong class="${isSelected ? 'text-cyan-300' : 'text-slate-200'} text-sm block mb-2 tracking-wide">${d.ADMIN}</strong>
              <div class="flex items-center justify-between gap-4">
                <span class="text-xs text-slate-400 uppercase">${mode.replace(/_/g, ' ')}</span>
                <span class="font-mono font-bold text-lg ${isSelected ? 'text-white' : 'text-cyan-400'}">
                  ${
                     mode.includes('GROWTH') ? stats[mode === 'GDP_GROWTH' ? 'gdpGrowth' : 'popGrowth'].toFixed(2) + '%' : 
                     mode === 'GDP_PER_CAPITA' ? '$' + Math.round(stats.gdpPerCapita).toLocaleString() :
                     (stats.population / 1000000).toFixed(1) + 'M'
                  }
                </span>
              </div>
            </div>
          `}}
          
          onPolygonHover={setHoverD}
          onPolygonClick={(feat: any) => {
              const name = feat.properties.ADMIN;
              const stats = data[name];
              if (stats) {
                onCountryClick(name, stats);
                
                // Optional: Fly to clicked point if geometry is simple
                if (globeEl.current) {
                   // Using a slight offset to view from an angle
                   // globeEl.current.pointOfView({ lat: ..., lng: ..., altitude: 2.5 }, 1000);
                }
              }
          }}
          
          // Optimizations
          polygonsTransitionDuration={400}
        />
      </div>
    </GlobeErrorBoundary>
  );
};