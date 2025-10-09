// src/pages/AboutPage.tsx
import { Container, Stack, Box } from '@mantine/core';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import About from '../components/About';

export default function AboutPage() {
  const { isDarkMode } = useTheme();

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '1.25rem 0',
      }}
    >
      <Container size="lg">
        <Stack gap="1.25rem">
          <Header />
          {/* About content (already renders in a Paper) */}
          <About />
        </Stack>
      </Container>
    </Box>
  );
}
