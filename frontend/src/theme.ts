// src/theme.ts
import type { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  // Use a professional blue as the brand color
  primaryColor: 'blue',
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: 'lg',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  headings: { 
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: 600
  },

  // Professional blue palette
  colors: {
    blue: [
      '#eff6ff', // 0
      '#dbeafe', // 1
      '#bfdbfe', // 2
      '#93c5fd', // 3
      '#60a5fa', // 4
      '#3b82f6', // 5 (base)
      '#2563eb', // 6
      '#1d4ed8', // 7
      '#1e40af', // 8
      '#1e3a8a', // 9
    ],
  },

  components: {
    Button: {
      defaultProps: { 
        variant: 'filled',
        color: 'blue',
        size: 'md'
      },
      styles: {
        root: {
          fontWeight: 500,
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }
      }
    },
    Tabs: {
      defaultProps: { color: 'blue' },
      styles: {
        tab: {
          fontWeight: 500,
          fontSize: '0.95rem',
          transition: 'all 0.2s ease'
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
            borderColor: '#3b82f6'
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
            borderColor: '#3b82f6'
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
            borderColor: '#3b82f6'
          }
        }
      }
    },
    ActionIcon: {
      styles: {
        root: {
          transition: 'all 0.2s ease'
        }
      }
    }
  },
};
