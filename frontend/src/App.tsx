// src/App.tsx
import { Container, Stack, Paper, Box, Tabs } from '@mantine/core';
import { useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import Health from './components/Health';
import Predict from './components/Predict';
import PredictGithub from './components/PredictGithub';
// import Notices from './components/Notices';
import ApiGuide from './components/ApiGuide';
// import { NOTICES } from './constants';

export default function App() {
  const { isDarkMode } = useTheme();

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '1.25rem 0', // was 2.5rem
      }}
    >
      <Container size="lg">
        <Stack gap="1.25rem"> {/* was 2.5rem */}
          <Header />

          {/* Notices / Disclaimers Section */}
          {/* <Notices items={NOTICES} /> */}

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
            <Box p="lg"> {/* was xl */}
              <Tabs
                defaultValue="github"
                keepMounted={false}
                color="blue"
                styles={{
                  tab: {
                    color: isDarkMode ? '#a4a5a8ff' : undefined,
                    fontWeight: 600,
                  },
                }}
              >
                <Tabs.List>
                  <Tabs.Tab value="github">GitHub Commit</Tabs.Tab>
                  <Tabs.Tab value="manual">Manual Diff</Tabs.Tab>
                  <Tabs.Tab value="api">API Guide</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="github" pt="md"> {/* was xl */}
                  <PredictGithub />
                </Tabs.Panel>

                <Tabs.Panel value="manual" pt="md"> {/* was xl */}
                  <Predict />
                </Tabs.Panel>

                <Tabs.Panel value="api" pt="md"> {/* was xl */}
                  <ApiGuide />
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Paper>

          {/* System Status Section */}
          <Paper
            p="lg" // was xl
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
        </Stack>
      </Container>
    </Box>
  );
}
