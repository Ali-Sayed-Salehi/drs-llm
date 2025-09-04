// src/components/Health.tsx
import { useHealth } from '../hooks/useHealth';
import { Badge, Button, Group, Text, Box } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Health() {
  const { data, isLoading, isError, refetch } = useHealth();
  const { isDarkMode } = useTheme();

  return (
    <Box>
      <Text 
        fw={600} 
        fz="lg" 
        c={isDarkMode ? "gray.3" : "gray.8"} 
        mb="md"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        System Status
      </Text>
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group gap="lg">
          <Box>
            <Text size="sm" c={isDarkMode ? "gray.5" : "gray.6"} mb={4}>Status</Text>
            <Badge 
              color={isError ? 'gray' : isLoading ? 'yellow' : 'green'} 
              size="lg"
              variant="light"
              style={{ 
                fontWeight: 500,
                padding: '0.5rem 1rem'
              }}
            >
              {isLoading ? 'Checking…' : isError ? 'Unreachable' : 'Operational'}
            </Badge>
          </Box>
          {!isLoading && !isError && (
            <Box>
              <Text size="sm" c={isDarkMode ? "gray.5" : "gray.6"} mb={4}>Model</Text>
              <Text size="sm" fw={500} c={isDarkMode ? "gray.3" : "gray.8"}>
                {data?.model_id}
              </Text>
            </Box>
          )}
        </Group>
        <Button 
          leftSection={<IconRefresh size={16} />}
          variant="light" 
          onClick={() => refetch()}
          style={{
            fontWeight: 500,
            borderColor: isDarkMode ? '#475569' : '#cbd5e1',
            backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
            color: isDarkMode ? '#cbd5e1' : '#475569'
          }}
        >
          Refresh Status
        </Button>
      </Group>
    </Box>
  );
}
