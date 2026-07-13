import { useState, useMemo } from "react";
import { addWeeks, subWeeks, startOfWeek, addDays, format, isSameDay, startOfMonth, endOfMonth, endOfWeek, addMonths, subMonths, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, ChevronDown, ChevronLeft, ChevronRight, Building2, Calendar as CalendarIcon, Lock, CheckCircle2, Clock, AlertCircle, Loader2, Search, UserPlus, Maximize, Minimize, Info, Settings, Trash2, WifiOff, RefreshCw } from "lucide-react";
import { apiClient } from "../../services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/sheet";
import { Switch } from "../../components/ui/switch";
import { useCalendarData, type CalendarEvent } from "../../hooks/useCalendarData";
import { createAppointment } from "../../services/schedule.service";

// ─────────────────────────────────────────────────────────
// TYPES & MOCKS
// ─────────────────────────────────────────────────────────
type EventStatus = 'CONFIRMED' | 'ATTENDANCE_CONFIRMED' | 'PENDING' | 'BLOCKED_GOOGLE' | 'CONFIRMED_PAYMENT_PENDING' | 'CONFIRMED_AND_PAID' | 'COMPLETED_PAYMENT_PENDING' | 'COMPLETED_AND_PAID' | 'CONFIRMATION_PENDING_PAYMENT_PENDING' | 'CONFIRMATION_PENDING_PAID' | 'CANCELLED' | 'NO_SHOW' | 'IN_PROGRESS';

type ShiftTime = { hour: string; minute: string; ampm: string };
type Shift = { startTime: ShiftTime; endTime: ShiftTime };
type DaySchedule = { dayName: string; isActive: boolean; shifts: Shift[] };

const INITIAL_SCHEDULE: DaySchedule[] = [
  { dayName: 'Lunes', isActive: true, shifts: [{ startTime: { hour: '09', minute: '00', ampm: 'AM' }, endTime: { hour: '05', minute: '00', ampm: 'PM' } }] },
  { dayName: 'Martes', isActive: true, shifts: [{ startTime: { hour: '09', minute: '00', ampm: 'AM' }, endTime: { hour: '05', minute: '00', ampm: 'PM' } }] },
  { dayName: 'Miércoles', isActive: true, shifts: [{ startTime: { hour: '09', minute: '00', ampm: 'AM' }, endTime: { hour: '05', minute: '00', ampm: 'PM' } }] },
  { dayName: 'Jueves', isActive: true, shifts: [{ startTime: { hour: '09', minute: '00', ampm: 'AM' }, endTime: { hour: '05', minute: '00', ampm: 'PM' } }] },
  { dayName: 'Viernes', isActive: true, shifts: [{ startTime: { hour: '09', minute: '00', ampm: 'AM' }, endTime: { hour: '05', minute: '00', ampm: 'PM' } }] },
  { dayName: 'Sábado', isActive: false, shifts: [{ startTime: { hour: '09', minute: '00', ampm: 'AM' }, endTime: { hour: '01', minute: '00', ampm: 'PM' } }] },
  { dayName: 'Domingo', isActive: false, shifts: [{ startTime: { hour: '09', minute: '00', ampm: 'AM' }, endTime: { hour: '01', minute: '00', ampm: 'PM' } }] },
];

