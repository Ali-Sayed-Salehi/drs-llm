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
          border: `1px solid ${isDarkMode ? '#374151' : '#f1f5f9'}`
        }}
      >
        {/* Theme Toggle - Top Left */}
        <Box 
          pos="absolute" 
          top="1.5rem" 
          left="1.5rem"
          style={{ zIndex: 10 }}
        >
          <ThemeToggle />
        </Box>

        {/* Title - Centered */}
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
              color: isDarkMode ? '#f1f5f9' : '#1e293b',
              textShadow: isDarkMode 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.1)'
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
              filter: isDarkMode 
                ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)) brightness(0.9)'
                : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
