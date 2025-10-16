import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import CreateWorkOrder from './pages/CreateWorkOrder';
import PhotoUploadPage from './pages/PhotoUploadPage';
import StatusUpdatePage from './pages/StatusUpdatePage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import ReleaseNotesPage from './pages/ReleaseNotesPage';
import { useAuth } from './hooks/useAuth';
import InstallPrompt from './components/common/InstallPrompt';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  useEffect(() => {
    // Android PWA fixes
    const handleResize = () => {
      // Fix for Android keyboard resize issues
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial viewport height
    handleResize();

    // Listen for resize events (keyboard open/close on Android)
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Prevent zoom on double tap for Android
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <InstallPrompt />
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/work-orders"
                element={
                  <ProtectedRoute>
                    <WorkOrdersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/work-orders/create"
                element={
                  <ProtectedRoute>
                    <CreateWorkOrder />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/work-orders/:id"
                element={
                  <ProtectedRoute>
                    <WorkOrderDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/work-orders/:id/photos/add"
                element={
                  <ProtectedRoute>
                    <PhotoUploadPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <AlertsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/release-notes"
                element={
                  <ProtectedRoute>
                    <ReleaseNotesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/work-orders/:id/update-status"
                element={
                  <ProtectedRoute>
                    <StatusUpdatePage />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;