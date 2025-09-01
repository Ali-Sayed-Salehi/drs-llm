// src/components/BatchPredict.tsx
import { useState } from 'react';
import { Button, Card, Group, Stack, Text, Textarea, Divider, ActionIcon, Title, ScrollArea } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
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
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Batch items</Title>
        <Button leftSection={<IconPlus size={16} />} variant="light" onClick={addItem}>
          Add item
        </Button>
      </Group>

      <ScrollArea.Autosize mah={500}>
        <Stack>
          {items.map((it, i) => (
            <Card key={it.id}>
              <Group justify="space-between" mb="xs">
                <Text fw={600}>Item #{i + 1}</Text>
                <ActionIcon variant="subtle" color="gray" onClick={() => removeItem(it.id)} aria-label="Remove item">
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>

              <Stack>
                <Textarea
                  label="Commit message"
                  autosize
                  minRows={2}
                  value={it.commit_message}
                  onChange={(e) => update(it.id, 'commit_message', e.currentTarget.value)}
                />
                <Textarea
                  label="Code diff (unified)"
                  autosize
                  minRows={8}
                  value={it.code_diff}
                  onChange={(e) => update(it.id, 'code_diff', e.currentTarget.value)}
                  styles={{
                    input: {
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    },
                  }}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      <Group gap="sm">
        <Button onClick={submit} loading={m.isPending} disabled={items.length === 0}>
          Predict batch ({items.length})
        </Button>
        {m.isPending && <Text>Running…</Text>}
        {m.isError && <Text c="gray.6">{(m.error as Error).message}</Text>}
      </Group>

      {Array.isArray(m.data) && m.data.length > 0 && (
        <>
          <Divider my="md" />
          <Stack>
            {m.data.map((r, i) => (
              <Card key={i}>
                <Group justify="space-between">
                  <Text fw={600}>Item #{i + 1}</Text>
                </Group>
                <Text>
                  <b>Label:</b> {r.label}
                </Text>
                <Text>
                  <b>Confidence:</b> {(r.confidence * 100).toFixed(1)}%
                </Text>
              </Card>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
