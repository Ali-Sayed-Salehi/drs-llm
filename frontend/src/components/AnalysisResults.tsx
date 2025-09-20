// src/components/AnalysisResults.tsx
import { Card, Stack, Group, Text, Title, Divider, Badge, Box, Skeleton } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import type { PredictResponse } from '../types';

type Props = {
  results?: PredictResponse[] | null;
  title?: string;
  showDivider?: boolean;
  explanations?: (string | undefined)[];
  explainLoading?: boolean;                // optional: show skeleton while CLM is running
};

export default function AnalysisResults({
  results,
  title = 'Analysis Results',
  showDivider = true,
  explanations = [],
  explainLoading = false,
}: Props) {
  const { isDarkMode } = useTheme();
  const arr = Array.isArray(results) ? results : [];
  if (arr.length === 0) return null;

  return (
    <>
      {showDivider && <Divider my="lg" style={{ borderColor: '#e2e8f0' }} />}
      <Box>
        <Group gap="sm" mb="lg">
          <IconBrain size={20} color="#3b82f6" />
          <Title order={4} style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563', fontWeight: 600 }}>
            {title}
          </Title>
        </Group>

        <Stack gap="md">
          {arr.map((r, i) => {
            const explanation = explanations[i];

            return (
              <Card
                key={i}
                withBorder
                radius="lg"
                shadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                style={{
                  backgroundColor: isDarkMode ? '#1e293b' : 'white',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                }}
              >
                <Stack gap="md">
                  {/* Header row */}
                  <Group justify="space-between">
                    <Badge variant="light" color="blue" style={{ fontWeight: 500 }}>
                      Item #{i + 1}
                    </Badge>
                  </Group>

                  {/* Classification summary */}
                  <Group gap="lg">
                    <Box>
                      <Text size="sm" style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563' }} mb={4}>
                        Risk Level
                      </Text>
                      <Badge
                        color={r.label === 'POSITIVE' ? 'red' : 'green'}
                        size="md"
                        variant="light"
                        style={{ fontWeight: 600, padding: '0.4rem 0.8rem' }}
                      >
                        {r.label === 'POSITIVE' ? 'High Risk' : 'Low Risk'}
                      </Badge>
                    </Box>

                    <Box>
                      <Text size="sm" style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563' }} mb={4}>
                        Confidence
                      </Text>
                      <Text fw={700} size="md" style={{ color: isDarkMode ? '#f8fafc' : '#1f2937' }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </Text>
                    </Box>
                  </Group>

                  {/* Explanation */}
                  {(explainLoading || explanation) && (
                    <Box>
                      <Text
                        size="sm"
                        mb={8}
                        style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563', fontWeight: 600 }}
                      >
                        Explanation
                      </Text>

                      {explainLoading && !explanation ? (
                        <Skeleton
                          height={72}
                          radius="md"
                          style={{
                            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                            border: `1px dashed ${isDarkMode ? '#334155' : '#cbd5e1'}`,
                          }}
                        />
                      ) : (
                        <Box
                          p="md"
                          style={{
                            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                            border: `1px dashed ${isDarkMode ? '#334155' : '#cbd5e1'}`,
                            borderRadius: 8,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                            fontSize: '0.9rem',
                            color: isDarkMode ? '#e5e7eb' : '#1f2937',
                          }}
                        >
                          {explanation}
                        </Box>
                      )}
                    </Box>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </>
  );
}
