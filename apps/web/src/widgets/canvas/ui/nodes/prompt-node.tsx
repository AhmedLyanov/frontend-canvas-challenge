import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { CanvasNode } from '@/entities/graph';

import { useCanvasContext } from '../canvas-context';

export function PromptNode({ id, data }: NodeProps<CanvasNode>) {
  if (!('text' in data)) {
    throw new Error('Prompt node has invalid data');
  }

  const { updateNodeData } = useCanvasContext();

  return (
    <div className="w-64 rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm">
      <div className="mb-3 font-medium text-content-primary">Prompt</div>

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
        className="nodrag nowheel w-full resize-none rounded-md border border-border-subtle bg-surface-base p-2 text-sm text-content-primary placeholder:text-content-disabled outline-none transition-colors focus:border-border-focus"
        rows={4}
        aria-label="Image description"
        placeholder="Describe the image..."
      />

      <Handle type="source" position={Position.Right} aria-label="Prompt output" />
    </div>
  );
}
