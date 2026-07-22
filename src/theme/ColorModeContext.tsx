import { createContext, useContext } from 'react';
import type { ThemeMode } from './theme';

export interface ColorModeContextValue {
  mode: ThemeMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextValue | undefined>(
  undefined,
);

export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within an AppThemeProvider');
  }
  return context;
}
