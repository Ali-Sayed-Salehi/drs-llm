// src/App.tsx
import { Container, Stack, Tabs, Paper, Group, Box } from '@mantine/core';
import Header from './components/Header';
import Health from './components/Health';
import SinglePredict from './components/SinglePredict';
import BatchPredict from './components/BatchPredict';

export default function App() {
  return (
    <Box 
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '2rem 0'
      }}
    >
      <Container size="lg">
        <Stack gap="2rem">
          <Header />
          <Paper 
            p="xl" 
            withBorder 
            radius="lg" 
            shadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            style={{ backgroundColor: 'white' }}
          >
            <Health />
          </Paper>
          <Paper 
            withBorder 
            radius="lg" 
            shadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            style={{ backgroundColor: 'white' }}
          >
            <Tabs color="blue" defaultValue="single" keepMounted={false}>
              <Tabs.List 
                style={{ 
                  borderBottom: '1px solid #e2e8f0',
                  padding: '0 1.5rem'
                }}
              >
                <Tabs.Tab 
                  value="single"
                  style={{ 
                    padding: '1rem 1.5rem',
                    fontWeight: 500
                  }}
                >
                  Single Prediction
                </Tabs.Tab>
                <Tabs.Tab 
                  value="batch"
                  style={{ 
                    padding: '1rem 1.5rem',
                    fontWeight: 500
                  }}
                >
                  Batch Prediction
                </Tabs.Tab>
              </Tabs.List>
              <Box p="xl">
                <Tabs.Panel value="single" pt="md">
                  <SinglePredict />
                </Tabs.Panel>
                <Tabs.Panel value="batch" pt="md">
                  <BatchPredict />
                </Tabs.Panel>
              </Box>
            </Tabs>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
