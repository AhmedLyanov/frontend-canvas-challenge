import type {
  Edge as ReactFlowEdge,
  Node as ReactFlowNode,
} from "@xyflow/react";

import type {
  GraphData,
  NodeData,
} from "@canvas/contracts";

export type CanvasNodeData =
  | {
      text: string;
    }
  | {
      label: string;
      imageUrl?: string | null;
    };

export type CanvasNode = ReactFlowNode<
  CanvasNodeData,
  "prompt" | "generator" | "result"
>;

export type CanvasEdge = ReactFlowEdge;

export function toCanvasNodes(
  nodes: NodeData[],
): CanvasNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  }));
}

export function toCanvasEdges(
  edges: GraphData["edges"],
): CanvasEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));
}

export function toGraphData(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  viewport: GraphData["viewport"],
): GraphData {
  return {
    nodes: nodes.map((node): NodeData => {
      switch (node.type) {
        case "prompt":
          return {
            id: node.id,
            type: "prompt",
            position: {
              x: node.position.x,
              y: node.position.y,
            },
            data: {
              text: getPromptText(node.data),
            },
          };

        case "generator":
          return {
            id: node.id,
            type: "generator",
            position: {
              x: node.position.x,
              y: node.position.y,
            },
            data: {
              label: getLabel(node.data),
            },
          };

        case "result":
          return {
            id: node.id,
            type: "result",
            position: {
              x: node.position.x,
              y: node.position.y,
            },
            data: {
              label: getLabel(node.data),
            },
          };
      }
    }),

    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),

    viewport,
  };
}

function getPromptText(
  data: CanvasNodeData,
): string {
  if ("text" in data) {
    return data.text;
  }

  return "";
}

function getLabel(
  data: CanvasNodeData,
): string {
  if ("label" in data) {
    return data.label;
  }

  return "";
}