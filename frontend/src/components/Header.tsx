// src/components/Header.tsx
import { Box, Group, Text, Image, Paper, Stack } from '@mantine/core';
import Health from './Health';

export default function Header() {
  return (
    <Stack gap="md">
      {/* Banner Image */}
      <Paper radius="md" withBorder p={0} style={{ overflow: 'hidden' }}>
        <Image src="/banner-1920x512.png" h={{ base: 120, md: 160 }} w="100%" fit="cover" />
      </Paper>
      
      {/* Header Content */}
      <Paper radius="md" withBorder p="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={700} fz={{ base: 'xl', md: '2xl' }} c="dark.9">
            Bug Risk Classifier
          </Text>
          <Health />
        </Group>
      </Paper>
    </Stack>
  );
}
