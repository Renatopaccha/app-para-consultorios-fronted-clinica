import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import AcceptInvitation from './pages/AcceptInvitation';
import ForgotPassword from './pages/ForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardIndex from './pages/dashboard/DashboardIndex';
import DoctorProfileView from './pages/dashboard/DoctorProfileView';
import ServicesView from './pages/dashboard/ServicesView';
import CertificationsView from './pages/dashboard/CertificationsView';
import WorkScheduleView from './pages/dashboard/WorkScheduleView';
import ReviewsView from './pages/dashboard/ReviewsView';
import WalletView from './pages/dashboard/WalletView';

// ==========================================
// Componente interno que decide dinámicamente si enviar al usuario 
// al dashboard o al login basado en su estado actual.
// ==========================================
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Evita redirecciones falsas mientras carga la app

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

// ==========================================
// Configuración de Enrutamiento Principal
// ==========================================
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Ruta Raíz Dinámica */}
          <Route path="/" element={<RootRedirect />} />

          {/* Rutas Protegidas (Requieren Sesión Activa) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardIndex />} />
              <Route path="profile" element={<DoctorProfileView />} />
              <Route path="services" element={<ServicesView />} />
              <Route path="certifications" element={<CertificationsView />} />
              <Route path="schedule" element={<WorkScheduleView />} />
              <Route path="reviews" element={<ReviewsView />} />
              <Route path="wallet" element={<WalletView />} />
            </Route>
          </Route>

          {/* Catch-All para rutas no definidas (Redirige a la raíz) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
