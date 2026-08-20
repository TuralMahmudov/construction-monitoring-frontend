import type { GridLocaleText } from '@mui/x-data-grid';

// Every DataGrid instance in this app passes its own `localeText` (at least
// a `noRowsLabel` override) — DataGrid merges the passed object with its own
// English default internally, NOT with this theme's MuiDataGrid.defaultProps
// (that default only applies when a component omits the prop entirely). So
// this object is applied two ways: as the theme default (bax theme.ts, covers
// any future DataGrid that passes no localeText at all) AND spread into every
// existing per-page `localeText={{ ...azGridLocaleText, noRowsLabel: '...' }}`
// call so the page-specific override doesn't silently drop it back to English.
export const azGridLocaleText: Partial<GridLocaleText> = {
  noRowsLabel: 'Sətir yoxdur',
  noResultsOverlayLabel: 'Nəticə tapılmadı.',
  footerRowSelected: (count) => `${count.toLocaleString()} sətir seçildi`,
  footerTotalRows: 'Cəmi sətir:',
  footerTotalVisibleRows: (visibleCount, totalCount) =>
    `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`,
  booleanCellTrueLabel: 'bəli',
  booleanCellFalseLabel: 'xeyr',
  columnHeaderSortIconLabel: 'Sırala',
  paginationRowsPerPage: 'Səhifə üzrə sətir:',
  paginationDisplayedRows: ({ from, to, count, estimated }) => {
    const unknownRowCount = count == null || count === -1;
    if (!estimated) {
      return `${from}–${to} / ${!unknownRowCount ? count : `${to}-dan çox`}`;
    }
    const estimatedLabel = estimated && estimated > to ? `təxminən ${estimated}` : `${to}-dan çox`;
    return `${from}–${to} / ${!unknownRowCount ? count : estimatedLabel}`;
  },
  paginationItemAriaLabel: (type) => {
    if (type === 'first') return 'İlk səhifəyə keç';
    if (type === 'last') return 'Son səhifəyə keç';
    if (type === 'next') return 'Növbəti səhifəyə keç';
    return 'Əvvəlki səhifəyə keç';
  },
};
