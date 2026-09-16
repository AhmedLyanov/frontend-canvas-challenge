import { useCallback, useRef } from 'react';

import type { GenerationData } from '@canvas/contracts';

import {
  findPromptNode,
  findResultNode,
  type CanvasEdge,
  type CanvasNode,
} from '@/entities/graph';
import { createGeneration } from '@/entities/generation/api';
import { useGenerationPolling } from './use-generation-polling';

interface UseGenerationProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  saveNow: () => Promise<string | undefined>;
  generationHref: string | null;
  setResultImage: (nodeId: string, imageUrl: string) => void;
  pollIntervalMs?: number;
}

export function useGeneration({
  nodes,
  edges,
  saveNow,
  generationHref,
  setResultImage,
  pollIntervalMs,
}: UseGenerationProps) {
  const attemptsRef = useRef<
    Map<
      string,
      {
        idempotencyKey: string;
        scenario: 'success' | 'failure';
      }
    >
  >(new Map());

  const handleSucceeded = useCallback(
    (generation: GenerationData) => {
      if (!generation.imageUrl) {
        return;
      }

      setResultImage(
        generation.resultNodeId,
        generation.imageUrl,
      );
    },
    [setResultImage],
  );

  const handleFailed = useCallback(() => {}, []);

  const {
    generation,
    status,
    error,
    start: startPolling,
    stop: stopPolling,
  } = useGenerationPolling({
    onSucceeded: handleSucceeded,
    onFailed: handleFailed,
    pollIntervalMs,
  });

  const generate = useCallback(
    async (
      generatorId: string,
      scenario: 'success' | 'failure' = 'success',
      providedKey?: string,
    ) => {
      if (!generationHref) {
        return undefined;
      }

      const promptNode = findPromptNode(
        nodes,
        edges,
        generatorId,
      );

      const resultNode = findResultNode(
        nodes,
        edges,
        generatorId,
      );

      if (!promptNode || !resultNode) {
        return undefined;
      }

      if (!('text' in promptNode.data)) {
        return undefined;
      }

      const prompt = promptNode.data.text.trim();

      if (!prompt) {
        return undefined;
      }

      const graphETag = await saveNow();

      if (!graphETag) {
        return undefined;
      }

      const idempotencyKey =
        providedKey ?? crypto.randomUUID();

      attemptsRef.current.set(generatorId, {
        idempotencyKey,
        scenario,
      });

      const response = await createGeneration(
        generationHref,
        {
          nodeId: generatorId,
          graphETag,
          scenario,
        },
        idempotencyKey,
      );

      startPolling(
        response.generation.links.self.href,
        response.generation.id,
        response.retryAfter
          ? response.retryAfter * 1000
          : 0,
      );

      return response;
    },
    [
      nodes,
      edges,
      saveNow,
      generationHref,
      startPolling,
    ],
  );

  const retryGeneration = useCallback(
    (generatorId: string) => {
      const attempt =
        attemptsRef.current.get(generatorId);

      if (!attempt) {
        return generate(generatorId, 'success');
      }

      return generate(
        generatorId,
        attempt.scenario,
        attempt.idempotencyKey,
      );
    },
    [generate],
  );

  const restoreGeneration = useCallback(
    (item: GenerationData) => {
      if (item.status === 'succeeded') {
        if (item.imageUrl) {
          setResultImage(
            item.resultNodeId,
            item.imageUrl,
          );
        }

        return;
      }

      if (item.status === 'processing') {
        startPolling(
          item.links.self.href,
          item.id,
          0,
        );

        return;
      }

      if (item.status === 'failed') {
        return;
      }
    },
    [setResultImage, startPolling],
  );

  const restoreGenerations = useCallback(
    (generations: GenerationData[]) => {
      const latestByResultNode = new Map<
        string,
        GenerationData
      >();

      for (const item of generations) {
        if (!latestByResultNode.has(item.resultNodeId)) {
          latestByResultNode.set(
            item.resultNodeId,
            item,
          );
        }
      }

      for (const item of latestByResultNode.values()) {
        restoreGeneration(item);
      }
    },
    [restoreGeneration],
  );

  return {
    generate,
    retryGeneration,
    restoreGeneration,
    restoreGenerations,
    generation,
    generationStatus: status,
    generationError: error,
    stopGenerationPolling: stopPolling,
  };
}