const START_HOUR = 6;
const HOURS = Array.from({ length: 17 }, (_, i) => i + START_HOUR); // 06:00 a 22:00
const DAY_ABBREVS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ─────────────────────────────────────────────────────────
// HELPERS & ALGORITMOS
// ─────────────────────────────────────────────────────────
const format12Hour = (timeStr: string) => {
  const [hh, mm] = timeStr.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${period}`;
};

interface PositionedEvent extends CalendarEvent {
  startMins: number;
  endMins: number;
  width: number;
  left: number;
}

const calculateEventPositions = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
  const positioned = dayEvents.map(e => {
    const [hh, mm] = e.startTime.split(':').map(Number);
    const startMins = hh * 60 + mm;
    return { ...e, startMins, endMins: startMins + e.duration, width: 100, left: 0 };
  }).sort((a, b) => a.startMins - b.startMins || b.endMins - a.endMins);

  let clusters: (typeof positioned)[] = [];
  let currentCluster: typeof positioned = [];
  let clusterEnd = 0;

  positioned.forEach(ev => {
    if (currentCluster.length === 0) {
      currentCluster.push(ev);
      clusterEnd = ev.endMins;
    } else if (ev.startMins < clusterEnd) {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMins);
    } else {
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = ev.endMins;
    }
  });
  if (currentCluster.length > 0) clusters.push(currentCluster);

  clusters.forEach(cluster => {
    const totalColumnsInCluster = cluster.length;
    cluster.forEach((ev, columnIndex) => {
      ev.width = 100 / totalColumnsInCluster;
      ev.left = columnIndex * (100 / totalColumnsInCluster);
    });
  });

  return positioned;
};

// ─────────────────────────────────────────────────────────
// REUSABLE TIME SELECTOR (12-HORAS AM/PM)
// ─────────────────────────────────────────────────────────

interface TimeSelectGroupProps {
  value: string;
  onChange: (val: string) => void;
}

const TimeSelectGroup = ({ value, onChange }: TimeSelectGroupProps) => {
  const [h24, m] = (value || "09:00").split(':');
  const numH = parseInt(h24, 10);
  const ampm = numH >= 12 ? 'PM' : 'AM';
  const h12 = (numH % 12) || 12;

  const updateTime = (newH12: number, newM: string, newAmPm: string) => {
    let finalH24 = newH12;
    if (newAmPm === 'PM' && finalH24 < 12) finalH24 += 12;
    if (newAmPm === 'AM' && finalH24 === 12) finalH24 = 0;
    onChange(`${finalH24.toString().padStart(2, '0')}:${newM}`);
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="relative">
        <select value={h12} onChange={e => updateTime(parseInt(e.target.value, 10), m, ampm)} className="w-14 sm:w-16 px-1.5 sm:px-2 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none text-center">
          {Array.from({length: 12}, (_,i) => <option key={i+1} value={i+1}>{(i+1).toString().padStart(2, '0')}</option>)}
        </select>
      </div>
      <span className="text-slate-400 font-bold">:</span>
      <div className="relative">
        <select value={m} onChange={e => updateTime(h12, e.target.value, ampm)} className="w-14 sm:w-16 px-1.5 sm:px-2 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none text-center">
          {['00', '15', '30', '45'].map(min => <option key={min} value={min}>{min}</option>)}
        </select>
      </div>
      <div className="relative ml-0.5">
        <select value={ampm} onChange={e => updateTime(h12, m, e.target.value)} className="w-16 px-1.5 sm:px-2 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-slate-50 appearance-none text-center">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};

const ShiftTimeSelector = ({ value, onChange }: { value: ShiftTime, onChange: (val: ShiftTime) => void }) => (
  <div className="flex items-center gap-1.5 shrink-0">
    <div className="relative">
      <select value={value.hour} onChange={e => onChange({...value, hour: e.target.value})} className="w-14 sm:w-16 px-1.5 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none text-center">
        {Array.from({length: 12}, (_,i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{(i+1).toString().padStart(2, '0')}</option>)}
      </select>
    </div>
    <span className="text-slate-400 font-bold">:</span>
    <div className="relative">
      <select value={value.minute} onChange={e => onChange({...value, minute: e.target.value})} className="w-14 sm:w-16 px-1.5 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none text-center">
        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
    <div className="relative ml-0.5">
      <select value={value.ampm} onChange={e => onChange({...value, ampm: e.target.value})} className="w-14 sm:w-16 px-1.5 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-slate-50 appearance-none text-center">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function WorkScheduleView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const today = new Date();

  // Derive the 7 days of the current week (Monday-first)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const [selectedClinic, setSelectedClinic] = useState("all");
  const [summaryView, setSummaryView] = useState<'Diario' | 'Semanal' | 'Mensual'>('Semanal');
  const [filters, setFilters] = useState({ zenda: true, google: false, outlook: false });

  // Map summaryView label to API type
  const summaryTypeMap = { 'Diario': 'daily', 'Semanal': 'weekly', 'Mensual': 'monthly' } as const;

  // ── Backend Integration ────────────────────────────────
  const {
    events,
    clinics,
    metrics,
    isLoadingEvents,
    isLoadingClinics,
    errorEvents,
    errorClinics,
    refetchEvents,
  } = useCalendarData({
    currentDate,
    selectedClinic,
    summaryType: summaryTypeMap[summaryView],
  });

  const [isGoogleSynced, setIsGoogleSynced] = useState(false);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [isOutlookSynced, setIsOutlookSynced] = useState(false);
  const [isOutlookSyncing, setIsOutlookSyncing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("cita");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedViewEvent, setSelectedViewEvent] = useState<CalendarEvent | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customTime, setCustomTime] = useState(false);
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventStartTime, _setEventStartTime] = useState("09:00");
  
  const handleStartTimeChange = (newStartTime: string) => {
    _setEventStartTime(newStartTime);
    
    // Calcular endTime (+1 hora)
    const [h, m] = newStartTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const nextH = (h + 1) % 24;
      setEventEndTime(`${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  };
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventTitle, setEventTitle] = useState("");
  
  // Patient form states
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientCedula, setPatientCedula] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hybrid Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  // Search function
  const handleSearchPatient = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiClient.get(`/api/doctors/patients/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };


  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configClinic, setConfigClinic] = useState("avila");
  
  const [schedulesMap, setSchedulesMap] = useState<Record<string, DaySchedule[]>>({
    "avila": JSON.parse(JSON.stringify(INITIAL_SCHEDULE)),
    "mercedes": JSON.parse(JSON.stringify(INITIAL_SCHEDULE)),
  });

  const scheduleConfig = schedulesMap[configClinic] || INITIAL_SCHEDULE;

  const handleScheduleChange = (dayIndex: number, field: string, value: any, shiftIndex?: number) => {
    const newMap = { ...schedulesMap };
    const daySchedules = JSON.parse(JSON.stringify(newMap[configClinic] || INITIAL_SCHEDULE));
    
    if (field === 'isActive') {
      daySchedules[dayIndex].isActive = value;
    } else if (field === 'shiftStart' && shiftIndex !== undefined) {
      daySchedules[dayIndex].shifts[shiftIndex].startTime = value;
    } else if (field === 'shiftEnd' && shiftIndex !== undefined) {
      daySchedules[dayIndex].shifts[shiftIndex].endTime = value;
    }
    newMap[configClinic] = daySchedules;
    setSchedulesMap(newMap);
  };

  const handleAddShift = (dayIndex: number) => {
    const newMap = { ...schedulesMap };
    const daySchedules = JSON.parse(JSON.stringify(newMap[configClinic] || INITIAL_SCHEDULE));
    daySchedules[dayIndex].shifts.push({ startTime: { hour: '01', minute: '00', ampm: 'PM' }, endTime: { hour: '05', minute: '00', ampm: 'PM' } });
    newMap[configClinic] = daySchedules;
    setSchedulesMap(newMap);
  };

  const handleRemoveShift = (dayIndex: number, shiftIndex: number) => {
    const newMap = { ...schedulesMap };
    const daySchedules = JSON.parse(JSON.stringify(newMap[configClinic] || INITIAL_SCHEDULE));
    daySchedules[dayIndex].shifts.splice(shiftIndex, 1);
    newMap[configClinic] = daySchedules;
    setSchedulesMap(newMap);
  };

  
  const handleCreateEvent = async () => {
    try {
      setIsSubmitting(true);
      const type = modalInitialTab;
      
      const finalClinicId = selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic;
      
      if (!finalClinicId) {
        alert("Para agendar una cita, primero debes registrar una sede o consultorio en tu perfil.");
        setIsSubmitting(false);
        return;
      }
      
      let realPatientId = undefined;
      
      if (type === 'cita') {
        if (existingPatientId) {
          realPatientId = existingPatientId;
        } else if (showNewPatientForm) {
          if (!patientFirstName.trim() || !patientLastName.trim() || !patientEmail.trim()) {
            alert('Por favor completa el nombre, apellido y correo del paciente.');
            setIsSubmitting(false);
            return;
          }
          // Crear/Buscar la cuenta fantasma
          const guestResponse = await apiClient.post('/api/doctors/patients/guest', {
            firstName: patientFirstName,
            lastName: patientLastName,
            email: patientEmail,
            cedula: patientCedula
          });
          realPatientId = guestResponse.data.patientId;
        } else {
          alert('Por favor selecciona un paciente o crea uno nuevo.');
          setIsSubmitting(false);
          return;
        }
      }
      
      const payload: any = {
        clinicId: finalClinicId,
        date: new Date(eventDate).toISOString(),
        startTime: eventStartTime,
        endTime: eventEndTime,
        type,
        title: eventTitle || (type === 'cita' ? 'Cita' : 'Bloqueo')
      };
      
      if (type === 'cita') {
        payload.patientId = realPatientId;
        payload.serviceId = 'temp-service-123';
      }
      
      console.log("====================================");
      console.log("🚀 [handleCreateEvent] ENVIANDO PETICIÓN A BACKEND");
      console.log("PAYLOAD COMPLETO:", JSON.stringify(payload, null, 2));
      console.log("====================================");

      const res = await createAppointment(payload);
      console.log("✅ Evento creado exitosamente:", res);
      
      setIsModalOpen(false);
      refetchEvents();
      
      // Reset forms
      setPatientFirstName("");
      setPatientLastName("");
      setPatientEmail("");
      setPatientCedula("");
      setExistingPatientId(null);
      setSelectedPatientName("");
      setShowNewPatientForm(false);
      setSearchQuery("");
      setSearchResults([]);
      
    } catch (error: any) {
      console.error("❌ Error devuelto al crear evento:", error);
      alert(`Error al crear el evento: ${error.response?.data?.error || error.message || 'Desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSaveSchedule = async () => {
    try {
      if (!configClinic) return;
      
      const payload = {
        clinic_id: configClinic,
        days: scheduleConfig
      };
      
      await saveDoctorSchedule(payload);
      console.log("✅ Horarios base guardados exitosamente");
      setIsConfigOpen(false);
      
      // Opcional: refetchEvents() si necesitas refrescar la vista
      refetchEvents();
    } catch (error: any) {
      console.error("❌ Error al guardar horarios:", error);
      alert(`Error al guardar: ${error.message || 'Desconocido'}`);
    }
  };

  const handleSyncGoogle = async () => {
    try {
      setIsGoogleSyncing(true);
      // 1. Pedimos la URL al backend usando apiClient (que inyecta el token Bearer)
      const res = await apiClient.get('/api/calendar/google/auth');
      // 2. Redirigimos a la URL de Google
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Error al sincronizar Google:', error);
      setIsGoogleSyncing(false);
    }
  };

  const handleSyncOutlook = async () => {
    try {
      setIsOutlookSyncing(true);
      const res = await apiClient.get('/api/calendar/outlook/auth');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Error al sincronizar Outlook:', error);
      setIsOutlookSyncing(false);
    }
  };

  const handleCellClick = (_dayName: string, _hour: number) => {
    setModalInitialTab("cita");
    setIsModalOpen(true);
  };

  const handleViewEvent = (event: CalendarEvent) => {
    setSelectedViewEvent(event);
    setIsViewModalOpen(true);
  };

  const getEventStyles = (status: EventStatus) => {
    switch (status) {
      case 'CONFIRMED': return "bg-sky-500 text-white border border-sky-600 shadow-sm shadow-sky-200/50";
      case 'ATTENDANCE_CONFIRMED': return "bg-amber-100 text-amber-900 border border-amber-200 border-l-4 border-l-amber-400";
      case 'PENDING': return "bg-white text-slate-600 border-2 border-dashed border-slate-300";
      case 'BLOCKED_GOOGLE': return "bg-slate-100 text-slate-500 border border-slate-200/80 opacity-80 backdrop-blur-sm";
      case 'CONFIRMED_AND_PAID': return "bg-emerald-500 text-white border border-emerald-600 shadow-sm shadow-emerald-200/50";
      case 'CONFIRMED_PAYMENT_PENDING': return "bg-amber-100 text-amber-900 border border-amber-200 border-l-4 border-l-amber-400";
      case 'COMPLETED_AND_PAID': return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case 'COMPLETED_PAYMENT_PENDING': return "bg-slate-100 text-slate-600 border border-slate-200";
      case 'CONFIRMATION_PENDING_PAYMENT_PENDING': return "bg-white text-slate-600 border-2 border-dashed border-slate-300";
      case 'CONFIRMATION_PENDING_PAID': return "bg-sky-100 text-sky-800 border border-sky-200";
      case 'CANCELLED': return "bg-red-50 text-red-700 border border-red-200 opacity-75";
      case 'NO_SHOW': return "bg-orange-50 text-orange-700 border border-orange-200";
      case 'IN_PROGRESS': return "bg-indigo-500 text-white border border-indigo-600 shadow-sm shadow-indigo-200/50";
    }
  };

  const getEventIcon = (status: EventStatus) => {
    switch (status) {
      case 'BLOCKED_GOOGLE': return <Lock className="w-2.5 h-2.5 shrink-0 opacity-50" />;
      case 'CONFIRMED': return <CheckCircle2 className="w-2.5 h-2.5 shrink-0 opacity-80" />;
      case 'ATTENDANCE_CONFIRMED': return <AlertCircle className="w-2.5 h-2.5 shrink-0 opacity-80" />;
      case 'CONFIRMED_AND_PAID': return <CheckCircle2 className="w-2.5 h-2.5 shrink-0 opacity-80" />;
      case 'CONFIRMED_PAYMENT_PENDING': return <AlertCircle className="w-2.5 h-2.5 shrink-0 opacity-80" />;
      default: return null;
    }
  };

  const getEventLabel = (event: CalendarEvent) => {
    const state = (event.displayCode || event.status) as EventStatus;
    const labels: Partial<Record<EventStatus, string>> = {
      CONFIRMED_PAYMENT_PENDING: 'Cita confirmada · Pago pendiente', CONFIRMED_AND_PAID: 'Cita confirmada · Pagado',
      COMPLETED_PAYMENT_PENDING: 'Cita completada · Pago pendiente', COMPLETED_AND_PAID: 'Cita completada · Pagado',
      CONFIRMATION_PENDING_PAYMENT_PENDING: 'Confirmación y pago pendientes', CONFIRMATION_PENDING_PAID: 'Pago registrado · Confirmación pendiente',
      CANCELLED: 'Cita cancelada', NO_SHOW: 'No asistió', IN_PROGRESS: 'En atención', BLOCKED_GOOGLE: 'Bloqueado (Sincronizado)',
      ATTENDANCE_CONFIRMED: 'Asistencia confirmada', CONFIRMED: 'Cita confirmada', PENDING: 'Pendiente',
    };
    return labels[state] || 'Pendiente';
  };

  // ─────────────────────────────────────────────────────────
  // PRE-CALCULATE: filter events from real API data + compute row heights
  // ─────────────────────────────────────────────────────────
  const filteredEventsPerDay = useMemo(() =>
    weekDays.map((_, dayIndex) =>
      events.filter(e => e.dayIndex === dayIndex).filter(e => {
        if (e.status === 'BLOCKED_GOOGLE' && !filters.google) return false;
        if (e.status !== 'BLOCKED_GOOGLE' && !filters.zenda) return false;
        return true;
      })
    ),
  [events, filters, weekDays.length] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Group events by starting hour for each day
  const getEventsForHour = (dayEvents: CalendarEvent[], hour: number) => {
    return dayEvents.filter(e => {
      const [hh] = e.startTime.split(':').map(Number);
      return hh === hour;
    }).sort((a, b) => {
      const [, am] = a.startTime.split(':').map(Number);
      const [, bm] = b.startTime.split(':').map(Number);
      return am - bm;
    });
  };

  // Calculate the max events per hour ACROSS all days (so rows stay aligned)
  const baseRowHeight = isFullscreen ? 160 : 80;
  const eventCardHeight = 44;
  const eventCardGap = 4;

  const rowHeights = HOURS.slice(0, -1).map(hour => {
    let maxEvents = 0;
    filteredEventsPerDay.forEach(dayEvents => {
      const count = getEventsForHour(dayEvents, hour).length;
      if (count > maxEvents) maxEvents = count;
    });
    if (maxEvents <= 1) return baseRowHeight;
    return Math.max(baseRowHeight, maxEvents * (eventCardHeight + eventCardGap) + 12);
  });

  // ─── Loading Skeleton for the grid ───────────────────
  const GridSkeleton = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Cargando agenda...</p>
      <div className="w-full px-6 space-y-3 mt-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-12 h-16 bg-slate-100 rounded-xl animate-pulse shrink-0" />
            {[...Array(7)].map((__, j) => (
              <div key={j} className={`flex-1 h-16 rounded-xl animate-pulse ${i % 2 === 0 ? 'bg-slate-100' : 'bg-slate-50'}`} style={{ animationDelay: `${j * 60}ms` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Error Banner ────────────────────────────────────
  const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="mx-4 mt-3 flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm">
      <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
      <span className="text-rose-700 flex-1">{message}</span>
      <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
        <RefreshCw className="w-3 h-3" /> Reintentar
      </button>
    </div>
  );

  const renderGridContent = () => (
    <>
      {/* Error banner if appointments failed */}
      {errorEvents && <ErrorBanner message={errorEvents} onRetry={refetchEvents} />}

      {/* Loading skeleton or real grid */}
      {isLoadingEvents ? <GridSkeleton /> : (
      <>
      {/* Helper Text UI */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 text-sky-700 text-xs font-medium border-b border-sky-100 shrink-0">
        <Info className="w-4 h-4 shrink-0" />
        <span>💡 Aplasta cualquier casilla del calendario o el botón superior para agregar una cita</span>
        {isFullscreen && (
          <button onClick={() => setIsFullscreen(false)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Minimize className="w-3.5 h-3.5" /> Cerrar
          </button>
        )}
      </div>

      {/* Week Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentDate(d => subWeeks(d, 1))} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
            Hoy
          </button>
          <button onClick={() => setCurrentDate(d => addWeeks(d, 1))} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm font-semibold text-slate-700 capitalize">
          {format(weekStart, 'MMMM yyyy', { locale: es })}
        </p>
      </div>

      <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="w-14 shrink-0 border-r border-slate-100" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className={`py-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-sky-50/50' : ''}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-sky-600' : 'text-slate-500'}`}>{DAY_ABBREVS[i]}</p>
                <p className={`text-xl mt-0.5 mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-white font-bold shadow-sm shadow-sky-200' : 'text-slate-800 font-medium'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>{format(day, 'd')}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Principal — Vertical stacking layout */}
      <div className="flex-1 flex overflow-y-auto relative hidden-scrollbar bg-slate-50/30 max-h-[calc(100vh-200px)]">
        {/* Hour Labels (left gutter) */}
        <div className="w-14 shrink-0 border-r border-slate-100 bg-white relative z-10">
          {HOURS.slice(0, -1).map((h, hIdx) => (
            <div key={h} className="border-b border-slate-100 relative box-border" style={{ height: rowHeights[hIdx] }}>
              <span className="absolute -top-2.5 right-2 text-[10px] text-slate-400 font-semibold bg-white px-1">
                {format12Hour(`${h}:00`)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Day Columns */}
        <div className="flex-1 grid grid-cols-7 relative">
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, today);
            const dayEvents = filteredEventsPerDay[dayIndex];
            
            const bgBlocks = Object.entries(schedulesMap).flatMap(([clinicId, scheduleList]) => {
              if (selectedClinic !== 'all' && clinicId !== selectedClinic) return [];
              const daySchedule = scheduleList[dayIndex];
              if (!daySchedule.isActive) return [];
              return daySchedule.shifts.map((shift, idx) => {
                const parseTime = (time: ShiftTime) => {
                  let h = parseInt(time.hour, 10);
                  if (time.ampm === 'PM' && h !== 12) h += 12;
                  if (time.ampm === 'AM' && h === 12) h = 0;
                  return h * 60 + parseInt(time.minute, 10);
                };
                const startMins = parseTime(shift.startTime);
                const endMins = parseTime(shift.endTime);
                
                let top = 0;
                let height = 0;
                const startH = Math.floor(startMins / 60);
                const startM = startMins % 60;
                const endH = Math.floor(endMins / 60);
                const endM = endMins % 60;
                
                for (let h = START_HOUR; h < startH; h++) if (h - START_HOUR < rowHeights.length) top += rowHeights[h - START_HOUR];
                if (startH - START_HOUR >= 0 && startH - START_HOUR < rowHeights.length) top += (startM / 60) * rowHeights[startH - START_HOUR];
                
                for (let h = startH; h <= endH; h++) {
                  const rowH = rowHeights[h - START_HOUR] || baseRowHeight;
                  if (h === startH && h === endH) {
                    height += ((endM - startM) / 60) * rowH;
                  } else if (h === startH) {
                    height += ((60 - startM) / 60) * rowH;
                  } else if (h === endH) {
                    height += (endM / 60) * rowH;
                  } else if (h > startH && h < endH) {
                    height += rowH;
                  }
                }

                return { clinicId, top, height, key: `${clinicId}-${idx}` };
              });
            });

            return (
              <div key={dayIndex} className={`border-r border-slate-100 last:border-r-0 relative ${isToday ? 'bg-sky-50/10' : ''}`}>
                
                {/* Availability Background Blocks */}
                {bgBlocks.map(block => (
                   <div 
                     key={block.key} 
                     className="absolute inset-x-1 z-0 bg-slate-50/70 border border-dashed border-slate-200 rounded-lg pointer-events-none"
                     style={{ top: block.top, height: block.height }}
                   >
                     <span className="absolute top-1 left-1.5 text-[10px] font-medium text-slate-400 capitalize">
                       📍 {clinics.find(c => c.id === block.clinicId)?.name || 'Sede'}
                     </span>
                   </div>
                ))}

                {HOURS.slice(0, -1).map((hour, hIdx) => {
                  const eventsInSlot = getEventsForHour(dayEvents, hour);

                  return (
                    <div 
                      key={hour} 
                      className="border-b border-slate-100/60 border-dashed cursor-pointer hover:bg-sky-50/30 transition-colors relative"
                      style={{ height: rowHeights[hIdx] }}
                      onClick={() => handleCellClick(format(day, 'EEEEEE', { locale: es }), hour)}
                    >
                      {/* Events stacked vertically, full width */}
                      {eventsInSlot.length > 0 && (
                        <div className="absolute inset-0 flex flex-col gap-1 p-1 overflow-hidden z-20">
                          {eventsInSlot.map(event => {
                            const visualState = (event.displayCode || event.status) as EventStatus;
                            const styleClass = getEventStyles(visualState);
                            const isShort = event.duration <= 30;

                            return (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEvent(event);
                                }}
                                className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 
                                            hover:brightness-110 hover:shadow-md hover:z-40 shrink-0 ${styleClass}`}
                                style={{ minHeight: 28, flex: isShort ? '0 0 auto' : '1 1 0%' }}
                              >
                                {isShort ? (
                                  <div className="flex flex-row items-center px-2 py-1.5 gap-1.5 w-full text-[11px]">
                                    {getEventIcon(visualState)}
                                    <p className="font-semibold truncate leading-none flex-1 min-w-0">
                                      {event.title}
                                    </p>
                                    {event.patientName && (
                                      <span className={`truncate text-[10px] hidden sm:inline ${event.status === 'CONFIRMED' ? 'text-sky-100' : 'text-slate-400'}`}>
                                        {event.patientName}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-0.5 opacity-80 shrink-0">
                                      <Clock className="w-2.5 h-2.5 shrink-0" />
                                      <span className="font-medium font-mono">{format12Hour(event.startTime)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col p-2 h-full w-full">
                                    <div className="flex items-start justify-between gap-1 mb-0.5">
                                      <p className="font-semibold text-xs leading-tight truncate">
                                        {event.title}
                                      </p>
                                      {getEventIcon(visualState)}
                                    </div>
                                    {event.patientName && (
                                      <p className={`text-[10px] truncate ${event.status === 'CONFIRMED' ? 'text-sky-100' : event.status === 'PENDING' ? 'text-slate-500' : 'text-amber-700/80'}`}>
                                        {event.patientName}
                                      </p>
                                    )}
                                    <div className="mt-auto pt-1 flex items-center gap-1 opacity-80">
                                      <Clock className="w-2.5 h-2.5 shrink-0" />
                                      <span className="text-[9px] font-medium font-mono">{format12Hour(event.startTime)}</span>
                                      <span className="text-[9px] font-medium opacity-60">({event.duration} min)</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </>
  );

  return (
    <div className="h-full flex flex-col gap-6 lg:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Agenda Operativa</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vista semanal de citas y bloqueos horarios</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button onClick={() => setIsConfigOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all flex-1 sm:flex-none">
            <Settings className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Configurar Disponibilidad</span>
          </button>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all flex-1 sm:flex-none">
            {isFullscreen ? <Minimize className="w-4 h-4 shrink-0" /> : <Maximize className="w-4 h-4 shrink-0" />}
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>
          
          <button onClick={() => { setModalInitialTab("cita"); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 active:scale-95 transition-all duration-200 shadow-sm shadow-sky-200 flex-1 sm:flex-none">
            <Plus className="w-4 h-4 shrink-0" /> Nueva Cita
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* FILTROS (Panel Izquierdo) */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4 overflow-y-auto hidden-scrollbar pb-6 lg:pb-0">

          {/* Mini Calendar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-700 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              <div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sá</div><div>Do</div>
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-sm">
              {(() => {
                const startD = startOfWeek(currentMonth, { weekStartsOn: 1 });
                const endD = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
                const days = [];
                let d = startD;
                while (d <= endD) {
                  days.push(d);
                  d = addDays(d, 1);
                }
                return days.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isSameDay(day, currentDate);
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentDate(day)}
                      className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full transition-colors ${
                        isSelected 
                          ? 'bg-sky-500 text-white font-bold shadow-sm shadow-sky-200' 
                          : isCurrentMonth 
                            ? 'text-slate-700 hover:bg-slate-100' 
                            : 'text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Sede de trabajo</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                disabled={isLoadingClinics}
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 appearance-none font-medium disabled:opacity-60"
              >
                <option value="all">Todas mis sedes de trabajo</option>
                {isLoadingClinics ? (
                  <option disabled>Cargando sedes...</option>
                ) : errorClinics ? (
                  <option disabled>Error al cargar sedes</option>
                ) : (
                  clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
              {isLoadingClinics
                ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
                : <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              }
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Filtros de Origen</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${filters.zenda ? 'bg-sky-400 shadow-sm shadow-sky-200' : 'bg-slate-200'}`} />
                  <span className={`text-sm font-medium transition-colors ${filters.zenda ? 'text-slate-800' : 'text-slate-400'}`}>Citas Zenda</span>
                </div>
                <div className={`w-9 h-5 rounded-full relative transition-colors ${filters.zenda ? 'bg-sky-500' : 'bg-slate-200'}`}>
                  <input type="checkbox" className="sr-only" checked={filters.zenda} onChange={() => setFilters(f => ({ ...f, zenda: !f.zenda }))} />
                  <span className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${filters.zenda ? 'left-5' : 'left-1'}`} />
                </div>
              </label>

              {isGoogleSynced ? (
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${filters.google ? 'bg-amber-400 shadow-sm shadow-amber-200' : 'bg-slate-200'}`} />
                    <span className={`text-sm font-medium transition-colors ${filters.google ? 'text-slate-800' : 'text-slate-400'}`}>Google Calendar</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${filters.google ? 'bg-amber-400' : 'bg-slate-200'}`}>
                    <input type="checkbox" className="sr-only" checked={filters.google} onChange={() => setFilters(f => ({ ...f, google: !f.google }))} />
                    <span className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${filters.google ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              ) : (
                <button onClick={handleSyncGoogle} disabled={isGoogleSyncing} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                  {isGoogleSyncing ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <CalendarIcon className="w-4 h-4 text-amber-500" />}
                  {isGoogleSyncing ? "Vinculando..." : "Vincular Google"}
                </button>
              )}

              {isOutlookSynced ? (
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${filters.outlook ? 'bg-indigo-500 shadow-sm shadow-indigo-200' : 'bg-slate-200'}`} />
                    <span className={`text-sm font-medium transition-colors ${filters.outlook ? 'text-slate-800' : 'text-slate-400'}`}>Outlook Calendar</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${filters.outlook ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                    <input type="checkbox" className="sr-only" checked={filters.outlook} onChange={() => setFilters(f => ({ ...f, outlook: !f.outlook }))} />
                    <span className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${filters.outlook ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              ) : (
                <button onClick={handleSyncOutlook} disabled={isOutlookSyncing} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                  {isOutlookSyncing ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <CalendarIcon className="w-4 h-4 text-indigo-500" />}
                  {isOutlookSyncing ? "Vinculando..." : "Vincular Outlook"}
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-slate-50 border border-sky-100 rounded-2xl p-5 shadow-sm space-y-4 hidden lg:block mt-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Resumen {summaryView}</h3>
              <div className="flex items-center gap-1">
                 <button onClick={() => setSummaryView(v => v === 'Diario' ? 'Mensual' : v === 'Semanal' ? 'Diario' : 'Semanal')} className="p-1 hover:bg-sky-200/50 rounded text-slate-500 transition-colors"><ChevronLeft className="w-3 h-3"/></button>
                 <button onClick={() => setSummaryView(v => v === 'Diario' ? 'Semanal' : v === 'Semanal' ? 'Mensual' : 'Diario')} className="p-1 hover:bg-sky-200/50 rounded text-slate-500 transition-colors"><ChevronRight className="w-3 h-3"/></button>
              </div>
            </div>
            
            <div className="space-y-3">
              {summaryView === 'Diario' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Citas Hoy</span>
                    <span className="text-sm font-bold text-sky-700 font-mono">{metrics?.total_today ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Confirmadas</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono">{metrics?.confirmed_today ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Faltan por confirmar</span>
                    <span className="text-sm font-bold text-amber-500 font-mono">{metrics?.pending_today ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                </>
              )}
              {summaryView === 'Semanal' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total Citas</span>
                    <span className="text-sm font-bold text-sky-700 font-mono">{metrics?.total_week ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Confirmadas</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono">{metrics?.confirmed_week ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Faltan por confirmar</span>
                    <span className="text-sm font-bold text-amber-500 font-mono">{metrics?.pending_week ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Horas Bloqueadas</span>
                    <span className="text-sm font-bold text-slate-600 font-mono">{metrics?.blocked_hours_week != null ? `${metrics.blocked_hours_week}h` : <span className="text-slate-300">—</span>}</span>
                  </div>
                </>
              )}
              {summaryView === 'Mensual' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Pacientes Atendidos</span>
                    <span className="text-sm font-bold text-sky-700 font-mono">{metrics?.patients_attended_month ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Nuevos Pacientes</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono">{metrics?.new_patients_month ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Citas Canceladas</span>
                    <span className="text-sm font-bold text-rose-500 font-mono">{metrics?.cancelled_month ?? <span className="text-slate-300">—</span>}</span>
                  </div>
                </>
              )}
            </div>
          </div>


        </div>

        {isFullscreen ? (
          <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
             {renderGridContent()}
          </div>
        ) : (
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col min-h-[500px] overflow-hidden relative">
             {renderGridContent()}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────
          MODAL 1: CREAR NUEVA CITA / BLOQUEO
          ───────────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold text-slate-800">Agendar Nuevo Registro</DialogTitle>
          </DialogHeader>
          
          <Tabs value={modalInitialTab} onValueChange={setModalInitialTab} className="w-full">
            <div className="px-6 pb-2 border-b border-slate-100">
              <TabsList className="w-full grid grid-cols-3 bg-slate-100/80 rounded-xl p-1">
                <TabsTrigger value="cita" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Cita</TabsTrigger>
                <TabsTrigger value="bloqueo" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm">Bloqueo</TabsTrigger>
                <TabsTrigger value="personal" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm">Evento Personal</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {/* PESTAÑA CITA */}
              <TabsContent value="cita" className="mt-0 space-y-5">
                <div className="space-y-5">
                   <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                     <div className="flex items-center gap-2 mb-1">
                       <UserPlus className="w-4 h-4 text-sky-500" />
                       <span className="text-sm font-semibold text-slate-700">Datos del Paciente</span>
                     </div>
                     
                     {!showNewPatientForm && !existingPatientId && (
                       <div className="relative z-10">
                         <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                             type="text" 
                             value={searchQuery}
                             onChange={(e) => handleSearchPatient(e.target.value)}
                             placeholder="Buscar paciente por nombre o correo..." 
                             className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white" 
                           />
                           {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500 animate-spin" />}
                         </div>
                         
                         {searchResults.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
                             {searchResults.map(p => (
                               <div 
                                 key={p.id} 
                                 onClick={() => {
                                   setExistingPatientId(p.id);
                                   setSelectedPatientName(p.firstName + ' ' + p.lastName);
                                   setSearchResults([]);
                                   setSearchQuery('');
                                 }}
                                 className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                               >
                                 <span className="text-sm font-medium text-slate-700">{p.firstName} {p.lastName}</span>
                                 <span className="text-xs text-slate-500">{p.email}</span>
                               </div>
                             ))}
                           </div>
                         )}
                         
                         <button 
                           onClick={() => setShowNewPatientForm(true)}
                           className="mt-3 text-[13px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 transition-colors"
                         >
                           <Plus className="w-3.5 h-3.5" /> Agregar Nuevo Paciente
                         </button>
                       </div>
                     )}

                     {existingPatientId && (
                       <div className="flex items-center justify-between p-3 bg-white border border-sky-100 rounded-lg">
                         <div className="flex flex-col">
                           <span className="text-xs text-slate-500 font-medium">Paciente Seleccionado</span>
                           <span className="text-sm font-semibold text-slate-800">{selectedPatientName}</span>
                         </div>
                         <button 
                           onClick={() => {
                             setExistingPatientId(null);
                             setSelectedPatientName('');
                           }}
                           className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                         >
                           Cambiar
                         </button>
                       </div>
                     )}

                     {showNewPatientForm && (
                       <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                           <input type="text" value={patientFirstName} onChange={(e) => setPatientFirstName(e.target.value)} placeholder="Nombre *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                           <input type="text" value={patientLastName} onChange={(e) => setPatientLastName(e.target.value)} placeholder="Apellido *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} placeholder="Correo Electrónico *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                           <input type="text" value={patientCedula} onChange={(e) => setPatientCedula(e.target.value)} placeholder="Cédula (Opcional)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                         </div>
                         <button 
                           onClick={() => setShowNewPatientForm(false)}
                           className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                         >
                           Cancelar (Buscar Existente)
                         </button>
                       </div>
                     )}
                   </div>

                   <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                       <label className="text-xs font-semibold text-slate-700">Día y Hora de Inicio</label>
                       <label className="flex items-center gap-2 cursor-pointer">
                         <span className="text-[11px] font-medium text-slate-500">Hora personalizada</span>
                         <div className={`w-7 h-4 rounded-full relative transition-colors ${customTime ? 'bg-sky-500' : 'bg-slate-200'}`}>
                           <input type="checkbox" className="sr-only" checked={customTime} onChange={() => setCustomTime(!customTime)} />
                           <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${customTime ? 'left-3.5' : 'left-0.5'}`} />
                         </div>
                       </label>
                     </div>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                       <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full sm:flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white" />
                       <TimeSelectGroup value={eventStartTime} onChange={handleStartTimeChange} />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-slate-700">Servicio Médico</label>
                       <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none" value={selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic} disabled>
                       {clinics.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-slate-700">Duración</label>
                       <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none">
                         <option>15 min</option>
                         <option>20 min</option>
                         <option>30 min</option>
                         <option>45 min</option>
                         <option>60 min</option>
                       </select>
                     </div>
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-slate-700">Sede / Clínica</label>
                     <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none">
                       <option>Clínica El Ávila</option>
                       <option>Centro Médico {clinics.find(c => c.id === configClinic)?.name || 'Sede Seleccionada'}</option>
                     </select>
                   </div>

                   <div className="pt-2">
                     <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                       <input type="checkbox" defaultChecked className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500 cursor-pointer" />
                       <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Enviar detalles por email</span>
                     </label>
                   </div>

                   <button onClick={handleCreateEvent} className="w-full mt-2 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm shadow-sky-200 transition-all">
                     Agendar Cita
                   </button>
                </div>
              </TabsContent>

              {/* PESTAÑA BLOQUEO */}
              <TabsContent value="bloqueo" className="mt-0 space-y-5">
                 <div className="space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-slate-700">Inicio (Fecha y Hora)</label>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                       <input type="date" className="w-full sm:flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 bg-white" />
                       <TimeSelectGroup value={eventEndTime} onChange={setEventEndTime} />
                     </div>
                   </div>
                   
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-slate-700">Fin (Fecha y Hora)</label>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                       <input type="date" className="w-full sm:flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 bg-white" />
                       <TimeSelectGroup value={eventStartTime} onChange={handleStartTimeChange} />
                     </div>
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-700">Motivo del bloqueo</label>
                   <input type="text" placeholder="Ej. Almuerzo, Cirugía programada..." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 bg-white" />
                 </div>

                 <button onClick={handleCreateEvent} className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
                   Bloquear Horario
                 </button>
              </TabsContent>
              
              {/* PESTAÑA EVENTO PERSONAL */}
              <TabsContent value="personal" className="mt-0 space-y-5">
                 <div className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                   <p className="font-medium text-slate-700 mb-0.5">Evento personal privado</p>
                   Esta función mantendrá en privado los detalles de tu evento frente a asistentes.
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-700">Fecha y Hora</label>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                     <input type="date" className="w-full sm:flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 bg-white" />
                     <TimeSelectGroup value={eventEndTime} onChange={setEventEndTime} />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-700">Descripción del Evento</label>
                   <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Ej. Trámite bancario, Asunto familiar..." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 bg-white" />
                 </div>

                 <button onClick={handleCreateEvent} className="w-full mt-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
                   Guardar Evento Personal
                 </button>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────
          MODAL 2: VER DETALLES DE CITA EXISTENTE
          ───────────────────────────────────────────────────────── */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-sm p-6 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
          {selectedViewEvent && (
            <>
              <DialogHeader className="mb-4 text-left">
                <DialogTitle className="text-lg font-bold text-slate-800">
                  {selectedViewEvent.title}
                </DialogTitle>
                {selectedViewEvent.patientName && (
                   <p className="text-sm text-slate-500 font-medium">{selectedViewEvent.patientName}</p>
                )}
              </DialogHeader>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="font-medium">
                    {format12Hour(selectedViewEvent.startTime)} - 
                    {format12Hour(
                      (() => {
                        const [h, m] = selectedViewEvent.startTime.split(':').map(Number);
                        const total = h * 60 + m + selectedViewEvent.duration;
                        return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
                      })()
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="font-medium">
                    {clinics.find(c => c.id === selectedViewEvent.clinicId)?.name || 'Sede'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-600">
                   <AlertCircle className="w-4 h-4 text-sky-500 shrink-0" />
                   <span className="font-medium capitalize">
                     {getEventLabel(selectedViewEvent)}
                   </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors">
                  Editar
                </button>
                <button className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl transition-colors">
                  Cancelar Cita
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────
          SHEET: CONFIGURAR DISPONIBILIDAD BASE
          ───────────────────────────────────────────────────────── */}
      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl bg-white p-0 flex flex-col border-l-0 shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-100 shrink-0">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-500" /> Configuración de Disponibilidad Base
              </SheetTitle>
              <SheetDescription className="text-slate-500 mt-1">
                Establece tus horarios regulares de trabajo. Esto se usará para definir los espacios disponibles para citas.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto hidden-scrollbar p-6 space-y-8">
            {/* Paso 1: Sede */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold">1</span>
                Selecciona la Sede / Clínica
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                  value={configClinic} 
                  onChange={(e) => setConfigClinic(e.target.value)} 
                  className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 appearance-none font-medium"
                >
                  {clinics.length === 0 ? (
                    <option value="" disabled>No tienes sedes registradas</option>
                  ) : (
                    clinics.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Paso 2: Días */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold">2</span>
                Horarios por Día
              </label>
              
              <div className="space-y-3">
                {scheduleConfig.map((day, dayIndex) => (
                  <div key={day.dayName} className={`p-4 rounded-xl border transition-colors ${day.isActive ? 'border-sky-100 bg-sky-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={day.isActive} 
                          onCheckedChange={(checked) => handleScheduleChange(dayIndex, 'isActive', checked)}
                          className={`data-[state=unchecked]:bg-slate-200 ${day.isActive ? 'data-[state=checked]:bg-sky-500' : ''}`}
                        />
                        <span className={`font-semibold ${day.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{day.dayName}</span>
                      </div>
                      {!day.isActive && (
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">No disponible</span>
                      )}
                    </div>
                    
                    {day.isActive && (
                      <div className="space-y-3 pl-11">
                        {day.shifts.map((shift, shiftIndex) => (
                          <div key={shiftIndex} className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-4 relative group">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500 w-10 shrink-0">Inicio:</span>
                              <ShiftTimeSelector value={shift.startTime} onChange={(val) => handleScheduleChange(dayIndex, 'shiftStart', val, shiftIndex)} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500 w-10 shrink-0 xl:w-auto">Fin:</span>
                              <ShiftTimeSelector value={shift.endTime} onChange={(val) => handleScheduleChange(dayIndex, 'shiftEnd', val, shiftIndex)} />
                            </div>
                            
                            {day.shifts.length > 1 && (
                              <button onClick={() => handleRemoveShift(dayIndex, shiftIndex)} className="text-slate-300 hover:text-red-500 transition-colors absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button onClick={() => handleAddShift(dayIndex)} className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1.5 transition-colors mt-2 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg w-fit">
                          <Plus className="w-3.5 h-3.5" /> Agregar otro turno
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <button onClick={handleSaveSchedule} disabled={clinics.length === 0} className="w-full py-3 bg-teal-500 hover:bg-teal-600 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold rounded-xl shadow-sm shadow-teal-200 transition-all flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Guardar Horarios
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
