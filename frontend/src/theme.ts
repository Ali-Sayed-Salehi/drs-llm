// src/theme.ts
import type { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  // Use a deeper red as the brand color
  primaryColor: 'red',
  primaryShade: { light: 6, dark: 8 }, // a bit darker in dark mode
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  headings: { fontFamily: 'inherit' },

  // OPTIONAL: tweak the red palette slightly toward a deeper crimson
  colors: {
    red: [
      '#fff1f1', // 0
      '#ffd6d6', // 1
      '#ffb3b3', // 2
      '#ff8a8a', // 3
      '#ff5e5e', // 4
      '#f43f3f', // 5 (base)
      '#dc2626', // 6
      '#b91c1c', // 7
      '#991b1b', // 8  <-- primaryShade in dark
      '#7f1d1d', // 9
    ],
  },

  components: {
    Button: {
      defaultProps: { variant: 'filled' },
    },
    Tabs: {
      defaultProps: { color: 'red' },
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
