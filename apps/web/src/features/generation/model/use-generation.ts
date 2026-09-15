import { useCallback } from 'react';

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
}

export function useGeneration({
  nodes,
  edges,
  saveNow,
  generationHref,
  setResultImage,
}: UseGenerationProps) {
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

  const {
    generation,
    status,
    error,
    start: startPolling,
    stop: stopPolling,
  } = useGenerationPolling({
    onSucceeded: handleSucceeded,
    onFailed: () => {},
  });

  const generate = useCallback(
    async (generatorId: string) => {
      if (!generationHref) {
        return;
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
        return;
      }

      if (!('text' in promptNode.data)) {
        return;
      }

      const prompt = promptNode.data.text.trim();

      if (!prompt) {
        return;
      }

      const graphETag = await saveNow();

      if (!graphETag) {
        return;
      }

      const idempotencyKey = crypto.randomUUID();

      const response = await createGeneration(
        generationHref,
        {
          nodeId: generatorId,
          graphETag,
          scenario: 'success',
        },
        idempotencyKey,
      );

      startPolling(
        response.generation.links.self.href,
        response.generation.id,
      );
    },
    [
      nodes,
      edges,
      saveNow,
      generationHref,
      startPolling,
    ],
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
        );

        return;
      }

      if (item.status === 'failed') {
        return;
      }
    },
    [
      setResultImage,
      startPolling,
    ],
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
    restoreGeneration,
    restoreGenerations,
    generation,
    generationStatus: status,
    generationError: error,
    stopGenerationPolling: stopPolling,
  };
}