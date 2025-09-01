// src/theme.ts
import type { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  // Use Concordia University dark red as the brand color
  primaryColor: 'red',
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: 'lg',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  headings: { 
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: 600
  },

  // Concordia University dark red palette
  colors: {
    red: [
      '#fef2f2', // 0
      '#fee2e2', // 1
      '#fecaca', // 2
      '#fca5a5', // 3
      '#f87171', // 4
      '#ef4444', // 5 (base)
      '#dc2626', // 6
      '#b91c1c', // 7
      '#991b1b', // 8
      '#7f1d1d', // 9
    ],
  },

  components: {
    Button: {
      defaultProps: { 
        variant: 'filled',
        color: 'red',
        size: 'md'
      },
      styles: {
        root: {
          fontWeight: 500,
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          backgroundColor: '#800020',
          borderColor: '#800020',
          '&:hover': {
            backgroundColor: '#5D001E',
            borderColor: '#5D001E'
          }
        }
      }
    },
    Tabs: {
      defaultProps: { color: 'red' },
      styles: {
        tab: {
          fontWeight: 500,
          fontSize: '0.95rem',
          transition: 'all 0.2s ease',
          '&[data-active]': {
            color: '#800020',
            borderColor: '#800020'
          }
        }
      }
    },
    Badge: {
      defaultProps: { radius: 'md' },
      styles: {
        root: {
          fontWeight: 500,
          fontSize: '0.875rem'
        }
      }
    },
    Card: {
      defaultProps: { 
        withBorder: true,
        radius: 'lg',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      },
    },
    Paper: {
      defaultProps: { 
        withBorder: true,
        radius: 'lg',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md'
      },
      styles: {
        input: {
          borderColor: '#e2e8f0',
          '&:focus': {
            borderColor: '#A51C30'
          }
        }
      }
    },
    Textarea: {
      defaultProps: {
        radius: 'md'
      },
      styles: {
        input: {
          borderColor: '#e2e8f0',
          '&:focus': {
            borderColor: '#A51C30'
          }
        }
      }
    },
    Select: {
      defaultProps: {
        radius: 'md'
      },
      styles: {
        input: {
          borderColor: '#e2e8f0',
          '&:focus': {
            borderColor: '#A51C30'
          }
        }
      }
    }
  },
};
