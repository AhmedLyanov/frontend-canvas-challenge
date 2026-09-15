import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from '@xyflow/react';
import { useCallback, useState } from 'react';

import { canConnect, type CanvasEdge, type CanvasNode } from '@/entities/graph';

const initialViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export function useGraphEditor() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [viewport, setViewport] = useState<Viewport>(initialViewport);

  const handleNodesChange = useCallback((changes: NodeChange<CanvasNode>[]) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));

    const removedIds = new Set<string>();

    for (const change of changes) {
      if (change.type === 'remove') {
        removedIds.add(change.id);
      }
    }

    if (removedIds.size === 0) {
      return;
    }

    setEdges((currentEdges) =>
      currentEdges.filter((edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target)),
    );
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      setEdges((currentEdges) => {
        if (!canConnect(nodes, currentEdges, connection.source!, connection.target!)) {
          return currentEdges;
        }

        return [
          ...currentEdges,
          {
            id: crypto.randomUUID(),
            source: connection.source!,
            target: connection.target!,
          },
        ];
      });
    },
    [nodes],
  );

  const setGraph = useCallback(
    (nextNodes: CanvasNode[], nextEdges: CanvasEdge[], nextViewport: Viewport) => {
      setNodes(nextNodes);
      setEdges(nextEdges);
      setViewport(nextViewport);
    },
    [],
  );
  const setResultImage = useCallback((nodeId: string, imageUrl: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== nodeId || node.type !== 'result') {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            imageUrl,
          },
        };
      }),
    );
  }, []);
  const addNode = useCallback(
    (type: CanvasNode['type']) => {
      const id = crypto.randomUUID();

      const node: CanvasNode = {
        id,
        type,
        position: {
          x: 100 + nodes.length * 40,
          y: 100 + nodes.length * 40,
        },
        data:
          type === 'prompt'
            ? { text: '' }
            : { label: type === 'generator' ? 'Generator' : 'Result' },
      };

      setNodes((currentNodes) => [...currentNodes, node]);
    },
    [nodes.length],
  );
  const updateNodeData = useCallback((nodeId: string, data: CanvasNode['data']) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data,
            }
          : node,
      ),
    );
  }, []);
  const handleViewportChange = useCallback((nextViewport: Viewport) => {
    setViewport(nextViewport);
  }, []);

  return {
    nodes,
    edges,
    setGraph,
    addNode,
    updateNodeData,
    setResultImage,
    viewport,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleViewportChange,
  };
}
