import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { loginService } from '../services/auth.service';
import type { LoginCredentials, User } from '../services/auth.service';

/**
 * Interfaz que define el estado y las operaciones disponibles en el contexto de autenticación.
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

// Se inicializa el contexto como undefined para forzar el uso del custom hook dentro del Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del Contexto de Autenticación.
 * Maneja el estado global del usuario, la persistencia con localStorage y las operaciones de sesión.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Efecto que se ejecuta al montar para verificar si ya existe una sesión guardada
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedToken = localStorage.getItem('zenda_token');
        const storedUser = localStorage.getItem('zenda_user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
        } else {
          // Si falta alguno de los dos, nos aseguramos de limpiar el estado
          setUser(null);
        }
      } catch (error) {
        console.error('Error parseando los datos de usuario desde localStorage:', error);
        setUser(null);
      } finally {
        // Apagamos el loading state sin importar si la sesión existía o no
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Invoca al servicio de login y persiste la sesión si es exitoso.
   * Lanza errores para que puedan ser manejados por los componentes (ej. mostrar alertas).
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const { user: newUser, token } = await loginService(credentials);
      
      // Guardar en localStorage (el interceptor de Axios recogerá el zenda_token automáticamente)
      localStorage.setItem('zenda_token', token);
      localStorage.setItem('zenda_user', JSON.stringify(newUser));
      
      // Actualizar el estado en React
      setUser(newUser);
    } catch (error) {
      console.error('Fallo en la autenticación:', error);
      throw error; // Permitimos que el formulario de login maneje el error visualmente
    }
  };

  /**
   * Invoca al servicio de registro y persiste la sesión si es exitoso.
   */
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      const { user: newUser, token } = await registerService(credentials);
      
      localStorage.setItem('zenda_token', token);
      localStorage.setItem('zenda_user', JSON.stringify(newUser));
      
      setUser(newUser);
    } catch (error) {
      console.error('Fallo en el registro:', error);
      throw error;
    }
  };


  /**
   * Limpia toda la información de la sesión activa.
   */
  const logout = () => {
    localStorage.removeItem('zenda_token');
    localStorage.removeItem('zenda_user');
    setUser(null);
  };

  // Variable computada
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación de forma segura y tipada.
 * Lanza un error temprano si se usa fuera del árbol de componentes del AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('El hook useAuth debe ser utilizado exclusivamente dentro de un AuthProvider');
  }
  
  return context;
};
