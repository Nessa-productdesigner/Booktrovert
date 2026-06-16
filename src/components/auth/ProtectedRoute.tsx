import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { session, profile, isInitialized } = useAuthStore();
  const location = useLocation();

  // If AuthProvider hasn't finished checking the session, render nothing
  // (AuthProvider already handles the global spinner, so this prevents flashing)
  if (!isInitialized) return null;

  // Not logged in -> Kick to login
  if (!session) {
    return <Navigate to="/auth?mode=login" state={{ from: location }} replace />;
  }

  // Logged in, but onboarding not complete -> Kick to onboarding
  // We only enforce this if the route requires onboarding (e.g. /shelf)
  if (requireOnboarding && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
