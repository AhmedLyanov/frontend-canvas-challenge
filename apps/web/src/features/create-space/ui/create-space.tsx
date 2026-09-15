import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSpace } from '@/entities/space/api';

export function CreateSpace() {
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  async function handleSubmit() {
    const space = await createSpace('/api/spaces', {
      title,
    });

    navigate(`/spaces/${space.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-content-secondary">Название пространства</label>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Название"
          className="w-full rounded-lg border border-border-subtle bg-surface-base px-4 py-2.5 text-sm text-content-primary placeholder:text-content-disabled outline-none transition-colors focus:border-border-focus focus:bg-surface-raised"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="group relative w-full rounded-lg bg-surface-inverse px-4 py-2.5 text-sm font-medium text-content-inverse transition-all hover:bg-surface-inverse-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-overlay disabled:text-content-disabled"
      >
        Создать пространство
      </button>
    </div>
  );
}
