import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  getGraph,
  toCanvasEdges,
  toCanvasNodes,
} from '@/entities/graph';
import { listGenerations } from '@/entities/generation/api';
import { getSpace } from '@/entities/space/api';
import {
  useGeneration,
  useGraphEditor,
  useGraphPersistence,
} from '@/features';
import { getConfig } from '@/shared/api/client';
import { Canvas } from '@/widgets/canvas';

export function SpacePage() {
  const { spaceId } = useParams();

  const graph = useGraphEditor();

  const [graphHref, setGraphHref] = useState<string | null>(null);
  const [graphEtag, setGraphEtag] = useState<string | null>(null);
  const [generationHref, setGenerationHref] = useState<string | null>(null);

  const [pollIntervalMs, setPollIntervalMs] = useState(1500);
  const [debounceMs, setDebounceMs] = useState(500);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getConfig();

        setPollIntervalMs(config.pollIntervalMs ?? 1500);
        setDebounceMs(config.debounceMs ?? 500);
      } catch {
        setPollIntervalMs(1500);
        setDebounceMs(500);
      }
    }

    void loadConfig();
  }, []);

  const reloadGraph = useCallback(async () => {
    if (!spaceId) {
      return;
    }

    const space = await getSpace(`/api/spaces/${spaceId}`);
    const graphResponse = await getGraph(space.links.graph.href);

    graph.setGraph(
      toCanvasNodes(graphResponse.graph.nodes),
      toCanvasEdges(graphResponse.graph.edges),
      graphResponse.graph.viewport,
    );

    setGraphEtag(graphResponse.etag);
  }, [spaceId, graph.setGraph]);

  const persistence = useGraphPersistence({
    href: graphHref,
    etag: graphEtag,
    nodes: graph.nodes,
    edges: graph.edges,
    viewport: graph.viewport,
    enabled: Boolean(graphHref && graphEtag),
    debounceMs,
    onReloadGraph: reloadGraph,
  });

  const generation = useGeneration({
    nodes: graph.nodes,
    edges: graph.edges,
    saveNow: persistence.saveNow,
    generationHref,
    setResultImage: graph.setResultImage,
    pollIntervalMs,
  });

  useEffect(() => {
    if (!spaceId) {
      return;
    }

    let cancelled = false;

    async function loadSpace() {
      try {
        setLoading(true);
        setError(null);

        const space = await getSpace(`/api/spaces/${spaceId}`);

        const graphResponse = await getGraph(
          space.links.graph.href,
        );

        const generations = await listGenerations(
          space.links.createGeneration.href,
        );

        if (cancelled) {
          return;
        }

        graph.setGraph(
          toCanvasNodes(graphResponse.graph.nodes),
          toCanvasEdges(graphResponse.graph.edges),
          graphResponse.graph.viewport,
        );

        setGraphHref(space.links.saveGraph.href);
        setGraphEtag(graphResponse.etag);
        setGenerationHref(
          space.links.createGeneration.href,
        );

        generation.restoreGenerations(generations);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load space',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSpace();

    return () => {
      cancelled = true;
    };
  }, [
    spaceId,
    graph.setGraph,
    generation.restoreGenerations,
  ]);

  if (!spaceId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-base text-content-secondary">
        Space not found
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-base text-content-secondary">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-base text-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-surface-base">
      <Canvas
        nodes={graph.nodes}
        edges={graph.edges}
        viewport={graph.viewport}
        onNodesChange={graph.handleNodesChange}
        onEdgesChange={graph.handleEdgesChange}
        onConnect={graph.handleConnect}
        onAddNode={graph.addNode}
        onUpdateNodeData={graph.updateNodeData}
        onViewportChange={graph.handleViewportChange}
        onGenerate={generation.generate}
      />

      <div className="pointer-events-none absolute right-4 top-4 z-10">
        <div className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-content-secondary shadow-sm">
          {persistence.status === 'idle' && 'Ready'}
          {persistence.status === 'saving' && 'Saving...'}
          {persistence.status === 'saved' && 'Saved'}
          {persistence.status === 'error' && 'Save failed'}
          {persistence.status === 'conflict' && 'Conflict'}
        </div>

        {persistence.error && (
          <div className="mt-2 max-w-xs rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-danger shadow-sm">
            {persistence.error}

            {persistence.status === 'conflict' && (
              <button
                type="button"
                onClick={() => {
                  void persistence.resolveConflict();
                }}
                className="mt-2 block w-full rounded-md bg-danger px-3 py-2 text-center text-sm font-medium text-white"
              >
                Reload graph
              </button>
            )}
          </div>
        )}

        {generation.generation && (
          <div className="mt-2 max-w-xs rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-content-secondary shadow-sm">
            <div className="font-medium text-content-primary">
              Generation
            </div>

            <div className="mt-1">
              {generation.generationStatus === 'idle' &&
                'Idle'}

              {generation.generationStatus ===
                'processing' && 'Processing'}

              {generation.generationStatus ===
                'succeeded' && 'Succeeded'}

              {generation.generationStatus ===
                'failed' && 'Failed'}
            </div>

            {generation.generationError && (
              <div className="mt-1 text-danger">
                {generation.generationError}
              </div>
            )}

            {generation.generationStatus === 'failed' && (
              <button
                type="button"
                onClick={() => {
                  if (generation.generation) {
                    void generation.retryGeneration(
                      generation.generation.nodeId,
                    );
                  }
                }}
                className="mt-2 block w-full rounded-md bg-surface-inverse px-3 py-2 text-center text-sm font-medium text-content-inverse"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}