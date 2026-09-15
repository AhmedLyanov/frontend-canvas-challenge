import { useCallback } from 'react';

import type { GenerationData } from '@canvas/contracts';

import { findPromptNode, findResultNode, type CanvasEdge, type CanvasNode } from '@/entities/graph';
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

      setResultImage(generation.resultNodeId, generation.imageUrl);
    },
    [setResultImage],
  );
  const handleFailed = useCallback((generation: GenerationData) => {
    console.log('Generation failed:', generation);
  }, []);

  const {
    generation,
    status,
    error,
    start: startPolling,
    stop: stopPolling,
  } = useGenerationPolling({
    onSucceeded: handleSucceeded,
    onFailed: handleFailed,
  });

  const generate = useCallback(
    async (generatorId: string) => {
      if (!generationHref) {
        return;
      }

      const promptNode = findPromptNode(nodes, edges, generatorId);

      const resultNode = findResultNode(nodes, edges, generatorId);

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

      startPolling(response.generation.links.self.href, response.generation.id);
    },
    [nodes, edges, saveNow, generationHref, startPolling],
  );

  return {
    generate,
    generation,
    generationStatus: status,
    generationError: error,
    stopGenerationPolling: stopPolling,
  };
}
