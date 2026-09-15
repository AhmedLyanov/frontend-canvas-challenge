import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { CanvasNode } from '@/entities/graph';

import { useCanvasContext } from '../canvas-context';

export function GeneratorNode({ data, id }: NodeProps<CanvasNode>) {
  if (!('label' in data)) {
    throw new Error('Generator node has invalid data');
  }
  const { generate } = useCanvasContext();

  return (
    <div className="relative w-56 rounded-lg border bg-white p-4 shadow-sm">
      <Handle type="target" position={Position.Left} aria-label="Generator input" />

      <div className="font-medium">{data.label}</div>

      <div className="mt-1 text-sm text-gray-500">Image generator</div>
      <button
        type="button"
        onClick={() => generate(id)}
        className="mt-4 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Generate
      </button>
      <Handle type="source" position={Position.Right} aria-label="Generator output" />
    </div>
  );
}
