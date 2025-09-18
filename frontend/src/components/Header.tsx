// src/components/Header.tsx
import { Box, Text, Image, Paper } from '@mantine/core';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import bannerUrl from '@/assets/llama_logo.png';

import logo1 from '@/assets/concordia_logo.png';
import logo2 from '@/assets/utk_logo.png';
import logo3 from '@/assets/woc_logo.png';

export default function Header() {
  const { isDarkMode } = useTheme();

  const logos = [logo1, logo2, logo3, bannerUrl];

  const logoWidths = { base: 60, sm: 75, md: 90, lg: 100 };
  const bannerWidths = { base: 130, sm: 160, md: 210, lg: 250 };

  return (
    <Paper
      radius="xl"
      withBorder
      p={0}
      style={{
        overflow: 'hidden',
        border: `1px solid ${isDarkMode ? '#2b3442' : '#e2e8f0'}`,
        backgroundClip: 'padding-box',
      }}
    >
      <Box
        pos="relative"
        h={{ base: 200, md: 260 }}
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          border: `1px solid ${isDarkMode ? '#374151' : '#f1f5f9'}`,
          gap: '1rem',
        }}
      >
        {/* Theme Toggle - Top Left */}
        <Box
          pos="absolute"
          top="1rem"
          left="1rem"
          style={{ zIndex: 10 }}
        >
          <ThemeToggle />
        </Box>

        {/* Title + subtitle - Left */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box>
            <Text
              fw={800}
              fz={{ base: '1.8rem', md: '2.2rem', lg: '2.5rem' }}
              ta="left"
              style={{
                letterSpacing: '0.3px',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                color: isDarkMode ? '#f1f5f9' : '#1e293b',
                textShadow: isDarkMode
                  ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                  : '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              DRS
            </Text>
            <Text
              fz={{ base: '1rem', md: '1.1rem' }}
              c={isDarkMode ? '#cbd5e1' : '#475569'}
              style={{ marginTop: '0.3rem' }}
            >
              Assess the risk of any pull request
            </Text>
          </Box>
        </Box>

        {/* Logos + banner - Right side */}
        <Box
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '1rem',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {logos.map((logo, idx) => {
            const isBanner = logo === bannerUrl;
            return (
              <Box key={idx} w={isBanner ? bannerWidths : logoWidths}>
                <Image
                  src={logo}
                  alt={`logo-${idx}`}
                  w="100%"
                  fit="contain"
                  style={{
                    display: 'block',
                    filter: isDarkMode
                      ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
