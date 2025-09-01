// src/components/Header.tsx
import { Box, Text, Image, Paper, Group } from '@mantine/core';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { isDarkMode } = useTheme();

  return (
    <Paper 
      radius="xl" 
      withBorder 
      p={0} 
      style={{ 
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`
      }}
    >
      <Box 
        pos="relative" 
        h={{ base: 180, md: 240 }}
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 3rem',
          border: `1px solid ${isDarkMode ? '#475569' : '#f1f5f9'}`
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
              background: isDarkMode
                ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 25%, #94a3b8 50%, #cbd5e1 75%, #e2e8f0 100%)'
                : 'linear-gradient(135deg, #374151 0%, #6B7280 25%, #9CA3AF 50%, #6B7280 75%, #374151 100%)',
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

        {/* Right Side - Theme Toggle and Banner Image */}
        <Group gap="lg" align="center">
          <ThemeToggle />
          
          {/* Banner Image */}
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
                filter: isDarkMode 
                  ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)) brightness(0.9)'
                  : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }}
            />
          </Box>
        </Group>
      </Box>
    </Paper>
  );
}
