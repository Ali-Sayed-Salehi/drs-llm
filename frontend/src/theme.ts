// src/theme.ts
import type { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  // Use a professional blue as the brand color
  primaryColor: 'blue',
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  headings: { fontFamily: 'inherit' },

  // Professional blue palette
  colors: {
    blue: [
      '#f0f9ff', // 0
      '#e0f2fe', // 1
      '#bae6fd', // 2
      '#7dd3fc', // 3
      '#38bdf8', // 4
      '#0ea5e9', // 5 (base)
      '#0284c7', // 6
      '#0369a1', // 7
      '#075985', // 8
      '#0c4a6e', // 9
    ],
  },

  components: {
    Button: {
      defaultProps: { 
        variant: 'filled',
        color: 'blue'
      },
    },
    Tabs: {
      defaultProps: { color: 'blue' },
    },
    Badge: {
      defaultProps: { radius: 'sm' },
    },
    Card: {
      defaultProps: { withBorder: true },
    },
    Paper: {
      defaultProps: { withBorder: true },
    },
  },
};
