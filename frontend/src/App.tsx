// src/App.tsx
import { Container, Stack, Tabs, Paper, Group, Box, Title } from '@mantine/core';
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
        padding: '2.5rem 0'
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
              backgroundColor: 'white',
              border: '1px solid #e2e8f0'
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
              backgroundColor: 'white',
              border: '1px solid #e2e8f0'
            }}
          >
            <Box p="xl">
              <Title 
                order={2} 
                mb="xl" 
                style={{ 
                  color: '#1e293b',
                  fontWeight: 600,
                  fontSize: '1.75rem'
                }}
              >
                Bug Risk Analysis
              </Title>
              
              <Tabs color="blue" defaultValue="single" keepMounted={false}>
                <Tabs.List 
                  style={{ 
                    borderBottom: '2px solid #e2e8f0',
                    padding: '0 0.5rem',
                    marginBottom: '2rem'
                  }}
                >
                  <Tabs.Tab 
                    value="single"
                    style={{ 
                      padding: '1rem 2rem',
                      fontWeight: 500,
                      fontSize: '1rem',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    Single Analysis
                  </Tabs.Tab>
                  <Tabs.Tab 
                    value="batch"
                    style={{ 
                      padding: '1rem 2rem',
                      fontWeight: 500,
                      fontSize: '1rem',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    Batch Analysis
                  </Tabs.Tab>
                </Tabs.List>
                
                <Tabs.Panel value="single" pt="md">
                  <SinglePredict />
                </Tabs.Panel>
                <Tabs.Panel value="batch" pt="md">
                  <BatchPredict />
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
