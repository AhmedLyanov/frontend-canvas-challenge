import {
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';

import type { CanvasNode } from '@/entities/graph';

import { useCanvasContext } from '../canvas-context';

export function PromptNode({
  id,
  data,
}: NodeProps<CanvasNode>) {
  if (!('text' in data)) {
    throw new Error('Prompt node has invalid data');
  }

  const { updateNodeData } = useCanvasContext();

  return (
    <div className="w-64 rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 font-medium">
        Prompt
      </div>

      <textarea
        value={data.text}
        onChange={(event) => {
          updateNodeData(id, {
            text: event.target.value,
          });
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        className="nodrag nowheel w-full resize-none rounded-md border p-2 text-sm outline-none"
        rows={4}
        aria-label="Image description"
        placeholder="Describe the image..."
      />

      <Handle
        type="source"
        position={Position.Right}
        aria-label="Prompt output"
      />
    </div>
  );
}