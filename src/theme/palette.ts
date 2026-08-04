import type { PaletteOptions } from '@mui/material/styles';

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#1565c0',
    light: '#5e92f3',
    dark: '#003c8f',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#455a64',
    light: '#718792',
    dark: '#1c313a',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f4f6f8',
    paper: '#ffffff',
  },
  divider: '#e0e0e0',
};

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#5e92f3',
    light: '#8bb4ff',
    dark: '#0064c1',
    contrastText: '#0a0f1a',
  },
  secondary: {
    main: '#90a4ae',
    light: '#c1d5e0',
    dark: '#62757f',
    contrastText: '#0a0f1a',
  },
  background: {
    default: '#0f1620',
    paper: '#161f2c',
  },
  divider: '#263241',
};
