import { CreateSpace } from '@/features/create-space';
import { SpacesList } from '@/widgets/spaces-list';

export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-6 text-content-primary">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Визуальный редактор</h1>

          <p className="mt-3 text-content-secondary">Создайте новое пространство</p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-2xl">
          <CreateSpace />
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-content-secondary">Ваши пространства</h2>

          <SpacesList />
        </div>
      </section>
    </main>
  );
}
