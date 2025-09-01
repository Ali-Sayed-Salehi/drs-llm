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
        size="lg"
        onClick={toggleTheme}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          color: isDarkMode ? '#fbbf24' : '#64748b',
          backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
          '&:hover': {
            backgroundColor: isDarkMode ? '#334155' : '#f1f5f9'
          }
        }}
      >
        {isDarkMode ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
