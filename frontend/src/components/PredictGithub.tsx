// src/components/PredictGithub.tsx
import { useMemo, useState } from 'react';
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Box,
  TextInput,
  ActionIcon,
  Badge,
  Button,
  ScrollArea,
} from '@mantine/core';
import { IconBrandGithub, IconLink, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import type { PredictResponse } from '../types';
import AnalysisResults from './AnalysisResults';
import PredictButton from './PredictButton';
import CONSTANTS from '../constants';

type Item = { id: string; url: string };

function parseCommitUrl(input: string): { repo: string; sha: string } | null {
  let raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith('github.com/')) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.hostname !== 'github.com') return null;

  const path = url.pathname.replace(/\/+$/, '');

  const m1 = path.match(/^\/([^/]+)\/([^/]+)\/commit\/([0-9a-fA-F]{7,40})$/);
  if (m1) {
    const [, owner, repo, sha] = m1;
    return { repo: `${owner}/${repo}`, sha };
  }
  const m2 = path.match(/^\/([^/]+)\/([^/]+)\/pull\/\d+\/commits\/([0-9a-fA-F]{7,40})$/);
  if (m2) {
    const [, owner, repo, sha] = m2;
    return { repo: `${owner}/${repo}`, sha };
  }
  return null;
}

export default function PredictGithub() {
  const { isDarkMode } = useTheme();

  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), url: `https://github.com/${CONSTANTS.OWNER_REPO_1}/commit/${CONSTANTS.COMMIT_SHA_1}` },
  ]);

  const [withExplanation, setWithExplanation] = useState(false);
  const [explanations, setExplanations] = useState<string[] | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [results, setResults] = useState<Array<PredictResponse & { repo?: string; sha?: string }>>([]);

  const isBatch = items.length > 1;

  const addItem = () => setItems((xs) => [...xs, { id: crypto.randomUUID(), url: '' }]);
  const removeItem = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));
  const updateUrl = (id: string, v: string) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, url: v } : x)));

  const parsedAll = useMemo(() => items.map((it) => parseCommitUrl(it.url)), [items]);
  const canSubmit = parsedAll.every((p) => p !== null) && items.length > 0;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setPending(true);
    setError(undefined);
    setResults([]);
    setExplanations(null);
    setIsExplaining(false);

    const parsedPairs = parsedAll as Array<{ repo: string; sha: string }>;
    try {
      const preds = await Promise.all(
        parsedPairs.map(({ repo, sha }) => api.predictBySha({ repo, sha }).then((r) => ({ ...r, repo, sha })))
      );
      setResults(preds);

      if (withExplanation) {
        setIsExplaining(true);
        try {
          const texts = await Promise.all(parsedPairs.map(({ repo, sha }) => api.clmPredictBySha({ repo, sha })));
          setExplanations(texts);
        } finally {
          setIsExplaining(false);
        }
      }
    } catch (e) {
      setError(e as Error);
      setIsExplaining(false);
    } finally {
      setPending(false);
    }
  };

  const urlHelpFor = (val: string) =>
    !val.trim()
      ? undefined
      : parseCommitUrl(val)
      ? undefined
      : 'Expected: https://github.com/<owner>/<repo>/commit/<sha> or /pull/<n>/commits/<sha>';

  return (
    <Stack gap="xl">
      {/* Header + Add Item (top-right) */}
      <Group justify="space-between" align="center">
        <Box>
          <Title
            order={3}
            style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600, marginBottom: '0.5rem' }}
          >
            GitHub Commit Analysis
          </Title>
          <Text size="sm" c="gray.6">
            Paste one or more GitHub commit URLs to fetch their diffs and analyze risk
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

      {/* Items Section (cards) */}
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
              <Stack gap="md">
                {/* Header row inside the card */}
                <Group justify="space-between" mb="xs" align="center">
                  {/* Left: label "Commit URL" with icon */}
                  <Group gap="sm">
                    <IconBrandGithub size={16} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
                    <Text fw={600} size="sm" style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                      Commit URL
                    </Text>
                  </Group>

                  {/* Right: Item badge (top-right) + optional remove */}
                  <Group gap="xs">
                    <Badge variant="light" color="blue" style={{ fontWeight: 500 }}>
                      Item #{i + 1}
                    </Badge>
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
                </Group>

                {/* URL input */}
                <TextInput
                  leftSection={<IconLink size={16} />}
                  placeholder="e.g., https://github.com/owner/repo/pull/123/commits/abcd1234"
                  value={it.url}
                  onChange={(e) => updateUrl(it.id, e.currentTarget.value)}
                  error={urlHelpFor(it.url)}
                  styles={{
                    input: {
                      backgroundColor: isDarkMode ? '#0f172a' : 'white',
                      color: isDarkMode ? '#f1f5f9' : '#1f2937',
                      borderColor: isDarkMode ? '#475569' : '#d1d5db',
                      borderRadius: '8px',
                      '&::placeholder': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                      '&:focus': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59,130,246,.25)',
                      },
                    },
                  }}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      {/* Controls (OUTSIDE the cards; same as Manual tab) */}
      <PredictButton
        onClick={onSubmit}
        loading={isPending || (withExplanation && isExplaining)}
        disabled={!canSubmit}
        idleLabel={isBatch ? `Analyze ${items.length} Items` : 'Analyze'}
        loadingLabel={withExplanation ? 'Analyzing + Explaining...' : 'Analyzing...'}
        pendingMessage={
          isPending
            ? isBatch
              ? `Fetching ${items.length} commit(s)${withExplanation ? ' + generating explanations' : ''}...`
              : `Fetching 1 commit${withExplanation ? ' + generating explanation' : ''}...`
            : undefined
        }
        errorMessage={error?.message}
        size="md"
        showExplainToggle
        explainChecked={withExplanation}
        onExplainChange={setWithExplanation}
        explainLabel="Explain with CLM"
      />

      {/* Results */}
      <AnalysisResults
        results={results}
        explanations={withExplanation ? (explanations ?? []) : []}
        explainLoading={withExplanation && isExplaining}
        title={isBatch ? 'Batch Analysis Results' : 'Analysis Result'}
      />
    </Stack>
  );
}
