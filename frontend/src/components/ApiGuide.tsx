// src/components/ApiGuide.tsx
import { Paper, Stack, Title, Text, Code } from '@mantine/core';
import { useTheme } from '../contexts/ThemeContext';

export default function ApiGuide() {
  const { isDarkMode } = useTheme();

  const cardStyle = {
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  } as const;

  const titleColor = isDarkMode ? '#f1f5f9' : '#0f172a'; // very light / very dark
  const textColor  = isDarkMode ? '#e5e7eb' : '#1f2937'; // light gray / slate-800
  const codeBg     = isDarkMode ? '#0b1220' : '#f8fafc';
  const codeBorder = isDarkMode ? '#233041' : '#e5e7eb';
  const codeColor  = isDarkMode ? '#e5e7eb' : '#0f172a';

  const TitleEl = ({ children }: { children: React.ReactNode }) => (
    <Title order={4} mb="xs" style={{ color: titleColor }}>{children}</Title>
  );

  const TextEl = ({ children }: { children: React.ReactNode }) => (
    <Text size="sm" mb="xs" style={{ color: textColor }}>{children}</Text>
  );

  const CodeBlock = ({ children }: { children: string }) => (
    <Code
      block
      style={{
        backgroundColor: codeBg,
        color: codeColor,
        border: `1px solid ${codeBorder}`,
        borderRadius: 8,
        padding: '10px 12px',
        lineHeight: 1.4,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </Code>
  );

  return (
    <Stack gap="lg">
      <Paper p="lg" radius="lg" withBorder style={cardStyle}>
        <TitleEl>GET /health</TitleEl>
        <TextEl>Health check.</TextEl>
        <CodeBlock>{`curl -sS http://worldofcode.org/drs-api/health`}</CodeBlock>
      </Paper>

      <Paper p="lg" radius="lg" withBorder style={cardStyle}>
        <TitleEl>POST /seq-cls/predict</TitleEl>
        <TextEl>JSON in, JSON out.</TextEl>
        <CodeBlock>{`curl -sS -X POST http://worldofcode.org/drs-api/seq-cls/predict \\
  -H "Content-Type: application/json" \\
  -d '{"diff":"diff --git ...","commit_message":"Fix NPE"}'`}</CodeBlock>
      </Paper>

      <Paper p="lg" radius="lg" withBorder style={cardStyle}>
        <TitleEl>POST /seq-cls/predict_batch</TitleEl>
        <TextEl>Array of requests → array of responses.</TextEl>
        <CodeBlock>{`curl -sS -X POST http://worldofcode.org/drs-api/seq-cls/predict_batch \\
  -H "Content-Type: application/json" \\
  -d '[{"diff":"...","commit_message":"..."},{"diff":"...","commit_message":"..."}]'`}</CodeBlock>
      </Paper>

      <Paper p="lg" radius="lg" withBorder style={cardStyle}>
        <TitleEl>POST /seq-cls/predict_by_sha</TitleEl>
        <TextEl>Look up by repo + commit SHA.</TextEl>
        <CodeBlock>{`curl -sS -X POST http://worldofcode.org/drs-api/seq-cls/predict_by_sha \\
  -H "Content-Type: application/json" \\
  -d '{"owner_repo":"facebook/react","commit_sha":"abc123..."}'`}</CodeBlock>
      </Paper>

      <Paper p="lg" radius="lg" withBorder style={cardStyle}>
        <TitleEl>POST /clm/predict</TitleEl>
        <TextEl>JSON in, raw text out.</TextEl>
        <CodeBlock>{`curl -sS -X POST http://worldofcode.org/drs-api/clm/predict \\
  -H "Content-Type: application/json" \\
  -d '{"diff":"...","commit_message":"..."}'`}</CodeBlock>
      </Paper>

      <Paper p="lg" radius="lg" withBorder style={cardStyle}>
        <TitleEl>POST /clm/predict_by_sha</TitleEl>
        <TextEl>Raw text by repo + commit SHA.</TextEl>
        <CodeBlock>{`curl -sS -X POST http://worldofcode.org/drs-api/clm/predict_by_sha \\
  -H "Content-Type: application/json" \\
  -d '{"owner_repo":"facebook/react","commit_sha":"abc123..."}'`}</CodeBlock>
      </Paper>
    </Stack>
  );
}
