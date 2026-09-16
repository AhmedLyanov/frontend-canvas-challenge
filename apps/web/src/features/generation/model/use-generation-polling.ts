import { useCallback, useEffect, useRef, useState } from 'react';

import type { GenerationData } from '@canvas/contracts';
import { getGeneration } from '@/entities/generation/api';

export interface UseGenerationPollingProps {
  onSucceeded: (generation: GenerationData) => void;
  onFailed: (generation: GenerationData) => void;
  pollIntervalMs?: number;
}

interface PollingState {
  status: 'idle' | 'processing' | 'succeeded' | 'failed';
  generation: GenerationData | null;
  error: string | null;
}

const DEFAULT_POLL_INTERVAL_MS = 1500;

export function useGenerationPolling({
  onSucceeded,
  onFailed,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseGenerationPollingProps) {
  const [state, setState] = useState<PollingState>({
    status: 'idle',
    generation: null,
    error: null,
  });

  const activeGenerationIdRef = useRef<string | null>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const stop = useCallback((generationId?: string) => {
    if (generationId) {
      const timer = timersRef.current.get(generationId);

      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(generationId);
      }

      if (activeGenerationIdRef.current === generationId) {
        activeGenerationIdRef.current = null;
      }

      return;
    }

    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }

    timersRef.current.clear();
    activeGenerationIdRef.current = null;
  }, []);

  const poll = useCallback(
    async function poll(href: string, generationId: string) {
      if (!timersRef.current.has(generationId)) {
        return;
      }

      try {
        const generation = await getGeneration(href);

        if (!timersRef.current.has(generationId)) {
          return;
        }

        if (generation.status === 'succeeded') {
          setState({
            status: 'succeeded',
            generation,
            error: null,
          });
          timersRef.current.delete(generationId);
          onSucceeded(generation);
          return;
        }

        if (generation.status === 'failed') {
          setState({
            status: 'failed',
            generation,
            error: generation.failureCode ?? 'Generation failed',
          });
          timersRef.current.delete(generationId);
          onFailed(generation);
          return;
        }

        setState({
          status: 'processing',
          generation,
          error: null,
        });

        const timer = setTimeout(() => {
          timersRef.current.delete(generationId);
          void poll(href, generationId);
        }, pollIntervalMs);

        timersRef.current.set(generationId, timer);
      } catch (error) {
        if (!timersRef.current.has(generationId)) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Generation status request failed';
        setState((current) => ({
          ...current,
          error: message,
        }));

        const timer = setTimeout(() => {
          timersRef.current.delete(generationId);
          void poll(href, generationId);
        }, pollIntervalMs);

        timersRef.current.set(generationId, timer);
      }
    },
    [onFailed, onSucceeded, pollIntervalMs],
  );

  const start = useCallback(
    (href: string, generationId: string, initialDelay = 0) => {
      activeGenerationIdRef.current = generationId;

      if (timersRef.current.has(generationId)) {
        clearTimeout(timersRef.current.get(generationId));
      }

      setState({
        status: 'processing',
        generation: null,
        error: null,
      });

      const timer = setTimeout(
        () => {
          timersRef.current.delete(generationId);
          void poll(href, generationId);
        },
        initialDelay > 0 ? initialDelay : 0,
      );

      timersRef.current.set(generationId, timer);
    },
    [poll],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ...state,
    start,
    stop,
  };
}
