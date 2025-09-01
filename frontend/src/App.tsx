// src/App.tsx
import { Container, Stack, Tabs, Paper, Group } from '@mantine/core';
import Header from './components/Header';
import Health from './components/Health';
import SinglePredict from './components/SinglePredict';
import BatchPredict from './components/BatchPredict';

export default function App() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Header />
        <Paper p="lg" withBorder radius="md" shadow="sm">
          <Health />
        </Paper>
        <Tabs color="blue" defaultValue="single" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="single">Single</Tabs.Tab>
            <Tabs.Tab value="batch">Batch</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="single" pt="sm">
            <SinglePredict />
          </Tabs.Panel>
          <Tabs.Panel value="batch" pt="sm">
            <BatchPredict />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
