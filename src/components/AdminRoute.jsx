import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAILS = ['ompatel6355@gmail.com'];

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
