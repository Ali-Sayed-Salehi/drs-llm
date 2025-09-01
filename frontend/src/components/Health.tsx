// src/components/Health.tsx
import { useHealth } from '../hooks/useHealth';
import { Badge, Button, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

export default function Health() {
  const { data, isLoading, isError, refetch } = useHealth();

  return (
    <Group gap="sm" wrap="nowrap">
      <Badge color={isError ? 'red' : isLoading ? 'yellow' : 'teal'} size="sm">
        {isLoading ? 'Checking…' : isError ? 'Unreachable' : 'OK'}
      </Badge>
      {!isLoading && !isError && (
        <Text size="sm" c="dimmed">
          Model: <b>{data?.model_id}</b>
        </Text>
      )}
      <Tooltip label="Refresh health status">
        <ActionIcon 
          variant="light" 
          size="sm" 
          onClick={() => refetch()}
          loading={isLoading}
        >
          <IconRefresh size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
