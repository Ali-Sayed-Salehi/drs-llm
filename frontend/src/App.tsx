// src/App.tsx
import { Container, Stack, Paper, Box, Title } from '@mantine/core';
import { useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import Health from './components/Health';
import Predict from './components/Predict';

export default function App() {
  const { isDarkMode } = useTheme();

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '2.5rem 0',
      }}
    >
      <Container size="lg">
        <Stack gap="2.5rem">
          <Header />

          {/* System Status Section */}
          <Paper
            p="xl"
            withBorder
            radius="xl"
            shadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            style={{
              backgroundColor: isDarkMode ? '#1e293b' : 'white',
              border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
            }}
          >
            <Health />
          </Paper>

          {/* Main Content Section */}
          <Paper
            withBorder
            radius="xl"
            shadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            style={{
              backgroundColor: isDarkMode ? '#1e293b' : 'white',
              border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
            }}
          >
            <Box p="xl">
              {/* Unified Predict Section */}
              <Predict />
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
