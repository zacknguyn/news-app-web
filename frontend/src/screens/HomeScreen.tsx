import React from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const HomeScreen: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to News App!</h1>

          {user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">User Information</h2>
              <div className="text-blue-800">
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id}</p>
                {user.role && <p><strong>Role:</strong> {user.role}</p>}
                {user.favoriteTopics && user.favoriteTopics.length > 0 && (
                  <p><strong>Favorite Topics:</strong> {user.favoriteTopics.join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
