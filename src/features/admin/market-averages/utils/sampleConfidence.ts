// A median computed from very few organizations isn't a "market" figure yet
// — with sampleCount=1 it's mathematically identical to that one
// organization's own price, but was rendered with the same visual weight as
// a row backed by 10 orgs. Purely a display concern (sampleCount already
// ships on every row); no aggregation logic changes.
export type ConfidenceLevel = 'low' | 'moderate' | 'normal';

export interface SampleConfidence {
  level: ConfidenceLevel;
  label: string;
}

export function computeSampleConfidence(sampleCount: number): SampleConfidence {
  if (sampleCount <= 1) {
    return { level: 'low', label: `Aşağı etibarlılıq — ${sampleCount} təşkilat` };
  }
  if (sampleCount === 2) {
    return { level: 'moderate', label: `Məhdud etibarlılıq — ${sampleCount} təşkilat` };
  }
  return { level: 'normal', label: '' };
}
