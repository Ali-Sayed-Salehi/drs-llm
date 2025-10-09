// src/components/Notices.tsx
import React from 'react';
import { Paper, Box, Text, Anchor } from '@mantine/core';
import { useTheme } from '../contexts/ThemeContext';
import type { NoticeItem, NoticeInlinePart } from '../constants';

interface NoticesProps {
  items: NoticeItem[];
}

export default function Notices({ items }: NoticesProps) {
  const { isDarkMode } = useTheme();

  // Confluence-like "note" colors tuned for both themes
  const bg = isDarkMode ? '#3B2F0B' : '#FFF4CE';      // dark amber / light yellow
  const border = isDarkMode ? '#5C4600' : '#FFE380';   // stronger amber border
  const text = isDarkMode ? '#FFF4CE' : '#172B4D';     // high contrast ink
  const link = isDarkMode ? '#93C5FD' : '#0B66E4';     // accessible link color

  const renderInline = (parts: NoticeInlinePart[]) => (
    <>
      {parts.map((p, idx) => {
        const node =
          typeof p === 'string' ? (
            <>{p}</>
          ) : (
            <Anchor
              href={p.href}
              target={p.external ? '_blank' : undefined}
              rel={p.external ? 'noopener noreferrer' : undefined}
              style={{ color: link, textDecorationColor: link }}
            >
              {p.label}
            </Anchor>
          );

        // Insert a space between inline parts
        const needsSpace = idx > 0;
        return (
          <React.Fragment key={idx}>
            {needsSpace && ' '}
            {node}
          </React.Fragment>
        );
      })}
    </>
  );

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        boxShadow: 'none',
      }}
    >
      <Box component="ul" style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc' }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: '0.4rem' }}>
            <Text size="sm" style={{ color: text }}>
              {typeof item === 'string' ? item : renderInline(item)}
            </Text>
          </li>
        ))}
      </Box>
    </Paper>
  );
}
