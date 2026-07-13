import { apiClient } from './api';

// ─────────────────────────────────────────────────────────
// TYPES — Contrato del Backend vs Interfaz de UI
// ─────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'MISSED'
  | 'BLOCKED_GOOGLE';

export type PaymentStatus =
  | 'PENDING_CASH'
  | 'PENDING_TRANSFER'
  | 'PAID'
  | 'WAIVED'
  | 'REFUNDED';

export type AppointmentDisplayCode =
  | 'CONFIRMED_PAYMENT_PENDING'
  | 'CONFIRMED_AND_PAID'
  | 'COMPLETED_PAYMENT_PENDING'
  | 'COMPLETED_AND_PAID'
  | 'CONFIRMATION_PENDING_PAYMENT_PENDING'
  | 'CONFIRMATION_PENDING_PAID'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'IN_PROGRESS';

export type AppointmentType =
  | 'IN_PERSON'
  | 'TELEMEDICINE'
  | 'HOME_VISIT';

export interface Appointment {
  id: string;
  title: string;                  
  patient_name: string | null;    
  start_datetime: string;         
  duration_minutes: number;       
  status: AppointmentStatus;
  clinic_id: string;              
  
  payment_status: PaymentStatus;
  appointment_type: AppointmentType;
  notes?: string | null;
  patient_id?: string;
  displayCode?: AppointmentDisplayCode;
  
  clinicProfile?: {
    name: string;
    color: string | null;
  };
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  color: string | null;
}

export interface AvailabilityShift {
  start_time: string; 
  end_time: string;   
}

export interface DoctorAvailabilityDay {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; 
  is_active: boolean;
  shifts: AvailabilityShift[];
}

export interface DoctorSchedule {
  clinic_id: string;
  days: DoctorAvailabilityDay[];
}

export interface CalendarMetrics {
  type: 'daily' | 'weekly' | 'monthly';
  total_today?: number;
  confirmed_today?: number;
  pending_today?: number;
  total_week?: number;
  confirmed_week?: number;
  pending_week?: number;
  blocked_hours_week?: number;
  patients_attended_month?: number;
  new_patients_month?: number;
  cancelled_month?: number;
}

// ─────────────────────────────────────────────────────────
// SERVICE FUNCTIONS (Mapeos a la API Real de Node.js)
// ─────────────────────────────────────────────────────────

export const getAppointments = async (
  _start: string,
  _end: string,
  _clinicId?: string
): Promise<Appointment[]> => {
  const response = await apiClient.get<any[]>('/api/bookings');
  
  // Mapeamos lo que Prisma retorna al contrato exacto que espera la UI
  return response.data.map(appt => ({
    ...appt,
    title: appt.serviceNameSnapshot || appt.service?.name || 'Cita',
    patient_name: appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}`.trim() : null,
    start_datetime: appt.startDatetime || appt.startsAt,
    duration_minutes: appt.serviceDurationMinutesSnapshot || appt.service?.duration || 30,
    clinic_id: appt.clinicProfileId,
    payment_status: appt.paymentStatus,
    displayCode: appt.displayCode,
  }));
};

export const getClinics = async (): Promise<Clinic[]> => {
  // Ruta real en Node: clinic.routes.ts
  const response = await apiClient.get<Clinic[]>('/api/clinics/my-clinics');
  return response.data;
};

export const getDoctorSchedules = async (clinicId?: string): Promise<DoctorSchedule[]> => {
  const params: Record<string, string> = {};
  if (clinicId && clinicId !== 'all') params.clinicId = clinicId;
  
  // Ruta real en Node: doctor.routes.ts
  const response = await apiClient.get<any[]>('/api/doctors/schedules', { params });
  const rawSchedules = response.data;
  
  // Agrupamos la tabla plana de horarios en la jerarquía que espera la UI
  const grouped: Record<string, DoctorSchedule> = {};
  
  rawSchedules.forEach(sched => {
    const cid = sched.workplace?.clinicProfile?.id;
    if (!cid) return;
    
    if (!grouped[cid]) {
      grouped[cid] = {
        clinic_id: cid,
        days: [0, 1, 2, 3, 4, 5, 6].map(d => ({
          weekday: d as any,
          is_active: false,
          shifts: []
        }))
      };
    }
    
    const day = grouped[cid].days.find(d => d.weekday === sched.weekday);
    if (day) {
      day.is_active = true;
      day.shifts.push({ start_time: sched.startTime, end_time: sched.endTime });
    }
  });
  
  return Object.values(grouped);
};

export const getCalendarMetrics = async (
  type: 'daily' | 'weekly' | 'monthly',
  date: string
): Promise<CalendarMetrics> => {
  // Ruta real en Node: dashboard.routes.ts
  const response = await apiClient.get<CalendarMetrics>('/api/dashboard/metrics', {
    params: { type, date },
  });
  return response.data;
};

export const saveDoctorSchedule = async (payload: {
  clinic_id: string;
  days: DoctorAvailabilityDay[];
}): Promise<void> => {
  // Falta que el endpoint del backend esté mapeado idéntico, 
  // pero usaremos la ruta genérica definida.
  await apiClient.post('/api/doctors/schedules', payload);
};

export const createAppointment = async (payload: {
  clinicId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  title?: string;
  patientId?: string;
  serviceId?: string;
}): Promise<Appointment> => {
  try {
    const response = await apiClient.post<Appointment>('/api/doctors/appointments', payload);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};
