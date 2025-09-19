// src/components/PredictButton.tsx
import { Button, Group, Box, Text } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';

type Props = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  idleLabel: string;        // e.g., "Analyze Risk"
  loadingLabel?: string;    // default "Analyzing..."
  pendingMessage?: string;  // shown while loading
  errorMessage?: string;    // shown when not loading
  size?: 'md' | 'lg';       // default 'lg'
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
}: Props) {
  return (
    <Group gap="md" align="flex-start">
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

      {loading && pendingMessage && (
        <Box
          p="md"
          style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
          }}
        >
          <Text size="sm" style={{ color: '#0369a1' }}>
            {pendingMessage}
          </Text>
        </Box>
      )}

      {!loading && errorMessage && (
        <Box
          p="md"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
          }}
        >
          <Text size="sm" style={{ color: '#dc2626' }}>
            {errorMessage}
          </Text>
        </Box>
      )}
    </Group>
  );
}
