// src/components/PredictGithub.tsx
import { useMemo, useState } from 'react';
import { Card, Group, Stack, Text, Title, Box, TextInput } from '@mantine/core';
import { IconBrandGithub, IconLink } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import type { PredictResponse } from '../types';
import AnalysisResults from './AnalysisResults';
import PredictButton from './PredictButton';
import CONSTANTS from '../constants';

/** Parse GitHub commit URL → { repo: "owner/repo", sha }.
 * Supports:
 *   - https://github.com/{owner}/{repo}/commit/{sha}
 *   - https://github.com/{owner}/{repo}/pull/{n}/commits/{sha}
 * Also accepts protocol-less inputs starting with "github.com/...".
 */
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

  // /owner/repo/commit/<sha>
  const m1 = path.match(/^\/([^/]+)\/([^/]+)\/commit\/([0-9a-fA-F]{7,40})$/);
  if (m1) {
    const [, owner, repo, sha] = m1;
    return { repo: `${owner}/${repo}`, sha };
  }

  // /owner/repo/pull/<n>/commits/<sha>
  const m2 = path.match(/^\/([^/]+)\/([^/]+)\/pull\/\d+\/commits\/([0-9a-fA-F]{7,40})$/);
  if (m2) {
    const [, owner, repo, sha] = m2;
    return { repo: `${owner}/${repo}`, sha };
  }

  return null;
}

export default function PredictGithub() {
  const { isDarkMode } = useTheme();

  // Prefill with existing constants as a valid sample commit URL
  const [commitUrl, setCommitUrl] = useState(
    `https://github.com/${CONSTANTS.OWNER_REPO_1}/commit/${CONSTANTS.COMMIT_SHA_1}`
  );

  const [withExplanation, setWithExplanation] = useState(false);
  const [explanation, setExplanation] = useState<string | undefined>();
  const [isExplaining, setIsExplaining] = useState(false);

  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  // Attach repo/sha so AnalysisResults can render a GitHub URL if it supports it
  const [result, setResult] = useState<(PredictResponse & { repo?: string; sha?: string }) | undefined>();

  const parsed = useMemo(() => parseCommitUrl(commitUrl), [commitUrl]);
  const canSubmit = Boolean(parsed);

  const onSubmit = async () => {
    if (!parsed) return;

    setPending(true);
    setError(undefined);
    setResult(undefined);
    setExplanation(undefined);
    setIsExplaining(false);

    const { repo, sha } = parsed;

    try {
      const r = await api.predictBySha({ repo, sha });
      setResult({ ...r, repo, sha });

      if (withExplanation) {
        setIsExplaining(true);
        const txt = await api.clmPredictBySha({ repo, sha });
        setExplanation(txt);
        setIsExplaining(false);
      }
    } catch (e) {
      setError(e as Error);
      setIsExplaining(false);
    } finally {
      setPending(false);
    }
  };

  const urlHelp =
    commitUrl && !parsed
      ? 'Expected: https://github.com/<owner>/<repo>/commit/<sha> or /pull/<n>/commits/<sha>'
      : undefined;

  return (
    <Stack gap="xl">
      {/* Header */}
      <Box>
        <Title
          order={3}
          style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600, marginBottom: '0.5rem' }}
        >
          GitHub Commit Analysis
        </Title>
        <Text size="sm" c="gray.6">
          Paste a GitHub commit URL to fetch the diff and analyze the risk
        </Text>
      </Box>

      {/* Form */}
      <Card
        withBorder
        radius="lg"
        shadow="0 2px 4px rgba(0, 0, 0, 0.05)"
        style={{
          backgroundColor: isDarkMode ? '#1e293b' : '#fafbfc',
          border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
        }}
      >
        <Stack gap="lg">
          {/* Commit URL */}
          <Box>
            <Group gap="sm" mb="sm">
              <IconBrandGithub size={18} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
              <Text fw={600} size="sm" style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                Commit URL
              </Text>
            </Group>
            <TextInput
              leftSection={<IconLink size={16} />}
              placeholder="e.g., https://github.com/facebook/react/commit/16ff29d2...  or  https://github.com/owner/repo/pull/123/commits/abcd1234"
              value={commitUrl}
              onChange={(e) => setCommitUrl(e.currentTarget.value)}
              error={urlHelp}
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
          </Box>

          {/* Analyze row: button + integrated checkbox */}
          <PredictButton
            onClick={onSubmit}
            loading={isPending || (withExplanation && isExplaining)}
            disabled={!canSubmit}
            idleLabel="Analyze GitHub Commit"
            loadingLabel={withExplanation ? 'Analyzing + Explaining...' : 'Analyzing...'}
            pendingMessage={
              withExplanation
                ? 'Fetching commit, analyzing, and generating explanation...'
                : 'Fetching commit & Analyzing...'
            }
            errorMessage={error?.message}
            size="md"
            showExplainToggle
            explainChecked={withExplanation}
            onExplainChange={setWithExplanation}
            explainLabel="Explain with CLM"
          />
        </Stack>
      </Card>

      {/* Results + (inline) explanation */}
      <AnalysisResults
        results={result ? [result] : []}
        explanations={explanation ? [explanation] : []}
        explainLoading={withExplanation && isExplaining && !explanation}
        title="Analysis Result"
      />
    </Stack>
  );
}
