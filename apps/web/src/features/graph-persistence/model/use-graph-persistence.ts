import { useCallback, useEffect, useRef, useState } from 'react';

import type { CanvasEdge, CanvasNode } from '@/entities/graph';
import { toGraphData } from '@/entities/graph';
import {
  saveGraph,
  type SaveGraphResponse,
} from '@/entities/graph/api';

interface UseGraphPersistenceProps {
  href: string | null;
  etag: string | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  enabled: boolean;
}

export function useGraphPersistence({
  href,
  etag,
  nodes,
  edges,
  viewport,
  enabled,
}: UseGraphPersistenceProps) {
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const [error, setError] = useState<string | null>(null);

  const hrefRef = useRef<string | null>(href);
  const etagRef = useRef<string | null>(etag);

  const latestGraphRef = useRef(
    toGraphData(nodes, edges, viewport),
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);

  const saveChainRef = useRef<Promise<string | undefined>>(
    Promise.resolve(undefined),
  );

  const initializedRef = useRef(false);

  useEffect(() => {
    hrefRef.current = href;
    etagRef.current = etag;
  }, [href, etag]);

  useEffect(() => {
    latestGraphRef.current = toGraphData(
      nodes,
      edges,
      viewport,
    );

    if (!enabled) {
      initializedRef.current = false;
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    revisionRef.current += 1;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      const revision = revisionRef.current;

      saveChainRef.current = saveChainRef.current.then(
        async () => {
          if (savedRevisionRef.current >= revision) {
            return undefined;
          }

          const currentHref = hrefRef.current;
          const currentEtag = etagRef.current;

          if (!currentHref || !currentEtag) {
            return undefined;
          }

          const graph = latestGraphRef.current;

          setStatus('saving');
          setError(null);

          try {
            const response: SaveGraphResponse =
              await saveGraph(
                currentHref,
                graph,
                currentEtag,
              );

            etagRef.current = response.etag;

            savedRevisionRef.current = revision;

            setStatus('saved');
          } catch (error) {
            setStatus('error');

            setError(
              error instanceof Error
                ? error.message
                : 'Failed to save graph',
            );
          }

          return undefined;
        },
      );
    }, 500);
  }, [nodes, edges, viewport, enabled]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const saveNow = useCallback(
    async (): Promise<string | undefined> => {
      if (!enabled) {
        return undefined;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      revisionRef.current += 1;

      const revision = revisionRef.current;

      saveChainRef.current = saveChainRef.current.then(
        async () => {
          const currentHref = hrefRef.current;
          const currentEtag = etagRef.current;

          if (!currentHref || !currentEtag) {
            return undefined;
          }

          setStatus('saving');
          setError(null);

          try {
            const response = await saveGraph(
              currentHref,
              latestGraphRef.current,
              currentEtag,
            );

            etagRef.current = response.etag;

            savedRevisionRef.current = revision;

            setStatus('saved');

            return response.etag;
          } catch (error) {
            setStatus('error');

            setError(
              error instanceof Error
                ? error.message
                : 'Failed to save graph',
            );

            throw error;
          }
        },
      );

      return saveChainRef.current;
    },
    [enabled],
  );

  return {
    status,
    error,
    saveNow,
  };
}