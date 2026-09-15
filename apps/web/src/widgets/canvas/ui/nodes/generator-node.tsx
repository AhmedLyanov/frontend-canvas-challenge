import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { CanvasNode } from '@/entities/graph';

import { useCanvasContext } from '../canvas-context';

export function GeneratorNode({ data, id }: NodeProps<CanvasNode>) {
  if (!('label' in data)) {
    throw new Error('Generator node has invalid data');
  }
  const { generate } = useCanvasContext();

  return (
    <div className="relative w-56 rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm">
      <Handle type="target" position={Position.Left} aria-label="Generator input" />

      <div className="font-medium text-content-primary">{data.label}</div>

      <div className="mt-1 text-sm text-content-muted">Image generator</div>

      <button
        type="button"
        onClick={() => generate(id)}
        className="mt-4 w-full rounded-md bg-surface-inverse px-3 py-2 text-sm font-medium text-content-inverse transition-colors hover:bg-surface-inverse-hover"
      >
        Generate
      </button>

      <Handle type="source" position={Position.Right} aria-label="Generator output" />
    </div>
  );
}
