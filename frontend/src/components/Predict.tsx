// src/components/Predict.tsx
import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  Divider,
  ActionIcon,
  Title,
  ScrollArea,
  Badge,
  Box,
} from '@mantine/core';
import { IconTrash, IconPlus, IconBrain, IconCode, IconMessage } from '@tabler/icons-react';
import { usePredict } from '../hooks/usePredict';
import { usePredictBatch } from '../hooks/usePredictBatch';
import type { PredictRequest } from '../types';
import CONSTANTS from '../constants';
import { useTheme } from '../contexts/ThemeContext';

type Item = { id: string; commit_message: string; code_diff: string };

export default function Predict() {
  const { isDarkMode } = useTheme();

  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), commit_message: CONSTANTS.DEFAULT_COMMIT_1, code_diff: CONSTANTS.DEFAULT_DIFF_1 },
    { id: crypto.randomUUID(), commit_message: CONSTANTS.DEFAULT_COMMIT_2, code_diff: CONSTANTS.DEFAULT_DIFF_2 },
  ]);

  const {
    data: sData,
    isPending: sPending,
    isError: sIsError,
    error: sError,
    mutate: sMutate,
  } = usePredict();

  const {
    data: bData,
    isPending: bPending,
    isError: bIsError,
    error: bError,
    mutate: bMutate,
  } = usePredictBatch();

  const isBatch = items.length > 1;

  const activePending = isBatch ? bPending : sPending;
  const activeIsError = isBatch ? bIsError : sIsError;
  const activeError = (isBatch ? bError : sError) as Error | undefined;

  const results = useMemo(() => {
    if (isBatch) return Array.isArray(bData) ? bData : [];
    return sData ? [sData] : [];
  }, [isBatch, bData, sData]);

  const addItem = () =>
    setItems((xs) => [...xs, { id: crypto.randomUUID(), commit_message: '', code_diff: '' }]);

  const removeItem = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));

  const update = (id: string, field: keyof PredictRequest, v: string) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, [field]: v } : x)));

  const submit = () => {
    if (items.length === 0) return;
    if (isBatch) {
      const payload = items.map(({ commit_message, code_diff }) => ({ commit_message, code_diff }));
      bMutate(payload);
    } else {
      const { commit_message, code_diff } = items[0];
      sMutate({ commit_message, code_diff });
    }
  };

  return (
    <Stack gap="xl">
      {/* Header Section */}
      <Group justify="space-between" align="center">
        <Box>
          <Title order={3} style={{color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>
            {isBatch ? 'Batch Analysis' : 'Single Analysis'}
          </Title>
          <Text size="sm" c="gray.6">
            {isBatch ? 'Analyze multiple code changes at once' : 'Analyze a single code change'}
          </Text>
        </Box>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={addItem}
          style={{
            fontWeight: 500,
            borderColor: isDarkMode ? '#475569' : '#cbd5e1',
            backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
            color: isDarkMode ? '#cbd5e1' : '#475569',
          }}
        >
          Add Item
        </Button>
      </Group>

      {/* Items Section */}
      <ScrollArea.Autosize mah={600}>
        <Stack gap="lg">
          {items.map((it, i) => (
            <Card
              key={it.id}
              withBorder
              radius="lg"
              shadow="0 2px 4px rgba(0, 0, 0, 0.05)"
              style={{
                backgroundColor: isDarkMode ? '#1e293b' : '#fafbfc',
                border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
              }}
            >
              <Stack gap="lg">
                <Group justify="space-between" mb="xs">
                  <Group gap="sm">
                    <Badge variant="light" color="blue" style={{ fontWeight: 500 }}>
                      Item #{i + 1}
                    </Badge>
                  </Group>
                  {items.length > 1 && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => removeItem(it.id)}
                      aria-label="Remove item"
                      style={{
                        border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                        borderRadius: '6px',
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>

                <Stack gap="lg">
                  <Box>
                    <Group gap="sm" mb="sm">
                      <IconMessage size={18} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
                      <Text
                        fw={600}
                        size="sm"
                        style={{ color: isDarkMode ? '#e5e7eb' : '#374151', letterSpacing: '0.2px' }}
                      >
                        Commit Message
                      </Text>
                    </Group>
                    <Textarea
                      placeholder="Enter commit message..."
                      autosize
                      minRows={2}
                      maxRows={4}
                      value={it.commit_message}
                      onChange={(e) => update(it.id, 'commit_message', e.currentTarget.value)}
                      styles={{
                        input: {
                          backgroundColor: isDarkMode ? '#0f172a' : 'white',
                          color: isDarkMode ? '#f1f5f9' : '#1f2937',
                          borderColor: isDarkMode ? '#475569' : '#d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          '&::placeholder': {
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                          },
                          '&:focus': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.25)',
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Group gap="sm" mb="sm">
                      <IconCode size={18} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
                      <Text
                        fw={600}
                        size="sm"
                        style={{ color: isDarkMode ? '#e5e7eb' : '#374151', letterSpacing: '0.2px' }}
                      >
                        Code Changes
                      </Text>
                    </Group>
                    <Textarea
                      placeholder="Paste unified diff..."
                      autosize
                      minRows={6}
                      maxRows={12}
                      value={it.code_diff}
                      onChange={(e) => update(it.id, 'code_diff', e.currentTarget.value)}
                      styles={{
                        input: {
                          backgroundColor: isDarkMode ? '#0f172a' : 'white',
                          color: isDarkMode ? '#f1f5f9' : '#1f2937',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                          borderColor: isDarkMode ? '#475569' : '#d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          '&::placeholder': {
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                          },
                          '&:focus': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.25)',
                          },
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      {/* Action Section */}
      <Group gap="md" align="flex-start">
        <Button
          leftSection={<IconBrain size={18} />}
          onClick={submit}
          loading={activePending}
          disabled={items.length === 0}
          size="lg"
          style={{
            fontWeight: 600,
            padding: '0.75rem 2rem',
          }}
        >
          {activePending
            ? 'Analyzing...'
            : isBatch
            ? `Analyze ${items.length} Items`
            : 'Analyze Risk'}
        </Button>

        {activePending && (
          <Box
            p="md"
            style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
            }}
          >
            <Text size="sm" style={{ color: '#0369a1' }}>
              {isBatch ? `Processing ${items.length} items...` : 'Processing 1 item...'}
            </Text>
          </Box>
        )}

        {activeIsError && (
          <Box
            p="md"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
            }}
          >
            <Text size="sm" style={{ color: '#dc2626' }}>
              {activeError?.message}
            </Text>
          </Box>
        )}
      </Group>

      {/* Results Section */}
      {Array.isArray(results) && results.length > 0 && (
        <>
          <Divider my="lg" style={{ borderColor: '#e2e8f0' }} />
          <Box>
            <Group gap="sm" mb="lg">
              <IconBrain size={20} color="#3b82f6" />
              <Title order={4} style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563', fontWeight: 600 }}>
                Analysis Results
              </Title>
            </Group>
            <Stack gap="md">
              {results.map((r, i) => (
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
                    <Group justify="space-between">
                      <Badge variant="light" color="blue" style={{ fontWeight: 500 }}>
                        Item #{i + 1}
                      </Badge>
                    </Group>
                    <Group gap="lg">
                      <Box>
                        <Text
                          size="sm"
                          style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563' }}
                          mb={4}
                        >
                          Risk Level
                        </Text>
                        <Badge
                          color={r.label === 'POSITIVE' ? 'red' : 'green'}
                          size="md"
                          variant="light"
                          style={{
                            fontWeight: 600,
                            padding: '0.4rem 0.8rem',
                          }}
                        >
                          {r.label === 'POSITIVE' ? 'High Risk' : 'Low Risk'}
                        </Badge>
                      </Box>
                      <Box>
                        <Text
                          size="sm"
                          style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563' }}
                          mb={4}
                        >
                          Confidence
                        </Text>
                        <Text
                          fw={700}
                          size="md"
                          style={{ color: isDarkMode ? '#f8fafc' : '#1f2937' }}
                        >
                          {(r.confidence * 100).toFixed(1)}%
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
