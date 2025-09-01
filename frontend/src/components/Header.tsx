// src/components/Header.tsx
import { Box, Text, Image, Paper, Overlay } from '@mantine/core';

export default function Header() {
  return (
    <Paper radius="md" withBorder p={0} style={{ overflow: 'hidden' }}>
      <Box pos="relative">
        <Image src="/banner-1920x512.png" h={{ base: 180, md: 240 }} w="100%" fit="cover" />
        <Overlay
          gradient="linear-gradient(90deg, rgba(153,27,27,.60) 0%, rgba(153,27,27,.30) 45%, rgba(153,27,27,0.1) 75%)"
          opacity={1}
        />
        <Box 
          pos="absolute" 
          inset={0} 
          display="flex" 
          align="center" 
          justify="center"
          p="xl"
        >
          <Text 
            fw={900} 
            fz={{ base: '2.5rem', md: '3.5rem', lg: '4rem' }}
            c="white"
            ta="center"
            style={{
              textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(153,27,27,0.8)',
              letterSpacing: '1px',
              lineHeight: 1.2,
              textTransform: 'uppercase'
            }}
          >
            Bug Risk Classifier
          </Text>
        </Box>
      </Box>
    </Paper>
  );
}
