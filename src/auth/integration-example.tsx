// Example integration with App.tsx
// This shows how to integrate the new Tauri-only authentication system

import { Routes, Route } from 'react-router-dom';
import { AuthGate } from './index';
import { useAuthStore } from './index';

// Your existing app content
function AppContent() {
  const { user, logout } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with user info */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Author Studio</h1>
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Welcome, {user.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/books/:id" element={<BookDetailsPage />} />
          <Route path="/characters/:id" element={<CharacterDetailsPage />} />
        </Routes>
      </main>
    </div>
  );
}

// Example dashboard page
function DashboardPage() {
  const { user } = useAuthStore();
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-300">
          Hello {user?.name}, welcome to your writing dashboard!
        </p>
      </div>
    </div>
  );
}

// Example editor page 
function EditorPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Editor</h2>
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-300">
          Your TipTap editor would go here...
        </p>
        {/* Add your existing editor component here */}
      </div>
    </div>
  );
}

// Example book details page
function BookDetailsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Book Details</h2>
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-300">Book details would go here...</p>
      </div>
    </div>
  );
}

// Example character details page
function CharacterDetailsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Character Details</h2>
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-300">Character details would go here...</p>
      </div>
    </div>
  );
}

// Main App component with AuthGate protection
function App() {
  return (
    <AuthGate
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Author Studio</h1>
            <p className="text-gray-400 mb-8">Please log in to continue</p>
            <div className="space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                Sign In
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      }
    >
      <AppContent />
    </AuthGate>
  );
}

export default App;

/**
 * To integrate with your existing App.tsx:
 * 
 * 1. Import the AuthGate:
 *    import { AuthGate } from './auth';
 * 
 * 2. Wrap your main app content:
 *    function App() {
 *      return (
 *        <AuthGate>
 *          <YourExistingAppContent />
 *        </AuthGate>
 *      );
 *    }
 * 
 * 3. Replace the old AuthProvider and AuthContext with useAuthStore:
 *    import { useAuthStore } from './auth';
 *    
 *    function SomeComponent() {
 *      const { user, login, logout } = useAuthStore();
 *      // Use the auth state...
 *    }
 * 
 * 4. Remove old auth-related components:
 *    - Remove contexts/AuthContext.tsx (replaced by useAuthStore)
 *    - Remove components/ProtectedRoute.tsx (replaced by AuthGate)
 *    - Update login/signup pages to use new auth store
 * 
 * 5. Update environment variables:
 *    Add to .env:
 *    VITE_API_BASE_URL=https://your-api-server.com
 */
