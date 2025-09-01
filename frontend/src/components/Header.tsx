// src/components/Header.tsx
import { Box, Text, Image, Paper, Overlay } from '@mantine/core';

export default function Header() {
  return (
    <Paper radius="md" withBorder p={0} style={{ overflow: 'hidden' }}>
      <Box pos="relative">
        <Image src="/banner-1920x512.png" h={{ base: 180, md: 240 }} w="100%" fit="cover" />
        <Overlay
          gradient="linear-gradient(90deg, rgba(153,27,27,.80) 0%, rgba(153,27,27,.50) 45%, rgba(153,27,27,0.2) 75%)"
          opacity={1}
        />
        <Box 
          pos="absolute" 
          inset={0} 
          display="flex" 
          align="center" 
          p="xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)'
          }}
        >
          <Text 
            fw={800} 
            fz={{ base: '2xl', md: '3xl', lg: '4xl' }}
            c="white"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              letterSpacing: '0.5px'
            }}
          >
            Bug Risk Classifier
          </Text>
        </Box>
      </Box>
    </Paper>
  );
}
