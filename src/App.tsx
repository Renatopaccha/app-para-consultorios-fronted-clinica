import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// ==========================================
// Vistas Temporales (Placeholders)
// ==========================================

const DashboardPlaceholder = () => {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl rounded-lg bg-white p-10 text-center shadow-lg border-t-4 border-blue-600">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Dashboard Principal de Zenda</h1>
        <p className="mt-4 text-lg text-gray-600 mb-8">Bienvenido a tu panel de gestión médica.</p>
        <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded font-bold">Cerrar Sesión</button>
      </div>
    </div>
  );
};

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
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Ruta Raíz Dinámica */}
          <Route path="/" element={<RootRedirect />} />

          {/* Rutas Protegidas (Requieren Sesión Activa) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
            {/* Aquí agregaremos futuras rutas como /schedule, /patients, etc. */}
          </Route>

          {/* Catch-All para rutas no definidas (Redirige a la raíz) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
