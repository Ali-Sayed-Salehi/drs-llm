// src/components/ThemeToggle.tsx
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Tooltip label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <ActionIcon
        variant="light"
        size="xl"
        onClick={toggleTheme}
        style={{
          border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
          borderRadius: '12px',
          color: isDarkMode ? '#fbbf24' : '#64748b',
          backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
          width: '48px',
          height: '48px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
            transform: 'scale(1.05)',
            boxShadow: '0 6px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        {isDarkMode ? <IconSun size={22} /> : <IconMoon size={22} />}
      </ActionIcon>
    </Tooltip>
  );
}
