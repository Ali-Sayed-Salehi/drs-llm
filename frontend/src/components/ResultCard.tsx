// src/components/ResultCard.tsx
import { Card, Stack, Text } from '@mantine/core';
import type { PredictResponse } from '../types';

export default function ResultCard({ result }: { result: PredictResponse }) {
  return (
    <Card>
      <Stack gap="xs">
        <Text><b>Label:</b> {result.label}</Text>
        <Text><b>Confidence:</b> {(result.confidence * 100).toFixed(1)}%</Text>
      </Stack>
    </Card>
  );
}
