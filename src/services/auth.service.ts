import { apiClient } from './api';

/**
 * Interfaz que define las credenciales necesarias para iniciar sesión.
 */
export interface LoginCredentials {
  email: string;
  password?: string;
}

/**
 * Tipos de roles soportados por el backend de Zenda.
 */
export type Role = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'ASSISTANT' | 'PATIENT';

/**
 * Estructura de los datos del usuario que devuelve el backend.
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: Role;
}

/**
 * Respuesta esperada desde el endpoint de autenticación.
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Servicio encargado de la autenticación de usuarios (Login).
 * Realiza una petición POST al endpoint /api/auth/login.
 * 
 * @param credentials Objeto con el email y password.
 * @returns Promesa que resuelve a un objeto con la información del usuario (user) y el token JWT (token).
 */
export const loginService = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
  return response.data;
};

/**
 * Interfaz para los datos del registro, incluyendo campos dinámicos según el rol.
 */
export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: Role;
  licenseNumber?: string;
  consultationPrice?: number;
  name?: string; // Nombre de la clínica
  address?: string; // Dirección de la clínica
}

export interface InvitationValidation {
  valid: boolean;
  emailMasked: string;
  role: 'DOCTOR' | 'CLINIC_ADMIN';
  expiresAt: string;
}

export interface AcceptInvitationPayload {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  licenseNumber?: string;
  consultationPrice?: number;
  name?: string;
  address?: string;
}

/**
 * Servicio encargado del registro de nuevos usuarios.
 * Realiza una petición POST al endpoint /api/auth/register.
 */
export const registerService = async (data: RegisterCredentials): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/register', data);
  return response.data;
};

export const validateInvitationService = async (token: string): Promise<InvitationValidation> => {
  const response = await apiClient.get<InvitationValidation>('/api/auth/invitations/validate', { params: { token } });
  return response.data;
};

export const acceptInvitationService = async (payload: AcceptInvitationPayload): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/accept-invitation', payload);
  return response.data;
};

/**
 * Payload para el restablecimiento de contraseña.
 */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

/**
 * Servicio para solicitar el PIN de restablecimiento de contraseña.
 */
export const forgotPasswordService = async (email: string): Promise<void> => {
  await apiClient.post('/api/auth/forgot-password', { email });
};

/**
 * Servicio para restablecer la contraseña con el PIN.
 */
export const resetPasswordService = async (payload: ResetPasswordPayload): Promise<void> => {
  await apiClient.post('/api/auth/reset-password', payload);
};
