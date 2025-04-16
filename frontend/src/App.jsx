import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import PhotoUploadPage from './pages/PhotoUploadPage';
import StatusUpdatePage from './pages/StatusUpdatePage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './hooks/useAuth';

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
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
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
              path="/work-orders/:id/update-status"
              element={
                <ProtectedRoute>
                  <StatusUpdatePage />
                </ProtectedRoute>
              }
            />

            {/* Redirect to dashboard by default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;