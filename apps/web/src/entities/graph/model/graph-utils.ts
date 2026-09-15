import type { CanvasEdge, CanvasNode } from './react-flow-adapter';

function getNode(nodes: CanvasNode[], id: string): CanvasNode | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
  }

  return undefined;
}

export function canConnect(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) {
    return false;
  }

  const source = getNode(nodes, sourceId);
  const target = getNode(nodes, targetId);

  if (!source || !target) {
    return false;
  }

  if (source.type === 'prompt' && target.type === 'generator') {
    return !edges.some((edge) => edge.target === targetId);
  }

  if (source.type === 'generator' && target.type === 'result') {
    return !edges.some((edge) => edge.source === sourceId);
  }

  return false;
}

export function removeNode(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  nodeId: string,
): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  const nextNodes = nodes.filter((node) => node.id !== nodeId);

  const nextEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);

  return {
    nodes: nextNodes,
    edges: nextEdges,
  };
}

export function findResultNode(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  generatorId: string,
): CanvasNode | undefined {
  for (const edge of edges) {
    if (edge.source !== generatorId) {
      continue;
    }

    const target = getNode(nodes, edge.target);

    if (target?.type === 'result') {
      return target;
    }
  }

  return undefined;
}

export function findPromptNode(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  generatorId: string,
): CanvasNode | undefined {
  for (const edge of edges) {
    if (edge.target !== generatorId) {
      continue;
    }

    const source = getNode(nodes, edge.source);

    if (source?.type === 'prompt') {
      return source;
    }
  }

  return undefined;
}
