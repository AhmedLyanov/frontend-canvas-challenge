interface CanvasToolbarProps {
  onAddNode: (type: 'prompt' | 'generator' | 'result') => void;
}

export function CanvasToolbar({ onAddNode }: CanvasToolbarProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex gap-2 rounded-lg border border-border-subtle bg-surface-raised p-2 shadow-sm">
      <button
        type="button"
        onClick={() => onAddNode('prompt')}
        className="rounded-md border border-border-subtle px-3 py-2 text-sm text-content-secondary transition-colors hover:border-border-strong hover:bg-surface-overlay hover:text-content-primary"
      >
        Add Prompt
      </button>

      <button
        type="button"
        onClick={() => onAddNode('generator')}
        className="rounded-md border border-border-subtle px-3 py-2 text-sm text-content-secondary transition-colors hover:border-border-strong hover:bg-surface-overlay hover:text-content-primary"
      >
        Add Generator
      </button>

      <button
        type="button"
        onClick={() => onAddNode('result')}
        className="rounded-md border border-border-subtle px-3 py-2 text-sm text-content-secondary transition-colors hover:border-border-strong hover:bg-surface-overlay hover:text-content-primary"
      >
        Add Result
      </button>
    </div>
  );
}
