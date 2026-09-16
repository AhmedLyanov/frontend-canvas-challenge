import { useCallback, useEffect, useRef, useState } from 'react';

import type { CanvasEdge, CanvasNode } from '@/entities/graph';
import { toGraphData } from '@/entities/graph';
import { saveGraph, type SaveGraphResponse } from '@/entities/graph/api';
import { ApiError } from '@/shared/api/errors';

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
  debounceMs?: number;
  onReloadGraph?: () => Promise<void> | void;
}

export function useGraphPersistence({
  href,
  etag,
  nodes,
  edges,
  viewport,
  enabled,
  debounceMs = 500,
  onReloadGraph,
}: UseGraphPersistenceProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [error, setError] = useState<string | null>(null);

  const hrefRef = useRef<string | null>(href);
  const etagRef = useRef<string | null>(etag);
  const latestGraphRef = useRef(toGraphData(nodes, edges, viewport));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const requestIdRef = useRef(0);
  const saveChainRef = useRef<Promise<string | undefined>>(Promise.resolve(undefined));
  const initializedRef = useRef(false);

  useEffect(() => {
    hrefRef.current = href;
    etagRef.current = etag;
  }, [href, etag]);

  const clearConflict = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const applyResponse = useCallback((revision: number, response: SaveGraphResponse) => {
    if (savedRevisionRef.current > revision) {
      return;
    }

    etagRef.current = response.etag;
    savedRevisionRef.current = revision;
    setStatus('saved');
    setError(null);
  }, []);

  const saveGraphNow = useCallback(
    async (revision: number) => {
      const currentHref = hrefRef.current;
      const currentEtag = etagRef.current;

      if (!currentHref || !currentEtag) {
        return undefined;
      }

      const requestId = ++requestIdRef.current;
      const graph = latestGraphRef.current;

      setStatus('saving');
      setError(null);

      try {
        const response = await saveGraph(currentHref, graph, currentEtag);

        if (requestId !== requestIdRef.current) {
          return undefined;
        }

        applyResponse(revision, response);
        return response.etag;
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return undefined;
        }

        if (error instanceof ApiError && error.code === 'GRAPH_VERSION_CONFLICT') {
          setStatus('conflict');
          setError('The graph changed on the server. Reload to review the latest version.');
          return undefined;
        }

        setStatus('error');
        setError(error instanceof Error ? error.message : 'Failed to save graph');
        throw error;
      }
    },
    [applyResponse],
  );

  useEffect(() => {
    latestGraphRef.current = toGraphData(nodes, edges, viewport);

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

      saveChainRef.current = saveChainRef.current.then(async () => {
        if (savedRevisionRef.current >= revision) {
          return undefined;
        }

        return saveGraphNow(revision);
      });
    }, debounceMs);
  }, [nodes, edges, viewport, enabled, debounceMs, saveGraphNow]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const saveNow = useCallback(async (): Promise<string | undefined> => {
    if (!enabled) {
      return undefined;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    revisionRef.current += 1;
    const revision = revisionRef.current;

    saveChainRef.current = saveChainRef.current.then(async () => {
      if (savedRevisionRef.current >= revision) {
        return undefined;
      }

      return saveGraphNow(revision);
    });

    return saveChainRef.current;
  }, [enabled, saveGraphNow]);

  const resolveConflict = useCallback(async () => {
    clearConflict();
    if (onReloadGraph) {
      await onReloadGraph();
    }
  }, [clearConflict, onReloadGraph]);

  return {
    status,
    error,
    saveNow,
    resolveConflict,
    clearConflict,
  };
}
