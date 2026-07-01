import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/auth/AuthPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import MainLayout from './components/layout/MainLayout';
import ShelfPage from './pages/shelf/ShelfPage';
import RecommendationsPage from './pages/recommendations/RecommendationsPage';
import SharePage from './pages/share/SharePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
          <Route path="/share/:token" element={<SharePage />} />

          {/* Protected Routes (require session) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Fully Protected Routes (require session AND onboarding_complete) */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/shelf" element={<ShelfPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
