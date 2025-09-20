import { useState } from 'react';
import { Card, Group, Stack, Text, Title, Box, TextInput, Checkbox } from '@mantine/core';
import { IconBrandGithub, IconHash } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import type { PredictResponse } from '../types';
import AnalysisResults from './AnalysisResults';
import PredictButton from './PredictButton';

export default function PredictGithub() {
  const { isDarkMode } = useTheme();

  const [repo, setRepo] = useState('facebook/react');
  const [sha, setSha] = useState('16ff29d2780784ce51f5e66edf08cee9785444cc');

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
            />
          </Box>

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
            />
          </Box>

          <Group align="center" gap="lg">
            <PredictButton
              onClick={onSubmit}
              loading={isPending || (withExplanation && isExplaining)}
              disabled={!canSubmit}
              idleLabel="Analyze GitHub Commit"
              loadingLabel={withExplanation ? "Analyzing + Explaining..." : "Analyzing..."}
              pendingMessage={
                withExplanation
                  ? "Fetching commit, analyzing, and generating explanation..."
                  : "Fetching commit & Analyzing..."
              }
              errorMessage={error?.message}
              size="md"
            />
            <Checkbox
              label="Explain with CLM"
              checked={withExplanation}
              onChange={(e) => setWithExplanation(e.currentTarget.checked)}
            />
          </Group>
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
