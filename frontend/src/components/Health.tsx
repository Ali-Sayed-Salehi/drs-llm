// src/components/Health.tsx
import { Badge, Button, Group, Text, Box, Stack } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import { useHealth } from '../hooks/useHealth';
import type { HealthResponse } from '../types';
import type { GatewayHealth, Upstream } from '../api';

type StatusColor = 'gray' | 'yellow' | 'green' | 'red';

function isAggregate(
  d: GatewayHealth | undefined
): d is { gateway?: string; upstreams?: { seq_cls?: Upstream; clm?: Upstream } } {
  return typeof d === 'object' && d !== null && 'upstreams' in d!;
}

function isSingleModel(d: GatewayHealth | undefined): d is HealthResponse {
  return typeof d === 'object' && d !== null && 'model_id' in d!;
}

function statusBadgeProps(
  loading: boolean,
  ok?: boolean,
  unreachable?: boolean
): { color: StatusColor; label: string } {
  if (loading) return { color: 'yellow', label: 'Checking…' };
  if (unreachable) return { color: 'gray', label: 'Unreachable' };
  if (ok === true) return { color: 'green', label: 'Operational' };
  if (ok === false) return { color: 'red', label: 'Degraded' };
  return { color: 'gray', label: 'Unknown' };
}

export default function Health() {
  const { data, isLoading, isError, refetch } = useHealth();
  const { isDarkMode } = useTheme();

  const aggregate = isAggregate(data) ? data : undefined;
  const single = isSingleModel(data) ? data : undefined;

  const seq = aggregate?.upstreams?.seq_cls;
  const clm = aggregate?.upstreams?.clm;

  const seqProps = statusBadgeProps(isLoading, seq?.ok, isError || (!!aggregate && !seq));
  const clmProps = statusBadgeProps(isLoading, clm?.ok, isError || (!!aggregate && !clm));
  const singleProps = statusBadgeProps(isLoading, !isError, isError);

  return (
    <Box>
      <Text
        fw={600}
        fz="lg"
        c={isDarkMode ? 'gray.3' : 'gray.8'}
        mb="md"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        System Status
      </Text>

      <Group justify="space-between" wrap="nowrap" align="start">
        <Stack gap="md">
          {aggregate ? (
            <>
              {/* Seq-CLS row */}
              <Group gap="xl" align="center">
                <Box>
                  <Text size="sm" c={isDarkMode ? 'gray.5' : 'gray.6'} mb={4}>
                    Seq-CLS
                  </Text>
                  <Badge
                    color={seqProps.color}
                    size="lg"
                    variant="light"
                    style={{ fontWeight: 500, padding: '0.5rem 1rem' }}
                  >
                    {seqProps.label}
                  </Badge>
                </Box>

                {seq?.model_id && (
                  <Box>
                    <Text size="sm" c={isDarkMode ? 'gray.5' : 'gray.6'} mb={4}>
                      Model
                    </Text>
                    <Text size="sm" fw={500} c={isDarkMode ? 'gray.3' : 'gray.8'}>
                      {seq.model_id}
                    </Text>
                  </Box>
                )}
              </Group>

              {/* CLM row */}
              <Group gap="xl" align="center">
                <Box>
                  <Text size="sm" c={isDarkMode ? 'gray.5' : 'gray.6'} mb={4}>
                    CLM
                  </Text>
                  <Badge
                    color={clmProps.color}
                    size="lg"
                    variant="light"
                    style={{ fontWeight: 500, padding: '0.5rem 1rem' }}
                  >
                    {clmProps.label}
                  </Badge>
                </Box>

                {clm?.model_id && (
                  <Box>
                    <Text size="sm" c={isDarkMode ? 'gray.5' : 'gray.6'} mb={4}>
                      Model
                    </Text>
                    <Text size="sm" fw={500} c={isDarkMode ? 'gray.3' : 'gray.8'}>
                      {clm.model_id}
                    </Text>
                  </Box>
                )}
              </Group>
            </>
          ) : (
            // Fallback to old single-model layout
            <Group gap="lg" align="center">
              <Box>
                <Text size="sm" c={isDarkMode ? 'gray.5' : 'gray.6'} mb={4}>
                  Status
                </Text>
                <Badge
                  color={singleProps.color}
                  size="lg"
                  variant="light"
                  style={{ fontWeight: 500, padding: '0.5rem 1rem' }}
                >
                  {singleProps.label}
                </Badge>
              </Box>

              {single?.model_id && (
                <Box>
                  <Text size="sm" c={isDarkMode ? 'gray.5' : 'gray.6'} mb={4}>
                    Model
                  </Text>
                  <Text size="sm" fw={500} c={isDarkMode ? 'gray.3' : 'gray.8'}>
                    {single.model_id}
                  </Text>
                </Box>
              )}
            </Group>
          )}
        </Stack>

        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          onClick={() => refetch()}
          style={{
            fontWeight: 500,
            borderColor: isDarkMode ? '#475569' : '#cbd5e1',
            backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
            color: isDarkMode ? '#cbd5e1' : '#475569',
          }}
        >
          Refresh Status
        </Button>
      </Group>
    </Box>
  );
}
