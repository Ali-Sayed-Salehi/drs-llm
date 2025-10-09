// src/components/About.tsx
import { Paper, Stack, Title, Text, Anchor, List, ThemeIcon, AspectRatio } from '@mantine/core';
import { useTheme } from '../contexts/ThemeContext';
import { IconLink, IconMail } from '@tabler/icons-react';
import {
  WEBSITE_REPO_URL,
  FINETUNE_RESEARCH_URL,
  CONTACT_EMAIL,
  COLLAB_EMAILS,
  YOUTUBE_DEMO_URL,
} from '../constants';

export default function About() {
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#0f172a' : '#ffffff';
  const cardBorder = isDarkMode ? '#334155' : '#e2e8f0';

  const titleColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const textColor  = isDarkMode ? '#e5e7eb' : '#1f2937';
  const linkColor  = isDarkMode ? '#93c5fd' : '#1d4ed8';
  const linkHover  = isDarkMode ? '#bfdbfe' : '#2563eb';

  // Convert normal YT links to embed form if needed
  const toEmbed = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
      }
      if (u.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed${u.pathname}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <Paper
      p="lg"
      radius="lg"
      withBorder
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        color: textColor, // default text color for everything inside
      }}
    >
      <Stack gap="sm">
        <Title order={3} style={{ color: titleColor }}>About</Title>

        <Text size="sm">
          This project provides code-diff defect risk analysis and a CLM companion. Explore the source, research, and demo below.
        </Text>

        <List
          spacing="xs"
          withPadding
          icon={
            <ThemeIcon size={18} variant="light" color={isDarkMode ? 'blue' : 'indigo'} radius="xl">
              <IconLink size={14} />
            </ThemeIcon>
          }
        >
          <List.Item>
            <Anchor
              href={WEBSITE_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              style={{ color: linkColor }}
              onMouseEnter={(e) => (e.currentTarget.style.color = linkHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
            >
              DRS-LLM GitHub repository
            </Anchor>
          </List.Item>
          <List.Item>
            <Anchor
              href={FINETUNE_RESEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              style={{ color: linkColor }}
              onMouseEnter={(e) => (e.currentTarget.style.color = linkHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
            >
              LLaMA fine-tuning research
            </Anchor>
          </List.Item>
        </List>

        <List
          spacing="xs"
          withPadding
          icon={
            <ThemeIcon size={18} variant="light" color={isDarkMode ? 'blue' : 'indigo'} radius="xl">
              <IconMail size={14} />
            </ThemeIcon>
          }
        >
          <List.Item>
            Contact:{' '}
            <Anchor
              href={`mailto:${CONTACT_EMAIL}`}
              underline="hover"
              style={{ color: linkColor }}
              onMouseEnter={(e) => (e.currentTarget.style.color = linkHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
            >
              {CONTACT_EMAIL}
            </Anchor>
          </List.Item>
          {COLLAB_EMAILS.map((e) => (
            <List.Item key={e}>
              Collaborator:{' '}
              <Anchor
                href={`mailto:${e}`}
                underline="hover"
                style={{ color: linkColor }}
                onMouseEnter={(ev) => (ev.currentTarget.style.color = linkHover)}
                onMouseLeave={(ev) => (ev.currentTarget.style.color = linkColor)}
              >
                {e}
              </Anchor>
            </List.Item>
          ))}
        </List>

        <Text style={{ marginTop: 8 }}>Demo video:</Text>

        {/* Wrapper Paper provides border + rounded corners; AspectRatio keeps 16:9 */}
        <Paper
          radius="md"
          withBorder
          p={0}
          style={{
            overflow: 'hidden',
            border: `1px solid ${cardBorder}`,
          }}
        >
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={toEmbed(YOUTUBE_DEMO_URL)}
              title="Tool Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 0, width: '100%', height: '100%' }}
            />
          </AspectRatio>
        </Paper>
      </Stack>
    </Paper>
  );
}
