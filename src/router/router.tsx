import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CategorySearchPage } from '../features/resource-categories/pages/CategorySearchPage';
import { CategoryTreePage } from '../features/resource-categories/pages/CategoryTreePage';
import { RegionsPage } from '../features/reference-data/pages/RegionsPage';
import { SuppliersPage } from '../features/reference-data/pages/SuppliersPage';
import { UnitsPage } from '../features/reference-data/pages/UnitsPage';
import { ResourceDetailPage } from '../features/resources/pages/ResourceDetailPage';
import { ResourceListPage } from '../features/resources/pages/ResourceListPage';
import { Dashboard, Login, NotFound } from '../pages';
import { RouteErrorBoundary } from '../shared/components';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <Login />
      </PublicOnlyRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'resource-categories', element: <CategoryTreePage /> },
      { path: 'resource-categories/search', element: <CategorySearchPage /> },
      { path: 'resources', element: <ResourceListPage /> },
      { path: 'resources/:id', element: <ResourceDetailPage /> },
      { path: 'reference-data/units', element: <UnitsPage /> },
      { path: 'reference-data/regions', element: <RegionsPage /> },
      { path: 'reference-data/suppliers', element: <SuppliersPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
