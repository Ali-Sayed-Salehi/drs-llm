
// src/components/Header.tsx
import { Box, Text, Image, Paper } from '@mantine/core';

export default function Header() {
  return (
    <Paper 
      radius="xl" 
      withBorder 
      p={0} 
      style={{ 
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
      }}
    >
      <Box 
        pos="relative" 
        h={{ base: 180, md: 240 }}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 3rem',
          border: '1px solid #f1f5f9'
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
            fz={{ base: '1.5rem', md: '1.8rem', lg: '2.1rem' }}
            ta="center"
            style={{
              letterSpacing: '0.3px',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              background: 'linear-gradient(135deg, #374151 0%, #6B7280 25%, #9CA3AF 50%, #6B7280 75%, #374151 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              position: 'relative'
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
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <Image 
            src="/banner.png" 
            h="85%" 
            w="auto" 
            fit="contain"
            style={{ 
              maxWidth: '280px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
