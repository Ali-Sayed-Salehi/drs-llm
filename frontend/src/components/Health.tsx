// src/components/Health.tsx
import { useHealth } from '../hooks/useHealth';
import { Badge, Button, Group, Text } from '@mantine/core';

export default function Health() {
  const { data, isLoading, isError, refetch } = useHealth();

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="sm">
        <Badge color={isError ? 'red' : isLoading ? 'yellow' : 'teal'}>
          {isLoading ? 'Checking…' : isError ? 'Unreachable' : 'OK'}
        </Badge>
        {!isLoading && !isError && (
          <Text size="sm">Model: <b>{data?.model_id}</b></Text>
        )}
      </Group>
      <Button variant="light" onClick={() => refetch()}>Refresh</Button>
    </Group>
  );
}
