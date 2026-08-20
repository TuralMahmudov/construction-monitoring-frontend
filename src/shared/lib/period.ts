// Rüb (rüb = calendar quarter) göstərimi — Roma rəqəmləri ilə, "Q1/Q2" YOX
// (Tural, 2026-08-17: "Q nədir ki yazmışıq ora" — bu format istifadəçiyə
// tanış deyil).
const QUARTER_ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

export function quarterToRoman(quarter: number): string {
  return QUARTER_ROMAN[quarter] ?? String(quarter);
}

export function formatPeriod(year: number | null | undefined, quarter: number | null | undefined): string {
  if (!year || !quarter) {
    return '—';
  }
  return `${year} ${quarterToRoman(quarter)}`;
}

// Yanvar-Mart → I, Aprel-İyun → II, İyul-Sentyabr → III, Oktyabr-Dekabr → IV.
export function currentQuarter(date: Date = new Date()): number {
  return Math.floor(date.getMonth() / 3) + 1;
}
