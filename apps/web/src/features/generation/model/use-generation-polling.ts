import { useCallback, useEffect, useRef, useState } from 'react';

import type { GenerationData } from '@canvas/contracts';
import { getGeneration } from '@/entities/generation/api';

export interface UseGenerationPollingProps {
  onSucceeded: (generation: GenerationData) => void;
  onFailed: (generation: GenerationData) => void;
}

interface PollingState {
  status: 'idle' | 'processing' | 'succeeded' | 'failed';
  generation: GenerationData | null;
  error: string | null;
}

const POLL_INTERVAL_MS = 1500;

export function useGenerationPolling({ onSucceeded, onFailed }: UseGenerationPollingProps) {
  const [state, setState] = useState<PollingState>({
    status: 'idle',
    generation: null,
    error: null,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generationIdRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    generationIdRef.current = null;
  }, []);

  const poll = useCallback(
    async (href: string, generationId: string) => {
      if (generationIdRef.current !== generationId) {
        return;
      }

      try {
        const generation = await getGeneration(href);

        if (generationIdRef.current !== generationId) {
          return;
        }

        if (generation.status === 'succeeded') {
          setState({
            status: 'succeeded',
            generation,
            error: null,
          });

          onSucceeded(generation);
          stop();

          return;
        }

        if (generation.status === 'failed') {
          setState({
            status: 'failed',
            generation,
            error: generation.failureCode,
          });

          onFailed(generation);
          stop();

          return;
        }

        setState({
          status: 'processing',
          generation,
          error: null,
        });

        timerRef.current = setTimeout(() => {
          timerRef.current = null;

          void poll(href, generationId);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (generationIdRef.current !== generationId) {
          return;
        }

        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : 'Generation status request failed',
        }));

        timerRef.current = setTimeout(() => {
          timerRef.current = null;

          void poll(href, generationId);
        }, POLL_INTERVAL_MS);
      }
    },
    [onFailed, onSucceeded, stop],
  );

  const start = useCallback(
    (href: string, generationId: string, initialDelay = 0) => {
      stop();

      generationIdRef.current = generationId;

      setState({
        status: 'processing',
        generation: null,
        error: null,
      });

      timerRef.current = setTimeout(() => {
        timerRef.current = null;

        void poll(href, generationId);
      }, initialDelay);
    },
    [poll, stop],
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
