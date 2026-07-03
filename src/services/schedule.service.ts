import { apiClient } from './api';

// ─────────────────────────────────────────────────────────
// TYPES — Contrato exacto que el backend DEBE retornar
// ─────────────────────────────────────────────────────────

/**
 * Estado de una cita. El backend debe usar exactamente estos valores en su ENUM.
 * ⚠️ AUDITORÍA: Ver reporte al final del componente para campos faltantes.
 */
export type AppointmentStatus =
  | 'CONFIRMED'
  | 'ATTENDANCE_CONFIRMED'
  | 'PENDING'
  | 'BLOCKED_GOOGLE';

/**
 * Estructura de una cita tal como la devuelve GET /api/appointments
 */
export interface Appointment {
  id: string;
  title: string;                  // Ej: "Consulta General"
  patient_name?: string | null;   // Nombre del paciente (null en bloqueos)
  start_datetime: string;         // ISO 8601: "2026-07-03T09:00:00Z"
  duration_minutes: number;       // Duración en minutos
  status: AppointmentStatus;
  clinic_id: string;              // FK a la clínica
  // ⚠️ CAMPOS PENDIENTES EN BACKEND — ver reporte
  // payment_status?: 'PAID' | 'PENDING_CASH' | 'PENDING_TRANSFER' | 'WAIVED';
  // appointment_type?: 'IN_PERSON' | 'TELEMEDICINE' | 'HOME_VISIT';
  // notes?: string;
  // patient_id?: string;
}

/**
 * Clínica/Sede del doctor. Devuelta por GET /api/clinics
 */
export interface Clinic {
  id: string;
  name: string;
  address?: string;
  color?: string;   // ⚠️ CAMPO PENDIENTE — color hex para identificar la sede en el calendario
}

/**
 * Un turno dentro de un día de disponibilidad
 */
export interface AvailabilityShift {
  start_time: string; // "HH:mm" en formato 24h
  end_time: string;   // "HH:mm" en formato 24h
}

/**
 * Disponibilidad de un día de la semana para una clínica específica
 */
export interface DoctorAvailabilityDay {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Lun, 6=Dom (ISO: Lunes=0)
  is_active: boolean;
  shifts: AvailabilityShift[];
}

/**
 * Disponibilidad base de un doctor para una clínica. Devuelta por GET /api/doctors/schedules
 */
export interface DoctorSchedule {
  clinic_id: string;
  days: DoctorAvailabilityDay[];
}

/**
 * Métricas para el widget de resumen. Devuelta por GET /api/metrics
 */
export interface CalendarMetrics {
  type: 'daily' | 'weekly' | 'monthly';
  // Diario
  total_today?: number;
  confirmed_today?: number;
  pending_today?: number;
  // Semanal
  total_week?: number;
  confirmed_week?: number;
  pending_week?: number;
  blocked_hours_week?: number;
  // Mensual
  patients_attended_month?: number;
  new_patients_month?: number;
  cancelled_month?: number;
}

// ─────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Obtiene las citas en un rango de fechas.
 * @param start ISO date string "YYYY-MM-DD"
 * @param end   ISO date string "YYYY-MM-DD"
 * @param clinicId Opcional — filtra por sede
 */
export const getAppointments = async (
  start: string,
  end: string,
  clinicId?: string
): Promise<Appointment[]> => {
  const params: Record<string, string> = { start, end };
  if (clinicId && clinicId !== 'all') params.clinic_id = clinicId;
  const response = await apiClient.get<Appointment[]>('/api/appointments', { params });
  return response.data;
};

/**
 * Obtiene las clínicas/sedes del doctor autenticado.
 */
export const getClinics = async (): Promise<Clinic[]> => {
  const response = await apiClient.get<Clinic[]>('/api/clinics');
  return response.data;
};

/**
 * Obtiene la configuración de disponibilidad base del doctor.
 * Opcional: filtrar por clínica.
 */
export const getDoctorSchedules = async (clinicId?: string): Promise<DoctorSchedule[]> => {
  const params: Record<string, string> = {};
  if (clinicId && clinicId !== 'all') params.clinic_id = clinicId;
  const response = await apiClient.get<DoctorSchedule[]>('/api/doctors/schedules', { params });
  return response.data;
};

/**
 * Obtiene las métricas del widget de resumen.
 * @param type 'daily' | 'weekly' | 'monthly'
 * @param date ISO date string para determinar el período
 */
export const getCalendarMetrics = async (
  type: 'daily' | 'weekly' | 'monthly',
  date: string
): Promise<CalendarMetrics> => {
  const response = await apiClient.get<CalendarMetrics>('/api/metrics', {
    params: { type, date },
  });
  return response.data;
};

/**
 * Guarda la disponibilidad base del doctor para una clínica.
 * Endpoint: POST /api/doctors/schedules
 */
export const saveDoctorSchedule = async (payload: {
  clinic_id: string;
  days: DoctorAvailabilityDay[];
}): Promise<void> => {
  await apiClient.post('/api/doctors/schedules', payload);
};
