// src/components/SinglePredict.tsx
import { useState } from 'react';
import { usePredict } from '../hooks/usePredict';
import { Button, Card, Stack, Textarea, Group, Text } from '@mantine/core';

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
    <Card withBorder>
      <Stack>
        <div>
          <Textarea
            label="Commit message"
            autosize minRows={2}
            value={commit}
            onChange={(e) => setCommit(e.currentTarget.value)}
          />
        </div>

        <div>
          <Textarea
            label="Code diff (unified)"
            autosize minRows={8}
            value={diff}
            onChange={(e) => setDiff(e.currentTarget.value)}
            styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' } }}
          />
        </div>

        <Group gap="sm">
          <Button loading={isPending} onClick={() => mutate({ commit_message: commit, code_diff: diff })}>
            Predict
          </Button>
          {isError && <Text c="gray.6">{(error as Error).message}</Text>}
        </Group>

        {data && (
          <Card withBorder>
            <Stack gap="xs">
              <Text><b>Label:</b> {data.label}</Text>
              <Text><b>Confidence:</b> {(data.confidence * 100).toFixed(1)}%</Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
