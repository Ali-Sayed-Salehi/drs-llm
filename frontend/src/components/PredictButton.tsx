// src/components/PredictButton.tsx
import { Button, Group, Checkbox, Text, Stack, Box } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import React from 'react';

type Props = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  idleLabel?: string;
  loadingLabel?: string;
  pendingMessage?: string;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';

  // Explainability toggle
  showExplainToggle?: boolean;
  explainChecked?: boolean;
  onExplainChange?: (v: boolean) => void;
  explainLabel?: string; // e.g. "Explain with CLM"
};

export default function PredictButton({
  onClick,
  loading,
  disabled,
  idleLabel = 'Analyze',
  loadingLabel = 'Analyzing...',
  pendingMessage,
  errorMessage,
  size = 'md',
  showExplainToggle,
  explainChecked = false,
  onExplainChange,
  explainLabel = 'Explain with CLM',
}: Props) {
  const { isDarkMode } = useTheme();
  const buttonBg = isDarkMode ? '#2563eb' : '#3b82f6';

  // stable id to associate the label with the checkbox
  const checkboxId = React.useId();

  // Colors for texts
  const labelColor = isDarkMode ? '#e5e7eb' : '#374151';
  const hintColor = isDarkMode ? '#cbd5e1' : '#4b5563';

  return (
    <Stack gap="xs">
      {/* Row 1: Analyze button + custom checkbox block */}
      <Group align="center" gap={40} wrap="wrap">
        <Button
          size={size}
          radius="lg" // less pill-like, still elegant
          leftSection={<IconSparkles size={16} />}
          loading={!!loading}
          disabled={disabled}
          onClick={onClick}
          variant="filled"
          styles={{
            root: {
              fontWeight: 700,
              paddingInline: size === 'lg' ? 20 : size === 'sm' ? 14 : 16,
              backgroundColor: buttonBg,
              boxShadow: isDarkMode
                ? '0 1px 2px rgba(0,0,0,0.35)'
                : '0 1px 2px rgba(0,0,0,0.12)',
            },
          }}
        >
          {loading ? loadingLabel : idleLabel}
        </Button>

        {showExplainToggle && (
          // Center this whole block vertically relative to the button
          <Box style={{ alignSelf: 'center' }}>
            {/* Use a native label so clicking text toggles the checkbox */}
            <label
              htmlFor={checkboxId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {/* Checkbox without Mantine label/description; we control the text layout */}
              <Checkbox
                id={checkboxId}
                color="blue"
                checked={Boolean(explainChecked)}
                onChange={(e) => onExplainChange?.(e.currentTarget.checked)}
                size="md"
                styles={{
                  root: { margin: 0 }, // remove default margins
                  input: {
                    borderColor: isDarkMode ? '#64748b' : '#cbd5e1',
                    '&:hover': { borderColor: isDarkMode ? '#7c8aa2' : '#94a3b8' },
                    '&[dataChecked]': {
                      backgroundColor: buttonBg,
                      borderColor: buttonBg,
                    },
                  },
                  icon: { color: 'white' },
                }}
              />

              {/* Text block: label (top) + hint (under) */}
              <Box style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Text
                  size="sm"
                  fw={600}
                  style={{ color: labelColor, lineHeight: 1 }}
                >
                  {explainLabel}
                </Text>
                <Text size="sm" style={{ color: hintColor }}>
                  (experimental) Explainability only works on small diffs
                </Text>
              </Box>
            </label>
          </Box>
        )}
      </Group>

      {/* Row 2: Status text (left-aligned under the whole row) */}
      {pendingMessage && loading && (
        <Text size="sm" c={isDarkMode ? 'gray.4' : 'gray.6'}>
          {pendingMessage}
        </Text>
      )}
      {errorMessage && !loading && (
        <Text size="sm" c="red.6">
          {errorMessage}
        </Text>
      )}
    </Stack>
  );
}
