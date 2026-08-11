import { createTheme, responsiveFontSizes, type Theme } from '@mui/material/styles';
// Type-only import so @mui/x-data-grid's `Components` module augmentation
// (which adds the `MuiDataGrid` key) is loaded — without it, TS doesn't know
// about that key here even though DataGrid is used throughout the app.
import type {} from '@mui/x-data-grid/themeAugmentation';
// Same reasoning for `MuiTreeItem` (category tree, category pickers).
import type {} from '@mui/x-tree-view/themeAugmentation';
import { darkPalette, lightPalette } from './palette';

export type ThemeMode = 'light' | 'dark';

export function createAppTheme(mode: ThemeMode): Theme {
  const theme = createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: [
        'Inter',
        'Roboto',
        '"Segoe UI"',
        'system-ui',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: mode === 'light' ? '#e0e0e0' : '#263241',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: '1px solid',
            borderColor: mode === 'light' ? '#e0e0e0' : '#263241',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            border: '1px solid',
            borderColor: mode === 'light' ? '#d0d5dd' : '#324459',
            boxShadow:
              mode === 'light'
                ? '0 1px 2px rgba(16,24,40,0.06), 0 4px 12px rgba(16,24,40,0.05)'
                : '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.25)',
          },
        },
      },
      MuiDataGrid: {
        defaultProps: {
          // The app has its own dedicated filter UI on every list page —
          // the built-in column-header 3-dot menu (filter/sort/hide-column)
          // is redundant and was never wired to those custom filters anyway.
          disableColumnMenu: true,
        },
        styleOverrides: {
          root: {
            border: 'none',
          },
          columnHeaders: {
            // No heavy fill — the header row's job is to stay quiet so it
            // doesn't compete with the data, not to announce itself.
            backgroundColor: 'transparent',
            borderBottom: '1px solid',
            borderColor: mode === 'light' ? '#e0e0e0' : '#263241',
          },
          columnHeaderTitle: ({ theme }) => ({
            fontSize: 13,
            letterSpacing: '0.4px',
            fontWeight: 500,
            color: theme.palette.text.secondary,
          }),
          row: {
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(21,101,192,0.04)' : 'rgba(94,146,243,0.08)',
            },
          },
        },
      },
      // Vertical indent-guide lines (one per nesting level, via the
      // recursively-nested groupTransition containers) + a left accent bar
      // on the selected row — the default selected state is just a faint
      // background tint that's easy to miss at deep indentation.
      MuiTreeItem: {
        styleOverrides: {
          groupTransition: {
            marginLeft: 10,
            paddingLeft: 10,
            borderLeft: '1px solid',
            borderColor: mode === 'light' ? '#d0d5dd' : '#324459',
          },
          content: {
            borderLeft: '3px solid transparent',
            '&[data-selected]': {
              borderLeftColor: mode === 'light' ? '#1565c0' : '#5e92f3',
            },
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme);
}
