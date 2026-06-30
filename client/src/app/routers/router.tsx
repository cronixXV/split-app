import { PageSkeleton } from '@/shared/ui/page-skeleton/page-skeleton';
import {
  Navigate,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

import { Suspense, lazy } from 'react';

const HomePage = lazy(() =>
  import('@/pages/home-page').then(module => ({
    default: module.HomePage,
  }))
);

const RoomPage = lazy(() =>
  import('@/pages/room-page').then(module => ({
    default: module.RoomPage,
  }))
);

function RootLayout() {
  return <Outlet />;
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <Navigate to="/" replace />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <HomePage />
    </Suspense>
  ),
});

const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms/$roomId',
  component: RoomRouteComponent,
});

function RoomRouteComponent() {
  const { roomId } = roomRoute.useParams();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <RoomPage roomId={roomId} />
    </Suspense>
  );
}

const routeTree = rootRoute.addChildren([homeRoute, roomRoute]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
