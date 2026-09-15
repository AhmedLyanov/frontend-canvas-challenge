import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const HomePage = lazy(() =>
  import('@/pages').then((module) => ({
    default: module.HomePage,
  })),
);

const SpacePage = lazy(() =>
  import('@/pages').then((module) => ({
    default: module.SpacePage,
  })),
);

function PageLoader() {
  return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: '/spaces/:spaceId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SpacePage />
      </Suspense>
    ),
  },
]);
