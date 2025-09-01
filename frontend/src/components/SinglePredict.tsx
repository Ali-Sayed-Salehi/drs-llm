// src/components/SinglePredict.tsx
import { useState } from 'react';
import { usePredict } from '../hooks/usePredict';
import { Button, Card, Stack, Textarea, Group, Text, Title, Badge, Box } from '@mantine/core';
import { IconBrain, IconCode, IconMessage } from '@tabler/icons-react';

const placeholderDiff = `diff --git a/src/U.java b/src/U.java
--- a/src/U.java
+++ b/src/U.java
@@ -1 +1 @@
-return u.getId().toString();
+return u != null ? String.valueOf(u.getId()) : "";`;

export default function SinglePredict() {
  const [commit, setCommit] = useState('Fix NPE when user is null');
  const [diff, setDiff] = useState(placeholderDiff);
  const { data, isPending, isError, error, mutate } = usePredict();

  return (
    <Stack gap="xl">
      {/* Input Section */}
      <Card 
        withBorder 
        radius="lg"
        shadow="0 2px 4px rgba(0, 0, 0, 0.05)"
        style={{ 
          backgroundColor: '#fafbfc',
          border: '1px solid #e2e8f0'
        }}
      >
        <Stack gap="lg">
          <Group gap="sm">
            <IconMessage size={20} color="#64748b" />
            <Title order={4} style={{ color: '#374151', fontWeight: 600 }}>
              Commit Message
            </Title>
          </Group>
          
          <Textarea
            label=""
            placeholder="Enter your commit message here..."
            autosize 
            minRows={3}
            maxRows={6}
            value={commit}
            onChange={(e) => setCommit(e.currentTarget.value)}
            styles={{
              input: {
                borderColor: '#d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                '&:focus': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }
              }
            }}
          />
        </Stack>
      </Card>

      <Card 
        withBorder 
        radius="lg"
        shadow="0 2px 4px rgba(0, 0, 0, 0.05)"
        style={{ 
          backgroundColor: '#fafbfc',
          border: '1px solid #e2e8f0'
        }}
      >
        <Stack gap="lg">
          <Group gap="sm">
            <IconCode size={20} color="#64748b" />
            <Title order={4} style={{ color: '#374151', fontWeight: 600 }}>
              Code Changes
            </Title>
          </Group>
          
          <Textarea
            label=""
            placeholder="Paste your unified diff here..."
            autosize 
            minRows={10}
            maxRows={20}
            value={diff}
            onChange={(e) => setDiff(e.currentTarget.value)}
            styles={{
              input: {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                borderColor: '#d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                '&:focus': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }
              }
            }}
          />
        </Stack>
      </Card>

      {/* Action Section */}
      <Group gap="md" align="flex-start">
        <Button 
          leftSection={<IconBrain size={18} />}
          loading={isPending} 
          onClick={() => mutate({ commit_message: commit, code_diff: diff })}
          size="lg"
          style={{
            fontWeight: 600,
            padding: '0.75rem 2rem'
          }}
        >
          {isPending ? 'Analyzing...' : 'Analyze Risk'}
        </Button>
        
        {isError && (
          <Box 
            p="md" 
            style={{ 
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626'
            }}
          >
            <Text size="sm" style={{ color: '#dc2626' }}>
              {(error as Error).message}
            </Text>
          </Box>
        )}
      </Group>

      {/* Results Section */}
      {data && (
        <Card 
          withBorder 
          radius="lg"
          shadow="0 4px 6px rgba(0, 0, 0, 0.1)"
          style={{ 
            backgroundColor: 'white',
            border: '1px solid #e2e8f0'
          }}
        >
          <Stack gap="md">
            <Group gap="sm">
              <IconBrain size={20} color="#3b82f6" />
              <Title order={4} style={{ color: '#1e293b', fontWeight: 600 }}>
                Analysis Results
              </Title>
            </Group>
            
            <Group gap="lg">
              <Box>
                <Text size="sm" c="gray.6" mb={4}>Risk Level</Text>
                <Badge 
                  color={data.label === 'POSITIVE' ? 'red' : 'green'} 
                  size="lg"
                  variant="light"
                  style={{ 
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    fontSize: '0.95rem'
                  }}
                >
                  {data.label === 'POSITIVE' ? 'High Risk' : 'Low Risk'}
                </Badge>
              </Box>
              
              <Box>
                <Text size="sm" c="gray.6" mb={4}>Confidence</Text>
                <Text fw={600} size="lg" c="gray.8">
                  {(data.confidence * 100).toFixed(1)}%
                </Text>
              </Box>
            </Group>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
