import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import EkycFlow from './pages/Ekyc/EkycFlow';
import Settings from './pages/Settings';
import AiChat from './pages/AiChat';
import Wallet from './pages/Wallet';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import { api } from './lib/api';
import { AUTH_STATE_CHANGED_EVENT } from './lib/authEvents';
import { trackUserEvent } from './lib/analytics';
import { GlobalPockie } from './components/GlobalPockie';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useIsMobileWeb } from './hooks/useIsMobileWeb';
import './pages/Ekyc/Ekyc.css';

function ProtectedRoute({ isAuthenticated, children }: { isAuthenticated: boolean; children: ReactNode }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="ekyc-container">
      <h1 className="ekyc-title">{title}</h1>
      <p style={{ textAlign: 'center', color: '#6b7280' }}>
        Trang này đang được hoàn thiện. Hiện tại bạn có thể dùng dashboard và eKYC trước.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <NavLink to="/dashboard" className="ekyc-btn" style={{ width: 'auto', padding: '12px 24px' }}>
          Quay lại dashboard
        </NavLink>
      </div>
    </div>
  );
}

function RouteTracker({ isAuthenticated }: { isAuthenticated: boolean }) {
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    const feature =
      location.pathname.startsWith('/dashboard') ? 'finance_dashboard' :
        location.pathname.startsWith('/ekyc') ? 'ocr' :
          location.pathname.startsWith('/ai-chat') ? 'chat' :
            location.pathname.startsWith('/mission') ? 'streak' :
              undefined;

    trackUserEvent({
      eventName: 'page_view',
      page: location.pathname,
      feature,
    });
  }, [isAuthenticated, location.pathname]);

  return null;
}

function MobileChrome({ isAuthenticated, isMobile }: { isAuthenticated: boolean; isMobile: boolean }) {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('mobile-web-mode', isMobile);

    return () => {
      document.body.classList.remove('mobile-web-mode');
    };
  }, [isMobile]);

  if (!isAuthenticated || !isMobile) return null;

  const hiddenRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/ekyc'];
  if (hiddenRoutes.some((path) => location.pathname.startsWith(path))) {
    return null;
  }

  return <MobileBottomNav />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const isMobile = useIsMobileWeb();

  useEffect(() => {
    async function bootstrapSession() {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken) {
        setIsAuthenticated(false);
        setIsBootstrapping(false);
        return;
      }

      try {
        await api.get('/api/v1/auth/me');
        setIsAuthenticated(true);
      } catch (error: any) {
        if (error.response?.status === 401 && refreshToken) {
          try {
            const res = await api.post('/api/v1/auth/refresh', { refreshToken });
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            await api.get('/api/v1/auth/me');
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsAuthenticated(false);
        }
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrapSession();
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem('accessToken')));
    };

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  if (isBootstrapping) {
    return null;
  }

  return (
    <BrowserRouter>
      <RouteTracker isAuthenticated={isAuthenticated} />
      <MobileChrome isAuthenticated={isAuthenticated} isMobile={isMobile} />
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ekyc"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <EkycFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ComingSoon title="Insights" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ComingSoon title="Giao dịch" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Goals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ComingSoon title="Mission" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AiChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ComingSoon title="Danh mục chi tiêu" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
      {isAuthenticated && !isMobile && <GlobalPockie />}
    </BrowserRouter>
  );
}

export default App;
