// src/components/BatchPredict.tsx
import { useState } from 'react';
import { Button, Card, Group, Stack, Text, Textarea, Divider, ActionIcon, Title, ScrollArea, Badge, Box } from '@mantine/core';
import { IconTrash, IconPlus, IconBrain, IconCode, IconMessage } from '@tabler/icons-react';
import { usePredictBatch } from '../hooks/usePredictBatch';
import type { PredictRequest } from '../types';
import { PLACEHOLDER_DIFF } from '../constants';

type Item = { id: string; commit_message: string; code_diff: string };

export default function BatchPredict() {
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), commit_message: 'Fix NPE', code_diff: PLACEHOLDER_DIFF },
    {
      id: crypto.randomUUID(),
      commit_message: 'Refactor: rename',
      code_diff: `diff --git a/app/a.py b/app/a.py
--- a/app/a.py
+++ b/app/a.py
@@ -1,3 +1,3 @@
-x = 1
+count = 1
print("ok")`,
    },
  ]);

  const m = usePredictBatch();

  const addItem = () =>
    setItems((xs) => [...xs, { id: crypto.randomUUID(), commit_message: '', code_diff: '' }]);

  const removeItem = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));

  const update = (id: string, field: keyof PredictRequest, v: string) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, [field]: v } : x)));

  const submit = () =>
    m.mutate(items.map(({ commit_message, code_diff }) => ({ commit_message, code_diff })));

  return (
    <Stack gap="xl">
      {/* Header Section */}
      <Group justify="space-between" align="center">
        <Box>
          <Title order={3} style={{ color: '#1e293b', fontWeight: 600, marginBottom: '0.5rem' }}>
            Batch Analysis
          </Title>
          <Text size="sm" c="gray.6">
            Analyze multiple code changes at once
          </Text>
        </Box>
        <Button 
          leftSection={<IconPlus size={16} />} 
          variant="light" 
          onClick={addItem}
          style={{
            fontWeight: 500,
            borderColor: isDarkMode ? '#475569' : '#cbd5e1',
            backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
            color: isDarkMode ? '#cbd5e1' : '#475569'
          }}
        >
          Add Item
        </Button>
      </Group>

      {/* Items Section */}
      <ScrollArea.Autosize mah={600}>
        <Stack gap="lg">
          {items.map((it, i) => (
            <Card 
              key={it.id}
              withBorder
              radius="lg"
              shadow="0 2px 4px rgba(0, 0, 0, 0.05)"
              style={{ 
                backgroundColor: '#fafbfc',
                border: '1px solid #e2e8f0'
              }}
            >
              <Stack gap="lg">
                <Group justify="space-between" mb="xs">
                  <Group gap="sm">
                    <Badge 
                      variant="light" 
                      color="blue"
                      style={{ fontWeight: 500 }}
                    >
                      Item #{i + 1}
                    </Badge>
                  </Group>
                  <ActionIcon 
                    variant="subtle" 
                    color="gray" 
                    onClick={() => removeItem(it.id)} 
                    aria-label="Remove item"
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>

                <Stack gap="lg">
                  <Box>
                    <Group gap="sm" mb="sm">
                      <IconMessage size={18} color="#64748b" />
                      <Text fw={500} size="sm" c="gray.7">Commit Message</Text>
                    </Group>
                    <Textarea
                      placeholder="Enter commit message..."
                      autosize
                      minRows={2}
                      maxRows={4}
                      value={it.commit_message}
                      onChange={(e) => update(it.id, 'commit_message', e.currentTarget.value)}
                      styles={{
                        input: {
                          borderColor: '#d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          '&:focus': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <Group gap="sm" mb="sm">
                      <IconCode size={18} color="#64748b" />
                      <Text fw={500} size="sm" c="gray.7">Code Changes</Text>
                    </Group>
                    <Textarea
                      placeholder="Paste unified diff..."
                      autosize
                      minRows={6}
                      maxRows={12}
                      value={it.code_diff}
                      onChange={(e) => update(it.id, 'code_diff', e.currentTarget.value)}
                      styles={{
                        input: {
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                          borderColor: '#d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          lineHeight: 1.4,
                          '&:focus': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }
                      }}
                    />
                  </Box>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      {/* Action Section */}
      <Group gap="md" align="flex-start">
        <Button 
          leftSection={<IconBrain size={18} />}
          onClick={submit} 
          loading={m.isPending} 
          disabled={items.length === 0}
          size="lg"
          style={{
            fontWeight: 600,
            padding: '0.75rem 2rem'
          }}
        >
          {m.isPending ? 'Analyzing...' : `Analyze ${items.length} Items`}
        </Button>
        
        {m.isPending && (
          <Box 
            p="md" 
            style={{ 
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px'
            }}
          >
            <Text size="sm" style={{ color: '#0369a1' }}>
              Processing {items.length} items...
            </Text>
          </Box>
        )}
        
        {m.isError && (
          <Box 
            p="md" 
            style={{ 
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px'
            }}
          >
            <Text size="sm" style={{ color: '#dc2626' }}>
              {(m.error as Error).message}
            </Text>
          </Box>
        )}
      </Group>

      {/* Results Section */}
      {Array.isArray(m.data) && m.data.length > 0 && (
        <>
          <Divider my="lg" style={{ borderColor: '#e2e8f0' }} />
          
          <Box>
            <Group gap="sm" mb="lg">
              <IconBrain size={20} color="#3b82f6" />
              <Title order={4} style={{ color: '#1e293b', fontWeight: 600 }}>
                Analysis Results
              </Title>
            </Group>
            
            <Stack gap="md">
              {m.data.map((r, i) => (
                <Card 
                  key={i}
                  withBorder
                  radius="lg"
                  shadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                  style={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Badge 
                        variant="light" 
                        color="blue"
                        style={{ fontWeight: 500 }}
                      >
                        Item #{i + 1}
                      </Badge>
                    </Group>
                    
                    <Group gap="lg">
                      <Box>
                        <Text size="sm" c="gray.6" mb={4}>Risk Level</Text>
                        <Badge 
                          color={r.label === 'POSITIVE' ? 'red' : 'green'} 
                          size="md"
                          variant="light"
                          style={{ 
                            fontWeight: 600,
                            padding: '0.4rem 0.8rem'
                          }}
                        >
                          {r.label === 'POSITIVE' ? 'High Risk' : 'Low Risk'}
                        </Badge>
                      </Box>
                      
                      <Box>
                        <Text size="sm" c="gray.6" mb={4}>Confidence</Text>
                        <Text fw={600} size="md" c="gray.8">
                          {(r.confidence * 100).toFixed(1)}%
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
