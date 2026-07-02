import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente Wrapper para proteger rutas que requieren autenticación.
 * 
 * Comportamiento:
 * 1. Si el estado global sigue cargando (verificando localStorage), muestra un spinner.
 * 2. Si termina de cargar y no hay usuario autenticado, redirige a /login.
 * 3. Si hay sesión, renderiza las rutas hijas mediante <Outlet />.
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-gray-500">Verificando sesión segura...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirige al login y reemplaza el historial para evitar que el botón "Atrás" haga un bucle
    return <Navigate to="/login" replace />;
  }

  // Renderiza el componente de la ruta anidada
  return <Outlet />;
};
