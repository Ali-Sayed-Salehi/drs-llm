// src/components/Header.tsx
import { Box, Group, Overlay, Text, Image, Paper } from '@mantine/core';
import Health from './Health';

export default function Header() {
  return (
    <Paper radius="md" withBorder p={0} style={{ overflow: 'hidden' }}>
      <Box pos="relative">
        <Image src="/banner-1920x512.png" h={{ base: 180, md: 240 }} w="100%" fit="cover" />
        <Overlay
          gradient="linear-gradient(90deg, rgba(153,27,27,.70) 0%, rgba(153,27,27,.35) 45%, rgba(153,27,27,0) 75%)"
          opacity={1}
        />
        <Group justify="space-between" p="md" pos="absolute" inset={0}>
          <Text fw={700} fz={{ base: 'xl', md: '2xl' }}>
            Bug Risk Classifier
          </Text>
          <Health />
        </Group>
      </Box>
    </Paper>
  );
}
