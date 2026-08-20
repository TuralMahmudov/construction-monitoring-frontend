import * as XLSX from 'xlsx';

// Generic — callers must pre-format rows with Azerbaijani-language keys
// (those become the column headers), this utility does no
// translation/formatting of its own. Reused by every future "Excel-ə çıxar"
// button (bax FRONTEND_AI_PROMPT_REPORTS.md § 1).
export function exportToExcel(rows: Record<string, string | number>[], filename: string): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hesabat');
  XLSX.writeFile(workbook, filename);
}
