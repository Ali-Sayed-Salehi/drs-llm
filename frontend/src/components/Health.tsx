// src/components/Health.tsx
import { useHealth } from '../hooks/useHealth';
import { Badge, Button, Group, Text, Box } from '@mantine/core';

export default function Health() {
  const { data, isLoading, isError, refetch } = useHealth();

  return (
    <Box>
      <Text 
        fw={600} 
        fz="lg" 
        c="gray.8" 
        mb="md"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        System Status
      </Text>
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group gap="lg">
          <Box>
            <Text size="sm" c="gray.6" mb={4}>Status</Text>
            <Badge 
              color={isError ? 'gray' : isLoading ? 'yellow' : 'blue'} 
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
              <Text size="sm" c="gray.6" mb={4}>Model</Text>
              <Text size="sm" fw={500} c="gray.8">
                {data?.model_id}
              </Text>
            </Box>
          )}
        </Group>
        <Button 
          variant="light" 
          onClick={() => refetch()}
          style={{
            fontWeight: 500,
            borderColor: '#cbd5e1'
          }}
        >
          Refresh Status
        </Button>
      </Group>
    </Box>
  );
}
