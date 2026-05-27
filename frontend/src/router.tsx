import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load screens
const HomeScreen = lazy(() => import('./screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const PostDetailScreen = lazy(() => import('./screens/PostDetailScreen').then(m => ({ default: m.PostDetailScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const SubmitNewsScreen = lazy(() => import('./screens/SubmitNewsScreen').then(m => ({ default: m.SubmitNewsScreen })));
const CreateChannelScreen = lazy(() => import('./screens/CreateChannelScreen').then(m => ({ default: m.CreateChannelScreen })));
const HighlightsScreen = lazy(() => import('./screens/HighlightsScreen').then(m => ({ default: m.HighlightsScreen })));
const TopicsScreen = lazy(() => import('./screens/TopicsScreen').then(m => ({ default: m.TopicsScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const SubscribeScreen = lazy(() => import('./screens/SubscribeScreen').then(m => ({ default: m.SubscribeScreen })));
const TrustScreen = lazy(() => import('./screens/TrustScreen').then(m => ({ default: m.TrustScreen })));
const AdminScreen = lazy(() => import('./screens/AdminScreen').then(m => ({ default: m.AdminScreen })));
const PublicLandingScreen = lazy(() => import('./screens/PublicLandingScreen').then(m => ({ default: m.PublicLandingScreen })));
const AboutScreen = lazy(() => import('./screens/AboutScreen').then(m => ({ default: m.AboutScreen })));
const LoginScreen = lazy(() => import('./auth/LoginScreen'));
const RegisterScreen = lazy(() => import('./auth/RegisterScreen'));

const LoadingScreen = () => (
  <div className="flex h-full w-full items-center justify-center bg-white p-20">
    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-300 animate-pulse">
      Syncing Tourane News...
    </div>
  </div>
);

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LazyLoad><PublicLandingScreen /></LazyLoad>
  },
  {
    path: '/about',
    element: <LazyLoad><AboutScreen /></LazyLoad>
  },
  {
    path: '/login',
    element: <LazyLoad><LoginScreen /></LazyLoad>
  },
  {
    path: '/register',
    element: <LazyLoad><RegisterScreen /></LazyLoad>
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
        element: <LazyLoad><HomeScreen /></LazyLoad>
      },
      {
        path: 'c/new',
        element: <LazyLoad><CreateChannelScreen /></LazyLoad>
      },
      {
        path: 'c/:slug',
        element: <LazyLoad><HomeScreen /></LazyLoad>
      },
      {
        path: 'p/:id',
        element: <LazyLoad><PostDetailScreen /></LazyLoad>
      },
      {
        path: 'u/:username',
        element: <LazyLoad><ProfileScreen /></LazyLoad>
      },
      {
        path: 'submit',
        element: <LazyLoad><SubmitNewsScreen /></LazyLoad>
      },
      {
        path: 'topics',
        element: <LazyLoad><TopicsScreen /></LazyLoad>
      },
      {
        path: 'highlights',
        element: <LazyLoad><HighlightsScreen /></LazyLoad>
      },
      {
        path: 'settings',
        element: <LazyLoad><SettingsScreen /></LazyLoad>
      },
      {
        path: 'subscribe',
        element: <LazyLoad><SubscribeScreen /></LazyLoad>
      },
      {
        path: 'trust',
        element: <LazyLoad><TrustScreen /></LazyLoad>
      },
      {
        path: 'admin',
        element: <LazyLoad><AdminScreen /></LazyLoad>
      }
    ]
  },
  {
    path: '/p/:id',
    element: <Navigate to="/app" replace />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
