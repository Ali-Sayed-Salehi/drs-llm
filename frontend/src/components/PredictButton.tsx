// src/components/PredictButton.tsx
import { Button, Group, Box, Text, Checkbox } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  idleLabel: string;
  loadingLabel?: string;
  pendingMessage?: string;
  errorMessage?: string;
  size?: 'md' | 'lg';

  // CLM toggle
  showExplainToggle?: boolean;
  explainChecked?: boolean;
  onExplainChange?: (checked: boolean) => void;
  explainLabel?: string;
};

export default function PredictButton({
  onClick,
  loading = false,
  disabled = false,
  idleLabel,
  loadingLabel = 'Analyzing...',
  pendingMessage,
  errorMessage,
  size = 'lg',
  showExplainToggle = false,
  explainChecked = false,
  onExplainChange,
  explainLabel = 'Explain with CLM',
}: Props) {
  const { isDarkMode } = useTheme();

  return (
    // Center-align so the checkbox sits at the same vertical middle as the button
    <Group gap="md" align="center">
      <Button
        leftSection={<IconBrain size={18} />}
        onClick={onClick}
        loading={loading}
        disabled={disabled}
        size={size}
        style={{ fontWeight: 600, padding: size === 'lg' ? '0.75rem 2rem' : '0.6rem 1.5rem' }}
      >
        {loading ? loadingLabel : idleLabel}
      </Button>

      {showExplainToggle && (
        <Checkbox
          label={explainLabel}
          checked={explainChecked}
          onChange={(e) => onExplainChange?.(e.currentTarget.checked)}
          styles={{
            root: { alignSelf: 'center' },
            body: { display: 'flex', alignItems: 'center' },
            label: {
              color: isDarkMode ? '#e5e7eb' : '#1f2937', // brighter in dark mode
              fontWeight: 600,
              lineHeight: 1,
            },
          }}
        />
      )}

      {loading && pendingMessage && (
        <Box p="md" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8 }}>
          <Text size="sm" style={{ color: '#0369a1' }}>
            {pendingMessage}
          </Text>
        </Box>
      )}

      {!loading && errorMessage && (
        <Box p="md" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
          <Text size="sm" style={{ color: '#dc2626' }}>
            {errorMessage}
          </Text>
        </Box>
      )}
    </Group>
  );
}
