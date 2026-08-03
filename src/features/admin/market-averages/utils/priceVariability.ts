export type VariabilityLevel = 'stable' | 'moderate' | 'high';

export interface Variability {
  level: VariabilityLevel;
  label: string;
  percent: number;
}

// (max-min)/median, not /avg — this feature no longer surfaces the average
// at all, median is the sole reference point for every stat derived here.
export function computeVariability(min: number, max: number, median: number): Variability {
  const percent = median > 0 ? ((max - min) / median) * 100 : 0;
  if (percent < 10) {
    return { level: 'stable', label: 'Stabil', percent };
  }
  if (percent <= 30) {
    return { level: 'moderate', label: 'Orta', percent };
  }
  return { level: 'high', label: 'Böyük fərq', percent };
}
