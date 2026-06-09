import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import RiskEvents from './pages/RiskEvents';
import ApiKeys from './pages/ApiKeys';
import Rules from './pages/Rules';
import Analytics from './pages/Analytics';
import Integrations from './pages/Integrations';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Docs from './pages/Docs';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Blocklist from './pages/Blocklist';
import RiskSimulator from './pages/RiskSimulator';
import ReviewQueue from './pages/ReviewQueue';
import Projects from './pages/Projects';
import FunnelProtection from './pages/FunnelProtection';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isDashboardEnabled, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isDashboardEnabled ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isDashboardEnabled, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated || !isDashboardEnabled ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="risk-events" element={<RiskEvents />} />
            <Route path="api-keys" element={<ApiKeys />} />
            <Route path="rules" element={<Rules />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
            <Route path="docs" element={<Docs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="blocklist" element={<Blocklist />} />
            <Route path="risk-simulator" element={<RiskSimulator />} />
            <Route path="review-queue" element={<ReviewQueue />} />
            <Route path="projects" element={<Projects />} />
            <Route path="funnel-protection" element={<FunnelProtection />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
