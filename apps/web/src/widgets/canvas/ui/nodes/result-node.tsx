import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

import type {
  CanvasNode,
} from "@/entities/graph";

export function ResultNode({
  data,
}: NodeProps<CanvasNode>) {
  if (!("label" in data)) {
    throw new Error("Result node has invalid data");
  }

  return (
    <div className="relative w-56 rounded-lg border bg-white p-4 shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Result input"
      />

      <div className="font-medium">
        {data.label}
      </div>

      <div className="mt-1 text-sm text-gray-500">
        Generated image
      </div>
    </div>
  );
}