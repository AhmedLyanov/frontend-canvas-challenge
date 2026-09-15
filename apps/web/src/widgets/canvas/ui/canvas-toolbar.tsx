interface CanvasToolbarProps {
  onAddNode: (
    type: "prompt" | "generator" | "result",
  ) => void;
}

export function CanvasToolbar({
  onAddNode,
}: CanvasToolbarProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex gap-2 rounded-lg border bg-white p-2 shadow-sm">
      <button
        type="button"
        onClick={() => onAddNode("prompt")}
        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Add Prompt
      </button>

      <button
        type="button"
        onClick={() => onAddNode("generator")}
        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Add Generator
      </button>

      <button
        type="button"
        onClick={() => onAddNode("result")}
        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Add Result
      </button>
    </div>
  );
}