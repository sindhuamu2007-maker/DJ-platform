import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider } from './context/RoomContext';
import { Navbar } from './components/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { MusicRoomPage } from './pages/MusicRoomPage';
import { AIDJDashboardPage } from './pages/AIDJDashboardPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { SoundclashPage } from './pages/SoundclashPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neon-purple text-xs font-semibold animate-pulse">
        Authenticating DJ Session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoomProvider>
          <div className="min-h-screen bg-dark-950 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Main App Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/room/:id" element={<ProtectedRoute><MusicRoomPage /></ProtectedRoute>} />
                <Route path="/ai-dj" element={<ProtectedRoute><AIDJDashboardPage /></ProtectedRoute>} />
                <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
                <Route path="/soundclash" element={<ProtectedRoute><SoundclashPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
