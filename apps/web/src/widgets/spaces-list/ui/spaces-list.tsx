import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { SpaceData } from '@canvas/contracts';
import { listSpaces } from '@/entities/space/api';

export function SpacesList() {
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadSpaces() {
      try {
        const data = await listSpaces('/api/spaces');

        setSpaces(data);
      } finally {
        setLoading(false);
      }
    }

    void loadSpaces();
  }, []);

  if (loading) {
    return <div className="text-sm text-content-muted">Загрузка пространств...</div>;
  }

  if (spaces.length === 0) {
    return <div className="text-sm text-content-muted">Пока нет созданных пространств</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {spaces.map((space) => (
        <button
          key={space.id}
          type="button"
          onClick={() => navigate(`/spaces/${space.id}`)}
          className="flex w-full items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-overlay"
        >
          <span className="font-medium text-content-primary">{space.title}</span>

          <span className="text-xs text-content-muted">Открыть</span>
        </button>
      ))}
    </div>
  );
}
