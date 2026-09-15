import { Handle, Position, type NodeProps } from '@xyflow/react';
import { resolveApiUrl } from '@/shared/api/client';
import type { CanvasNode } from '@/entities/graph';

export function ResultNode({ data }: NodeProps<CanvasNode>) {
  if (!('label' in data)) {
    throw new Error('Result node has invalid data');
  }

  return (
    <div className="relative w-56 rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm">
      <Handle type="target" position={Position.Left} aria-label="Result input" />

      <div className="font-medium text-content-primary">{data.label}</div>

      {data.imageUrl ? (
        <img
          src={resolveApiUrl(data.imageUrl)}
          alt="Generated result"
          className="mt-3 w-full rounded-md object-cover"
        />
      ) : (
        <div className="mt-1 text-sm text-content-muted">Generated image</div>
      )}
    </div>
  );
}
