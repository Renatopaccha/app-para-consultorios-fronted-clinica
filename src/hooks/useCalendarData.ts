import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import {
  getAppointments,
  getClinics,
  getDoctorSchedules,
  getCalendarMetrics,
  type Appointment,
  type Clinic,
  type DoctorSchedule,
  type CalendarMetrics,
} from '../services/schedule.service';

// ─────────────────────────────────────────────────────────
// LOCAL TYPES — Formato interno que usa el Time-Grid
// ─────────────────────────────────────────────────────────

/** Formato normalizado de cita para el Time-Grid */
export interface CalendarEvent {
  id: string;
  title: string;
  patientName?: string;
  startTime: string;    // "HH:mm" formato 24h local
  duration: number;     // minutos
  dayIndex: number;     // 0=Lun … 6=Dom relativo a la semana visible
  status: Appointment['status'];
  clinicId: string;
}

// ─────────────────────────────────────────────────────────
// ADAPTER — Transforma la respuesta del API al formato UI
// ─────────────────────────────────────────────────────────

/**
 * Convierte un Appointment del backend al CalendarEvent del Time-Grid.
 * Calcula el dayIndex relativo al lunes de la semana que el usuario está viendo.
 */
const adaptAppointment = (appt: Appointment, weekStart: Date): CalendarEvent | null => {
  const startDate = new Date(appt.start_datetime);
  // Normalizar al día sin zona horaria para comparar
  const startLocalDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  // Calcular dayIndex relativo al lunes de la semana visible
  let dayIndex = -1;
  for (let i = 0; i < 7; i++) {
    const weekDay = addDays(weekStart, i);
    const weekDayDate = new Date(weekDay.getFullYear(), weekDay.getMonth(), weekDay.getDate());
    if (weekDayDate.getTime() === startLocalDate.getTime()) {
      dayIndex = i;
      break;
    }
  }

  // Si la cita no pertenece a la semana visible, ignorar
  if (dayIndex === -1) return null;

  const hh = startDate.getHours().toString().padStart(2, '0');
  const mm = startDate.getMinutes().toString().padStart(2, '0');

  return {
    id: appt.id,
    title: appt.title,
    patientName: appt.patient_name ?? undefined,
    startTime: `${hh}:${mm}`,
    duration: appt.duration_minutes,
    dayIndex,
    status: appt.status,
    clinicId: appt.clinic_id,
  };
};

// ─────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────

interface UseCalendarDataParams {
  currentDate: Date;
  selectedClinic: string;
  summaryType: 'daily' | 'weekly' | 'monthly';
}

interface UseCalendarDataReturn {
  events: CalendarEvent[];
  clinics: Clinic[];
  schedules: DoctorSchedule[];
  metrics: CalendarMetrics | null;
  isLoadingEvents: boolean;
  isLoadingClinics: boolean;
  isLoadingSchedules: boolean;
  isLoadingMetrics: boolean;
  errorEvents: string | null;
  errorClinics: string | null;
  errorSchedules: string | null;
  errorMetrics: string | null;
  refetchEvents: () => void;
}

export function useCalendarData({
  currentDate,
  selectedClinic,
  summaryType,
}: UseCalendarDataParams): UseCalendarDataReturn {
  // ── State ──────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [metrics, setMetrics] = useState<CalendarMetrics | null>(null);

  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [errorClinics, setErrorClinics] = useState<string | null>(null);
  const [errorSchedules, setErrorSchedules] = useState<string | null>(null);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);

  // ── Week range (memoized) ──────────────────────────────
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(currentDate, { weekStartsOn: 1 });
  const startStr  = format(weekStart, 'yyyy-MM-dd');
  const endStr    = format(weekEnd,   'yyyy-MM-dd');
  const dateStr   = format(currentDate, 'yyyy-MM-dd');

  // ── Fetch: Appointments (re-runs on week or clinic change) ──
  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setErrorEvents(null);
    try {
      const raw = await getAppointments(startStr, endStr, selectedClinic);
      const adapted = raw
        .map(a => adaptAppointment(a, weekStart))
        .filter((e): e is CalendarEvent => e !== null);
      setEvents(adapted);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Error al cargar las citas.';
      setErrorEvents(message);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [startStr, endStr, selectedClinic]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch: Clinics (once on mount) ────────────────────
  const fetchClinics = useCallback(async () => {
    setIsLoadingClinics(true);
    setErrorClinics(null);
    try {
      const data = await getClinics();
      setClinics(data);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Error al cargar las sedes.';
      setErrorClinics(message);
    } finally {
      setIsLoadingClinics(false);
    }
  }, []);

  // ── Fetch: Doctor Schedules (re-runs on clinic change) ──
  const fetchSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    setErrorSchedules(null);
    try {
      const data = await getDoctorSchedules(selectedClinic);
      setSchedules(data);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Error al cargar horarios base.';
      setErrorSchedules(message);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [selectedClinic]);

  // ── Fetch: Metrics (re-runs on date or summaryType change) ──
  const fetchMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setErrorMetrics(null);
    try {
      const data = await getCalendarMetrics(summaryType, dateStr);
      setMetrics(data);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Error al cargar métricas.';
      setErrorMetrics(message);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [summaryType, dateStr]);

  // ── Effects ────────────────────────────────────────────
  useEffect(() => { fetchClinics(); }, [fetchClinics]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  return {
    events,
    clinics,
    schedules,
    metrics,
    isLoadingEvents,
    isLoadingClinics,
    isLoadingSchedules,
    isLoadingMetrics,
    errorEvents,
    errorClinics,
    errorSchedules,
    errorMetrics,
    refetchEvents: fetchEvents,
  };
}
