import axios from 'axios';

/**
 * Instancia base de Axios preconfigurada para las peticiones de Zenda.
 * Toma la URL base desde las variables de entorno de Vite.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Este bloque intercepta todas las peticiones antes de que salgan del frontend.
 * Busca el token JWT en el localStorage y, si existe, lo adjunta en los headers
 * para autenticar la petición contra el backend de Zenda.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Buscar el token usando la llave específica
    const token = localStorage.getItem('zenda_token');
    
    // Si el token existe, agregarlo al header de Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
