/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load screens
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const PostDetailScreen = lazy(() => import('./screens/PostDetailScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const SubmitNewsScreen = lazy(() => import('./screens/SubmitNewsScreen'));
const CreateChannelScreen = lazy(() => import('./screens/CreateChannelScreen'));
const HighlightsScreen = lazy(() => import('./screens/HighlightsScreen'));
const TopicsScreen = lazy(() => import('./screens/TopicsScreen'));
const CategoriesScreen = lazy(() => import('./screens/CategoriesScreen'));
const SubscribeScreen = lazy(() => import('./screens/SubscribeScreen'));
const TrustScreen = lazy(() => import('./screens/TrustScreen'));
const AdminScreen = lazy(() => import('./screens/AdminScreen'));
const PartnerAdsScreen = lazy(() => import('./screens/PartnerAdsScreen'));
const PublicLandingScreen = lazy(() => import('./screens/PublicLandingScreen'));
const AboutScreen = lazy(() => import('./screens/AboutScreen'));
const LoginScreen = lazy(() => import('./auth/LoginScreen'));
const RegisterScreen = lazy(() => import('./auth/RegisterScreen'));

const NotFoundScreen = lazy(() => import('./screens/NotFoundScreen'));

const LoadingScreen = () => (
  <div className="flex h-full w-full items-center justify-center bg-[var(--color-app-bg)] p-20">
    <div className="text-[10px] font-mono font-bold text-zinc-300 animate-pulse">Syncing Tourane News...</div>
  </div>
);

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LazyLoad>
        <PublicLandingScreen />
      </LazyLoad>
    ),
  },
  {
    path: '/about',
    element: (
      <LazyLoad>
        <AboutScreen />
      </LazyLoad>
    ),
  },
  {
    path: '/login',
    element: (
      <LazyLoad>
        <LoginScreen />
      </LazyLoad>
    ),
  },
  {
    path: '/register',
    element: (
      <LazyLoad>
        <RegisterScreen />
      </LazyLoad>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyLoad>
            <HomeScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'c/new',
        element: (
          <LazyLoad>
            <CreateChannelScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'c/:slug',
        element: (
          <LazyLoad>
            <HomeScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'p/:id',
        element: (
          <LazyLoad>
            <PostDetailScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'u/:username',
        element: (
          <LazyLoad>
            <ProfileScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'submit',
        element: (
          <LazyLoad>
            <SubmitNewsScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'topics',
        element: (
          <LazyLoad>
            <TopicsScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'categories',
        element: (
          <LazyLoad>
            <CategoriesScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'category/:slug',
        element: (
          <LazyLoad>
            <CategoriesScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'tag/:slug',
        element: (
          <LazyLoad>
            <CategoriesScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'highlights',
        element: (
          <LazyLoad>
            <HighlightsScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'settings',
        element: <Navigate to="/app" replace />,
      },
      {
        path: 'subscribe',
        element: (
          <LazyLoad>
            <SubscribeScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'partner/ads',
        element: (
          <LazyLoad>
            <PartnerAdsScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'trust',
        element: (
          <LazyLoad>
            <TrustScreen />
          </LazyLoad>
        ),
      },
      {
        path: 'admin',
        element: <Navigate to="/admin" replace />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <LazyLoad>
          <AdminScreen />
        </LazyLoad>
      </ProtectedRoute>
    ),
  },
  {
    path: '/p/:id',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '*',
    element: (
      <LazyLoad>
        <NotFoundScreen />
      </LazyLoad>
    ),
  },
]);
