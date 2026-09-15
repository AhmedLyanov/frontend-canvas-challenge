import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from '@xyflow/react';
import { CanvasProvider } from './canvas-context';
import '@xyflow/react/dist/style.css';

import type { CanvasEdge, CanvasNode } from '@/entities/graph';

import { CanvasToolbar } from './canvas-toolbar';
import { GeneratorNode, PromptNode, ResultNode } from './nodes';

const nodeTypes = {
  prompt: PromptNode,
  generator: GeneratorNode,
  result: ResultNode,
};

export interface CanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: Viewport;

  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onAddNode: (type: 'prompt' | 'generator' | 'result') => void;
  onUpdateNodeData: (nodeId: string, data: CanvasNode['data']) => void;
  onViewportChange: (viewport: Viewport) => void;
}

export function Canvas({
  nodes,
  edges,
  viewport,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onUpdateNodeData,
  onViewportChange,
}: CanvasProps) {
  return (
    <CanvasProvider updateNodeData={onUpdateNodeData}>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          viewport={viewport}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onViewportChange={onViewportChange}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background />
          <Controls />
          <MiniMap />

          <CanvasToolbar onAddNode={onAddNode} />
        </ReactFlow>
      </div>
    </CanvasProvider>
  );
}
