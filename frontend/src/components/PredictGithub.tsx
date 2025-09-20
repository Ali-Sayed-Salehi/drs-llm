// src/components/PredictGithub.tsx
import { useState } from 'react';
import { Card, Group, Stack, Text, Title, Box, TextInput } from '@mantine/core';
import { IconBrandGithub, IconHash } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import type { PredictResponse } from '../types';
import AnalysisResults from './AnalysisResults';
import PredictButton from './PredictButton';
import CONSTANTS from '../constants';

export default function PredictGithub() {
  const { isDarkMode } = useTheme();

  const [repo, setRepo] = useState(CONSTANTS.OWNER_REPO_1);
  const [sha, setSha] = useState(CONSTANTS.COMMIT_SHA_1);

  const [withExplanation, setWithExplanation] = useState(false);
  const [explanation, setExplanation] = useState<string | undefined>();
  const [isExplaining, setIsExplaining] = useState(false);

  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [result, setResult] = useState<PredictResponse | undefined>();

  const canSubmit = Boolean(repo.trim() && sha.trim());

  const onSubmit = async () => {
    if (!canSubmit) return;
    setPending(true);
    setError(undefined);
    setResult(undefined);
    setExplanation(undefined);
    setIsExplaining(false);

    try {
      const r = await api.predictBySha({ repo: repo.trim(), sha: sha.trim() });
      setResult(r);

      if (withExplanation) {
        setIsExplaining(true);
        const txt = await api.clmPredictBySha({ repo: repo.trim(), sha: sha.trim() });
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
          Fetch commit from GitHub and analyze the risk
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
          {/* Repo */}
          <Box>
            <Group gap="sm" mb="sm">
              <IconBrandGithub size={18} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
              <Text fw={600} size="sm" style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                Repository (owner/repo)
              </Text>
            </Group>
            <TextInput
              placeholder="e.g., facebook/react"
              value={repo}
              onChange={(e) => setRepo(e.currentTarget.value)}
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

          {/* SHA */}
          <Box>
            <Group gap="sm" mb="sm">
              <IconHash size={18} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
              <Text fw={600} size="sm" style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                Commit SHA
              </Text>
            </Group>
            <TextInput
              placeholder="e.g., 16ff29d2780784ce51f5e66edf08cee9785444cc"
              value={sha}
              onChange={(e) => setSha(e.currentTarget.value)}
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
