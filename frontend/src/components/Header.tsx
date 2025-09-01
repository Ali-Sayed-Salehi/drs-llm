// src/components/Header.tsx
import { Box, Text, Image, Paper } from '@mantine/core';

export default function Header() {
  return (
    <Paper radius="md" withBorder p={0} style={{ overflow: 'hidden' }}>
      <Box 
        pos="relative" 
        h={{ base: 180, md: 240 }}
        style={{
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem'
        }}
      >
        {/* Title - Left Side, Centered */}
        <Box 
          style={{ 
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
                      <Text 
              fw={700} 
              fz={{ base: '1.5rem', md: '1.8rem', lg: '2.2rem' }}
              c="gray.7"
              ta="center"
              style={{
                letterSpacing: '0.3px',
                lineHeight: 1.2,
                textTransform: 'uppercase'
              }}
            >
            Bug Risk Classifier
          </Text>
        </Box>

        {/* Banner Image - Right Side */}
        <Box 
          style={{ 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Image 
            src="/banner.png" 
            h="80%" 
            w="auto" 
            fit="contain"
            style={{ 
              maxWidth: '300px'
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
