export interface CountryGeoJsonFeature {
  type: string;
  properties: {
    ISO_A2?: string;
    ISO_A3: string;
    NAME: string;
    ADMIN: string;
    [key: string]: any;
  };
  geometry: any;
}

export interface CountryGeoJson {
  type: string;
  features: CountryGeoJsonFeature[];
}

export interface EconomicStats {
  population: number;
  gdpPerCapita: number;
  popGrowth: number; // Percentage
  gdpGrowth: number; // Percentage
}

export type VisualizationMode = 'POPULATION' | 'GDP_PER_CAPITA' | 'POP_GROWTH' | 'GDP_GROWTH';

export interface AIInsight {
  summary: string;
  keyFactors: string[];
  outlook: 'Positive' | 'Neutral' | 'Negative';
}
