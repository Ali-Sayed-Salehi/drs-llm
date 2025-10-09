// src/components/Header.tsx
import { Box, Text, Image, Paper, Group } from '@mantine/core';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { IconSun, IconMoon } from '@tabler/icons-react';
import React from 'react';

import bannerUrl from '@/assets/llama_logo.png';
import logo1 from '@/assets/concordia_logo.png';
import logo2 from '@/assets/utk_logo.png';
import logo3 from '@/assets/woc_logo.png';
import { YOUTUBE_DEMO_URL } from '../constants';

export default function Header() {
  const { isDarkMode, toggleTheme } = useTheme();

  const logos = [logo1, logo2, logo3, bannerUrl];
  const logoWidths = { base: 60, sm: 75, md: 90, lg: 100 };
  const bannerWidths = { base: 90, sm: 110, md: 170, lg: 200 };

  const activeBg = isDarkMode ? '#334155' : '#e2e8f0';
  const activeColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const inactiveColor = isDarkMode ? '#cbd5e1' : '#475569';
  const activeBorder = isDarkMode ? '#475569' : '#d1d5db';
  const hoverBg = isDarkMode ? '#3b4454' : '#eef2f6';

  const pillBase: React.CSSProperties = {
    borderRadius: 9999,
    textDecoration: 'none',
    fontWeight: 700,
    lineHeight: 1,
    border: '1px solid transparent',
    transition:
      'background-color 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
    boxShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.35)' : '0 1px 2px rgba(0,0,0,0.12)',
    display: 'inline-block',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const navPillSize: React.CSSProperties = { padding: '8px 14px', fontSize: 14 };
  const togglePillSize: React.CSSProperties = { padding: '6px 10px', fontSize: 13 };

  const activeStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...pillBase,
    background: activeBg,
    color: activeColor,
    borderColor: activeBorder,
    ...extra,
  });
  const inactiveStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...pillBase,
    background: 'transparent',
    color: inactiveColor,
    ...extra,
  });

  // Type-safe helpers (no `any`)
  const isElementActive = (el: HTMLAnchorElement | HTMLElement): boolean =>
    el.getAttribute('aria-current') === 'page';

  const setHover = (el: HTMLAnchorElement | HTMLElement, on: boolean) => {
    if (isElementActive(el)) return; // don't override active styling
    (el as HTMLElement).style.background = on ? hoverBg : 'transparent';
  };

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
        {/* Top-left controls: Theme toggle (left) + Nav pills (right) */}
        <Box pos="absolute" top="1rem" left="1rem" style={{ zIndex: 10 }}>
          <Group gap="sm" align="center">
            {/* Theme toggle pill (button) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={inactiveStyle(togglePillSize)}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => setHover(e.currentTarget, true)}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => setHover(e.currentTarget, false)}
            >
              {isDarkMode ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>

            <Group gap="xs">
              <NavLink
                to="/"
                end
                style={({ isActive }) =>
                  isActive ? activeStyle(navPillSize) : inactiveStyle(navPillSize)
                }
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  setHover(e.currentTarget, true)
                }
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  setHover(e.currentTarget, false)
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/about"
                style={({ isActive }) =>
                  isActive ? activeStyle(navPillSize) : inactiveStyle(navPillSize)
                }
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  setHover(e.currentTarget, true)
                }
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  setHover(e.currentTarget, false)
                }
              >
                About
              </NavLink>

              {/* New: external pill that goes straight to YouTube demo */}
              <a
                href={YOUTUBE_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={inactiveStyle(navPillSize)}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => setHover(e.currentTarget, true)}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => setHover(e.currentTarget, false)}
              >
                Demo
              </a>
            </Group>
          </Group>
        </Box>

        {/* Title + subtitle - Left */}
        <Box style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
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
