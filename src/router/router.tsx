import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AttributeDefinitionsPage } from '../features/admin/attribute-definitions/pages/AttributeDefinitionsPage';
import { FlaggedPricesPage } from '../features/admin/flagged-prices/pages/FlaggedPricesPage';
import { MarketAveragesPage } from '../features/admin/market-averages/pages/MarketAveragesPage';
import { MatchGroupReviewPage } from '../features/admin/match-groups/pages/MatchGroupReviewPage';
import { OrganizationsPage } from '../features/admin/organizations/pages/OrganizationsPage';
import { UsersPage } from '../features/admin/users/pages/UsersPage';
import { MyResourcesPage } from '../features/my-resources/pages/MyResourcesPage';
import { ProductDetailPage } from '../features/products/pages/ProductDetailPage';
import { ProductListPage } from '../features/products/pages/ProductListPage';
import { CategorySearchPage } from '../features/resource-categories/pages/CategorySearchPage';
import { CategoryTreePage } from '../features/resource-categories/pages/CategoryTreePage';
import { RegionsPage } from '../features/reference-data/pages/RegionsPage';
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
      { path: 'my-resources', element: <MyResourcesPage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'resources', element: <ResourceListPage /> },
      { path: 'resources/:id', element: <ResourceDetailPage /> },
      { path: 'reference-data/units', element: <UnitsPage /> },
      { path: 'reference-data/regions', element: <RegionsPage /> },
      { path: 'admin/organizations', element: <OrganizationsPage /> },
      { path: 'admin/users', element: <UsersPage /> },
      { path: 'admin/attribute-definitions', element: <AttributeDefinitionsPage /> },
      { path: 'admin/flagged-prices', element: <FlaggedPricesPage /> },
      { path: 'admin/match-groups', element: <MatchGroupReviewPage /> },
      { path: 'admin/market-averages', element: <MarketAveragesPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
