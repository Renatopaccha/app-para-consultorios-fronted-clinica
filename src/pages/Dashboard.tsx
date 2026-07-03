import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Play,
  User,
  Award,
  Star,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Plus,
  Trash2,
  ChevronDown,
  Upload,
  Bell,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Camera,
  Check,
  Lock,
  Wallet,
  Stethoscope,
  Activity,
  Building2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPESCRIPT INTERFACES
// ─────────────────────────────────────────────────────────

type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "MISSED";
type PaymentMethod = "CASH" | "CARD" | "INSURANCE";
type SubscriptionStatus = "ACTIVE" | "GRACE_PERIOD" | "INACTIVE";
type PaidBy = "SELF" | "CLINIC";
type NavView = "dashboard" | "profile" | "services" | "certifications" | "schedule" | "reviews" | "wallet";
type ChipField = "specialties" | "insurances" | "languages";

interface Patient {
  id: string;
  name: string;
}

interface MedicalService {
  id: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
}

interface Appointment {
  id: string;
  turnNumber: number;
  startTime: string;
  patient: Patient;
  service: MedicalService;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
}

interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  specialty: string;
  specialties: string[];
  bio: string;
  insurances: string[];
  languages: string[];
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
}

interface Certification {
  id: string;
  name: string;
  institution: string;
  year: number;
}

interface WorkScheduleBlock {
  startTime: string;
  endTime: string;
}

interface WorkSchedule {
  dayOfWeek: number;
  blocks: WorkScheduleBlock[];
  clinicId: string;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Transaction {
  id: string;
  date: string;
  patientName: string;
  service: string;
  amount: number;
  type: "INCOME" | "WITHDRAWAL" | "PLATFORM_FEE";
}

interface WalletData {
  balance: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionValidUntil: string;
  paidBy: PaidBy;
  transactions: Transaction[];
}

interface NavItem {
  id: NavView;
  label: string;
  icon: ReactNode;
}

// ─────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────

const MOCK_DOCTOR: DoctorProfile = {
  id: "doc-001",
  name: "Dr. Carlos Eduardo Mendoza",
  email: "carlos.mendoza@zenda.med",
  specialty: "Cardiología Intervencionista",
  specialties: ["Cardiología", "Medicina Interna", "Ecocardiografía"],
  bio: "Cardiólogo intervencionista con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares complejas. Especializado en cateterismo cardíaco, angioplastia coronaria y ablación de arritmias. Comprometido con la atención personalizada y el bienestar integral de cada paciente.",
  insurances: ["Seguros Caracas", "Mapfre Salud", "Sanitas", "La Previsora", "PDVSSA"],
  languages: ["Español", "Inglés", "Francés"],
  isAvailable: true,
  rating: 4.8,
  totalReviews: 247,
};

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "apt-001", turnNumber: 1, startTime: "07:30", patient: { id: "p1", name: "María Alejandra González Rivas" }, service: { id: "s1", title: "Consulta Cardiológica", description: "", price: 85, durationMinutes: 30 }, status: "COMPLETED", paymentMethod: "CARD" },
  { id: "apt-002", turnNumber: 2, startTime: "08:00", patient: { id: "p2", name: "Juan Pablo Pérez Morales" }, service: { id: "s2", title: "Electrocardiograma + Consulta", description: "", price: 120, durationMinutes: 45 }, status: "COMPLETED", paymentMethod: "CARD" },
  { id: "apt-003", turnNumber: 3, startTime: "08:45", patient: { id: "p3", name: "Luisa Fernanda Rodríguez Castro" }, service: { id: "s1", title: "Consulta Cardiológica", description: "", price: 85, durationMinutes: 30 }, status: "IN_PROGRESS", paymentMethod: "CASH" },
  { id: "apt-004", turnNumber: 4, startTime: "09:15", patient: { id: "p4", name: "Roberto Carlos Jiménez Fuentes" }, service: { id: "s3", title: "Ecocardiograma Doppler", description: "", price: 180, durationMinutes: 60 }, status: "CONFIRMED", paymentMethod: "INSURANCE" },
  { id: "apt-005", turnNumber: 5, startTime: "10:15", patient: { id: "p5", name: "Ana Sofía Martínez Blanco" }, service: { id: "s1", title: "Consulta Cardiológica", description: "", price: 85, durationMinutes: 30 }, status: "PENDING", paymentMethod: "CASH" },
  { id: "apt-006", turnNumber: 6, startTime: "10:45", patient: { id: "p6", name: "Diego Alejandro Torres Vega" }, service: { id: "s4", title: "Holter 24h + Análisis", description: "", price: 220, durationMinutes: 20 }, status: "PENDING", paymentMethod: "CARD" },
  { id: "apt-007", turnNumber: 7, startTime: "14:00", patient: { id: "p7", name: "Carmen Elena Díaz López" }, service: { id: "s2", title: "Electrocardiograma + Consulta", description: "", price: 120, durationMinutes: 45 }, status: "CONFIRMED", paymentMethod: "INSURANCE" },
  { id: "apt-008", turnNumber: 8, startTime: "14:45", patient: { id: "p8", name: "Fernando Antonio Guzmán Silva" }, service: { id: "s1", title: "Consulta Cardiológica", description: "", price: 85, durationMinutes: 30 }, status: "CANCELLED", paymentMethod: "CASH" },
  { id: "apt-009", turnNumber: 9, startTime: "15:15", patient: { id: "p9", name: "Valentina Lucía Herrera Campos" }, service: { id: "s3", title: "Ecocardiograma Doppler", description: "", price: 180, durationMinutes: 60 }, status: "PENDING", paymentMethod: "CASH" },
];

const MOCK_SERVICES: MedicalService[] = [
  { id: "s1", title: "Consulta Cardiológica", description: "Evaluación clínica integral del sistema cardiovascular con revisión de historia médica y análisis de síntomas.", price: 85, durationMinutes: 30 },
  { id: "s2", title: "Electrocardiograma + Consulta", description: "Registro de la actividad eléctrica del corazón con interpretación inmediata y recomendaciones terapéuticas.", price: 120, durationMinutes: 45 },
  { id: "s3", title: "Ecocardiograma Doppler", description: "Ultrasonido cardíaco avanzado para evaluar la estructura y función del corazón con tecnología Doppler color.", price: 180, durationMinutes: 60 },
  { id: "s4", title: "Holter 24 horas + Análisis", description: "Monitoreo continuo del ritmo cardíaco durante 24 horas con análisis detallado e informe médico completo.", price: 220, durationMinutes: 20 },
  { id: "s5", title: "Prueba de Esfuerzo (Ergometría)", description: "Evaluación de la respuesta cardíaca al ejercicio controlado para detectar isquemia y arritmias latentes.", price: 160, durationMinutes: 90 },
];

const MOCK_CERTIFICATIONS: Certification[] = [
  { id: "c1", name: "Especialista en Cardiología Intervencionista", institution: "Universidad Central de Venezuela", year: 2012 },
  { id: "c2", name: "Fellowship en Electrofisiología Cardíaca", institution: "Cleveland Clinic, Ohio, EEUU", year: 2015 },
  { id: "c3", name: "Board Certification – Cardiovascular Disease", institution: "American Board of Internal Medicine", year: 2016 },
  { id: "c4", name: "Especialista en Medicina Interna", institution: "Hospital Universitario de Caracas", year: 2009 },
  { id: "c5", name: "Médico Cirujano", institution: "Universidad Central de Venezuela – UCV", year: 2006 },
];

const MOCK_CLINICS: Clinic[] = [
  { id: "cl1", name: "Clínica El Ávila", address: "Av. San Juan Bosco, Altamira, Caracas" },
  { id: "cl2", name: "Centro Médico Las Mercedes", address: "Av. Principal de Las Mercedes, Caracas" },
];

const INITIAL_SCHEDULES: WorkSchedule[] = [
  { dayOfWeek: 1, clinicId: "cl1", blocks: [{ startTime: "07:00", endTime: "12:00" }, { startTime: "14:00", endTime: "17:00" }] },
  { dayOfWeek: 2, clinicId: "cl1", blocks: [{ startTime: "07:00", endTime: "12:00" }] },
  { dayOfWeek: 3, clinicId: "cl1", blocks: [{ startTime: "14:00", endTime: "18:00" }] },
  { dayOfWeek: 4, clinicId: "cl2", blocks: [{ startTime: "08:00", endTime: "13:00" }] },
  { dayOfWeek: 5, clinicId: "cl2", blocks: [{ startTime: "08:00", endTime: "12:00" }] },
];

const MOCK_REVIEWS: Review[] = [
  { id: "r1", patientName: "María G.", rating: 5, date: "2024-12-28", comment: "El Dr. Mendoza es un profesional excepcional. Explicó mi diagnóstico con mucha claridad y paciencia. Me sentí muy bien atendida. Totalmente recomendado." },
  { id: "r2", patientName: "Juan P.", rating: 5, date: "2024-12-25", comment: "Excelente atención. El doctor tomó el tiempo necesario para revisar mis estudios anteriores y me dio un plan de tratamiento muy detallado. Salí con todas mis dudas resueltas." },
  { id: "r3", patientName: "Ana M.", rating: 4, date: "2024-12-20", comment: "Muy buen médico, conocedor de su especialidad. La espera fue un poco larga pero la calidad de la consulta lo justifica ampliamente." },
  { id: "r4", patientName: "Roberto J.", rating: 5, date: "2024-12-18", comment: "Me realizó el ecocardiograma con gran precisión y explicó cada hallazgo al momento. Profesional de primera. Ya programé mi próxima consulta." },
  { id: "r5", patientName: "Carmen D.", rating: 4, date: "2024-12-15", comment: "Consulta muy completa. El Dr. Mendoza es atento y preciso en sus diagnósticos. Regresaré sin duda." },
  { id: "r6", patientName: "Fernando G.", rating: 5, date: "2024-12-10", comment: "Detectó mi arritmia que otros médicos habían pasado por alto. Altamente recomendado. Le estoy muy agradecido." },
  { id: "r7", patientName: "Valentina H.", rating: 3, date: "2024-12-05", comment: "Buena consulta, aunque me hubiese gustado más tiempo para resolver mis dudas. En general satisfecha con la atención recibida." },
];

const MOCK_WALLET: WalletData = {
  balance: 3840.50,
  subscriptionStatus: "ACTIVE",
  subscriptionValidUntil: "2025-03-15",
  paidBy: "SELF",
  transactions: [
    { id: "t1", date: "2024-12-28", patientName: "María González", service: "Ecocardiograma Doppler", amount: 180, type: "INCOME" },
    { id: "t2", date: "2024-12-27", patientName: "Juan Pérez", service: "Consulta Cardiológica", amount: 85, type: "INCOME" },
    { id: "t3", date: "2024-12-26", patientName: "—", service: "Tarifa de plataforma Zenda", amount: -12.50, type: "PLATFORM_FEE" },
    { id: "t4", date: "2024-12-25", patientName: "Ana Martínez", service: "Electrocardiograma + Consulta", amount: 120, type: "INCOME" },
    { id: "t5", date: "2024-12-24", patientName: "Roberto Jiménez", service: "Holter 24h + Análisis", amount: 220, type: "INCOME" },
    { id: "t6", date: "2024-12-22", patientName: "—", service: "Retiro a cuenta bancaria", amount: -500, type: "WITHDRAWAL" },
    { id: "t7", date: "2024-12-20", patientName: "Carmen Díaz", service: "Consulta Cardiológica", amount: 85, type: "INCOME" },
    { id: "t8", date: "2024-12-19", patientName: "Fernando Guzmán", service: "Prueba de Esfuerzo", amount: 160, type: "INCOME" },
  ],
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Mi Agenda", icon: <Calendar className="w-[18px] h-[18px]" /> },
  { id: "profile", label: "Mi Perfil", icon: <User className="w-[18px] h-[18px]" /> },
  { id: "services", label: "Mis Servicios", icon: <Stethoscope className="w-[18px] h-[18px]" /> },
  { id: "certifications", label: "Certificaciones", icon: <Award className="w-[18px] h-[18px]" /> },
  { id: "schedule", label: "Horarios", icon: <Clock className="w-[18px] h-[18px]" /> },
  { id: "reviews", label: "Reseñas", icon: <Star className="w-[18px] h-[18px]" /> },
  { id: "wallet", label: "Billetera", icon: <Wallet className="w-[18px] h-[18px]" /> },
];

const VIEW_LABELS: Record<NavView, string> = {
  dashboard: "Mi Agenda",
  profile: "Mi Perfil Profesional",
  services: "Mis Servicios y Precios",
  certifications: "Certificaciones y Formación",
  schedule: "Horarios de Trabajo",
  reviews: "Reseñas de Pacientes",
  wallet: "Billetera y Suscripción",
};

// ─────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />;
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, { label: string; cls: string }> = {
    PENDING: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    CONFIRMED: { label: "Confirmada", cls: "bg-sky-50 text-sky-700 border-sky-200" },
    IN_PROGRESS: { label: "En Consulta", cls: "bg-indigo-500 text-white border-indigo-500 animate-pulse" },
    COMPLETED: { label: "Completada", cls: "bg-slate-100 text-slate-500 border-slate-200" },
    CANCELLED: { label: "Cancelada", cls: "bg-red-50 text-red-600 border-red-200" },
    MISSED: { label: "No Asistió", cls: "bg-orange-50 text-orange-600 border-orange-200" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-300 ${cls}`}>
      {label}
    </span>
  );
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
      ))}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 placeholder:text-slate-300"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VIEW 1 — DOCTOR DASHBOARD (Agenda)
// ─────────────────────────────────────────────────────────

function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinModal, setPinModal] = useState<Appointment | null>(null);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setAppointments(MOCK_APPOINTMENTS);
      setLoading(false);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const waiting = appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).length;

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handlePinChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    if (val && i < 5) pinRefs.current[i + 1]?.focus();
  };

  const submitPin = () => {
    const full = pin.join("");
    if (full.length < 6) { setPinError("Ingresa los 6 dígitos del PIN."); return; }
    if (full === "123456") {
      if (pinModal) updateStatus(pinModal.id, "CONFIRMED");
      setPinModal(null);
      setPin(["", "", "", "", "", ""]);
      setPinError("");
    } else {
      setPinError("PIN incorrecto. Inténtalo de nuevo.");
    }
  };

  const openPin = (apt: Appointment) => {
    setPinModal(apt);
    setPin(["", "", "", "", "", ""]);
    setPinError("");
  };

  const dotColor: Record<AppointmentStatus, string> = {
    COMPLETED: "bg-slate-300",
    IN_PROGRESS: "bg-indigo-500 ring-4 ring-indigo-100",
    CONFIRMED: "bg-sky-400",
    PENDING: "bg-amber-400",
    CANCELLED: "bg-red-400",
    MISSED: "bg-orange-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mi Agenda</h1>
        <p className="text-sm text-slate-500 mt-0.5">Miércoles, 29 de enero de 2025 · Clínica El Ávila</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          [
            { label: "Total del día", value: total, icon: <Calendar className="w-5 h-5 text-sky-600" />, bg: "bg-sky-50" },
            { label: "Completadas", value: completed, icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50" },
            { label: "En espera", value: waiting, icon: <Users className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Turnos de Hoy</h2>
          <span className="text-xs text-slate-400 font-medium">{total} pacientes programados</span>
        </div>
        <div className="divide-y divide-slate-50">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="w-14 h-10" />
                  <Skeleton className="w-2.5 h-2.5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-7 w-20" />
                </div>
              ))
            : appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`px-6 py-4 flex items-center gap-4 transition-all duration-200 hover:bg-slate-50/60 ${apt.status === "IN_PROGRESS" ? "bg-indigo-50/40" : ""}`}
                >
                  {/* Time + turn */}
                  <div className="w-14 text-center shrink-0">
                    <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{apt.startTime}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide">T-{String(apt.turnNumber).padStart(2, "0")}</p>
                  </div>

                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor[apt.status]}`} />

                  {/* Patient */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${["CANCELLED", "COMPLETED"].includes(apt.status) ? "text-slate-400" : "text-slate-900"}`}>
                      {apt.patient.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {apt.service.title} · {apt.service.durationMinutes} min
                    </p>
                  </div>

                  {/* Price + method */}
                  <div className="text-right shrink-0 hidden md:block">
                    <p className="text-sm font-bold text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${apt.service.price}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {apt.paymentMethod === "CASH" ? "Efectivo" : apt.paymentMethod === "CARD" ? "Tarjeta" : "Seguro"}
                    </p>
                  </div>

                  {/* Badge */}
                  <div className="shrink-0 hidden sm:block">
                    <StatusBadge status={apt.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                      <button
                        onClick={() => updateStatus(apt.id, "IN_PROGRESS")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 active:scale-95 transition-all duration-200 shadow-sm shadow-sky-200"
                      >
                        <Play className="w-3 h-3" />
                        <span className="hidden lg:inline">Iniciar</span>
                      </button>
                    )}
                    {apt.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => updateStatus(apt.id, "COMPLETED")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 active:scale-95 transition-all duration-200 shadow-sm shadow-emerald-200"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden lg:inline">Finalizar</span>
                      </button>
                    )}
                    {["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(apt.status) && (
                      <button
                        onClick={() => updateStatus(apt.id, "MISSED")}
                        title="Marcar como no asistió"
                        className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-200"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    {apt.status === "PENDING" && apt.paymentMethod === "CASH" && (
                      <button
                        onClick={() => openPin(apt)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-200"
                      >
                        <Lock className="w-3 h-3" />
                        <span className="hidden xl:inline">Validar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* PIN modal */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-sky-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Validar Pago en Efectivo</h3>
              <p className="text-sm text-slate-500 mt-1">
                Paciente: <strong className="text-slate-700">{pinModal.patient.name.split(" ")[0]}</strong>
              </p>
              <p className="text-sm text-slate-500">Monto: <strong className="text-slate-700">${pinModal.service.price}</strong></p>
              <p className="text-xs text-slate-400 mt-2">Ingresa el PIN de 6 dígitos para confirmar</p>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { pinRefs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !pin[i] && i > 0) pinRefs.current[i - 1]?.focus();
                  }}
                  className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all duration-200 bg-slate-50 ${
                    digit ? "border-sky-500 bg-sky-50" : "border-slate-200"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              ))}
            </div>
            {pinError && <p className="text-sm text-red-500 text-center mb-4 font-medium">{pinError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setPinModal(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={submitPin}
                className="flex-1 py-3 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 active:scale-95 transition-all duration-200"
              >
                Confirmar Pago
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-4">PIN de demostración: 123456</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VIEW 2 — DOCTOR PROFILE
// ─────────────────────────────────────────────────────────

function DoctorProfileView() {
  const [profile, setProfile] = useState<DoctorProfile>(MOCK_DOCTOR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bioCount, setBioCount] = useState(MOCK_DOCTOR.bio.length);
  const [newVals, setNewVals] = useState({ specialties: "", insurances: "", languages: "" });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    }, 1200);
  };

  const addChip = (field: ChipField, val: string) => {
    if (!val.trim()) return;
    setProfile((p) => {
      const arr = p[field] as string[];
      return { ...p, [field]: [...arr, val.trim()] };
    });
    setNewVals((v) => ({ ...v, [field]: "" }));
  };

  const removeChip = (field: ChipField, i: number) => {
    setProfile((p) => {
      const arr = p[field] as string[];
      return { ...p, [field]: arr.filter((_, idx) => idx !== i) };
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />
        <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-5">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      </div>
    );
  }

  const chipConfig: { label: string; field: ChipField; color: string }[] = [
    { label: "Especialidades Médicas", field: "specialties", color: "sky" },
    { label: "Seguros Médicos Aceptados", field: "insurances", color: "emerald" },
    { label: "Idiomas", field: "languages", color: "violet" },
  ];

  const colorMap: Record<string, string> = {
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mi Perfil Profesional</h1>
          <p className="text-sm text-slate-500 mt-0.5">Información pública visible para los pacientes en Zenda</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 disabled:opacity-60 ${
            saved ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" : "bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-200"
          }`}
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saved ? "¡Guardado!" : saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* Avatar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-5">Foto de Perfil</h2>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold select-none shadow-lg shadow-sky-200/60">
              CM
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white shadow-md hover:bg-sky-600 transition-colors duration-200">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 w-full">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-400 hover:bg-sky-50/40 cursor-pointer transition-all duration-300 group">
              <Upload className="w-6 h-6 text-slate-300 group-hover:text-sky-500 mx-auto mb-2 transition-colors duration-200" />
              <p className="text-sm text-slate-500">
                Arrastra una imagen o{" "}
                <span className="text-sky-600 font-semibold group-hover:underline">haz clic para subir</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG — máximo 5 MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900">Información Básica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Nombre completo"
            value={profile.name}
            onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
            placeholder="Dr. Nombre Apellido"
          />
          <InputField
            label="Especialidad principal"
            value={profile.specialty}
            onChange={(v) => setProfile((p) => ({ ...p, specialty: v }))}
            placeholder="Ej. Cardiología"
          />
          <InputField
            label="Correo electrónico"
            value={profile.email}
            onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
            placeholder="correo@zenda.med"
            type="email"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Biografía profesional{" "}
            <span className={`font-normal text-xs ${bioCount > 480 ? "text-red-500" : "text-slate-400"}`}>
              {bioCount}/500 caracteres
            </span>
          </label>
          <textarea
            value={profile.bio}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setProfile((p) => ({ ...p, bio: e.target.value }));
                setBioCount(e.target.value.length);
              }
            }}
            rows={4}
            placeholder="Describe tu experiencia, formación y enfoque médico..."
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 resize-none placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Chip sections */}
      {chipConfig.map(({ label, field, color }) => (
        <div key={field} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">{label}</h2>
          <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
            {(profile[field] as string[]).map((item, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${colorMap[color]}`}
              >
                {item}
                <button
                  onClick={() => removeChip(field, i)}
                  className="w-4 h-4 rounded-full bg-current/20 hover:bg-current/30 flex items-center justify-center transition-colors duration-150"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {(profile[field] as string[]).length === 0 && (
              <p className="text-sm text-slate-300 italic">Sin elementos agregados</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newVals[field]}
              onChange={(e) => setNewVals((v) => ({ ...v, [field]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addChip(field, newVals[field])}
              placeholder={`Agregar ${label.toLowerCase()}...`}
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 placeholder:text-slate-300"
            />
            <button
              onClick={() => addChip(field, newVals[field])}
              className="px-3.5 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VIEW 3 — SERVICES
// ─────────────────────────────────────────────────────────

function ServicesView() {
  const [services, setServices] = useState<MedicalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", durationMinutes: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setServices(MOCK_SERVICES);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  const handleAdd = () => {
    if (!form.title.trim()) { setFormError("El nombre del servicio es obligatorio."); return; }
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) { setFormError("Ingresa un precio válido."); return; }
    if (!form.durationMinutes || isNaN(parseInt(form.durationMinutes))) { setFormError("Ingresa una duración válida."); return; }
    setFormError("");
    const s: MedicalService = {
      id: `s${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      durationMinutes: parseInt(form.durationMinutes),
    };
    setServices((prev) => [s, ...prev]);
    setForm({ title: "", description: "", price: "", durationMinutes: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mis Servicios y Precios</h1>
          <p className="text-sm text-slate-500 mt-0.5">Catálogo médico visible al reservar cita</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 active:scale-95 transition-all duration-200 shadow-sm shadow-sky-200"
        >
          <Plus className="w-4 h-4" />
          Nuevo Servicio
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Agregar Nuevo Servicio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField
                label="Nombre del servicio *"
                value={form.title}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Ej. Consulta Cardiológica"
              />
            </div>
            <InputField
              label="Precio (USD) *"
              value={form.price}
              onChange={(v) => setForm((f) => ({ ...f, price: v }))}
              placeholder="0.00"
              type="number"
            />
            <InputField
              label="Duración (minutos) *"
              value={form.durationMinutes}
              onChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))}
              placeholder="30"
              type="number"
            />
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Describe brevemente el servicio..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 resize-none placeholder:text-slate-300"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-500 mt-3 font-medium">{formError}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all duration-200">
              Cancelar
            </button>
            <button onClick={handleAdd} className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 active:scale-95 transition-all duration-200">
              Agregar Servicio
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)
          : services.map((svc) => (
              <div
                key={svc.id}
                className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-sky-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-sky-600" />
                  </div>
                  <button
                    onClick={() => setServices((prev) => prev.filter((s) => s.id !== svc.id))}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Eliminar servicio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 leading-snug">{svc.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                  {svc.description || "Sin descripción"}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{svc.durationMinutes} min</span>
                  </div>
                  <span className="text-xl font-bold text-sky-600" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>${svc.price}</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VIEW 4 — CERTIFICATIONS
// ─────────────────────────────────────────────────────────

function CertificationsView() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", institution: "", year: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setCerts(MOCK_CERTIFICATIONS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const handleAdd = () => {
    if (!form.name.trim() || !form.institution.trim() || !form.year) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }
    const yr = parseInt(form.year);
    if (isNaN(yr) || yr < 1950 || yr > new Date().getFullYear()) {
      setFormError("Ingresa un año válido.");
      return;
    }
    setFormError("");
    setCerts((prev) => [{ id: `c${Date.now()}`, name: form.name.trim(), institution: form.institution.trim(), year: yr }, ...prev]);
    setForm({ name: "", institution: "", year: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Certificaciones y Formación</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tu trayectoria académica y médica</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 active:scale-95 transition-all duration-200 shadow-sm shadow-sky-200"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Nueva Certificación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField
                label="Nombre del título / certificación *"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Ej. Especialista en Cardiología Intervencionista"
              />
            </div>
            <InputField
              label="Institución otorgante *"
              value={form.institution}
              onChange={(v) => setForm((f) => ({ ...f, institution: v }))}
              placeholder="Universidad / Hospital / Institución"
            />
            <InputField
              label="Año de obtención *"
              value={form.year}
              onChange={(v) => setForm((f) => ({ ...f, year: v }))}
              placeholder="2020"
              type="number"
            />
          </div>
          {formError && <p className="text-sm text-red-500 mt-3 font-medium">{formError}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all duration-200">
              Cancelar
            </button>
            <button onClick={handleAdd} className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 active:scale-95 transition-all duration-200">
              Agregar Certificación
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-6">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[3.25rem] top-8 bottom-8 w-px bg-slate-100" />
            <div className="divide-y divide-slate-50">
              {certs.map((cert, idx) => (
                <div key={cert.id} className="px-6 py-5 flex items-start gap-5 group hover:bg-slate-50/50 transition-all duration-200">
                  <div className="relative z-10 shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200 ${
                      idx === 0
                        ? "bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-200"
                        : "bg-white border-slate-200 text-slate-500 group-hover:border-sky-200"
                    }`}>
                      {idx === 0 ? <Award className="w-4 h-4" /> : cert.year.toString().slice(2)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 leading-snug">{cert.name}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{cert.institution}</p>
                        <span className="inline-block mt-1.5 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {cert.year}
                        </span>
                      </div>
                      <button
                        onClick={() => setCerts((prev) => prev.filter((c) => c.id !== cert.id))}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VIEW 5 — WORK SCHEDULE
// ─────────────────────────────────────────────────────────

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function WorkScheduleView() {
  const [selectedClinic, setSelectedClinic] = useState(MOCK_CLINICS[0].id);
  const [schedules, setSchedules] = useState<WorkSchedule[]>(INITIAL_SCHEDULES);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const getDay = (day: number) => schedules.find((s) => s.dayOfWeek === day && s.clinicId === selectedClinic);

  const addBlock = (day: number) => {
    setSchedules((prev) => {
      const exists = prev.find((s) => s.dayOfWeek === day && s.clinicId === selectedClinic);
      if (exists) {
        return prev.map((s) =>
          s.dayOfWeek === day && s.clinicId === selectedClinic
            ? { ...s, blocks: [...s.blocks, { startTime: "09:00", endTime: "13:00" }] }
            : s
        );
      }
      return [...prev, { dayOfWeek: day, clinicId: selectedClinic, blocks: [{ startTime: "09:00", endTime: "13:00" }] }];
    });
  };

  const removeBlock = (day: number, bi: number) => {
    setSchedules((prev) =>
      prev
        .map((s) =>
          s.dayOfWeek === day && s.clinicId === selectedClinic
            ? { ...s, blocks: s.blocks.filter((_, i) => i !== bi) }
            : s
        )
        .filter((s) => !(s.dayOfWeek === day && s.clinicId === selectedClinic && s.blocks.length === 0))
    );
  };

  const updateBlock = (day: number, bi: number, field: "startTime" | "endTime", val: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === day && s.clinicId === selectedClinic
          ? { ...s, blocks: s.blocks.map((b, i) => (i === bi ? { ...b, [field]: val } : b)) }
          : s
      )
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Horarios de Trabajo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configura tus bloques horarios por clínica</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 ${
            saved ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" : "bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-200"
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          {saved ? "¡Guardado!" : "Guardar Horarios"}
        </button>
      </div>

      {/* Clinic selector */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Clínica seleccionada</label>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 appearance-none"
          >
            {MOCK_CLINICS.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.address}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Weekly grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const sched = getDay(day);
            const isWeekend = day === 0 || day === 6;
            return (
              <div
                key={day}
                className={`bg-white border rounded-2xl p-3.5 shadow-sm transition-all duration-200 ${
                  sched ? "border-sky-100 hover:border-sky-200" : "border-slate-100"
                } ${isWeekend ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${sched ? "text-sky-600" : "text-slate-400"}`}>
                    {DAY_NAMES[day]}
                  </span>
                  {sched && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                <div className="space-y-2">
                  {sched?.blocks.map((block, bi) => (
                    <div key={bi} className="relative group/block">
                      <div className="p-2 bg-sky-50 rounded-xl border border-sky-100">
                        <input
                          type="time"
                          value={block.startTime}
                          onChange={(e) => updateBlock(day, bi, "startTime", e.target.value)}
                          className="w-full text-[11px] text-sky-700 font-semibold bg-transparent border-none outline-none"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        />
                        <div className="w-full h-px bg-sky-200 my-1" />
                        <input
                          type="time"
                          value={block.endTime}
                          onChange={(e) => updateBlock(day, bi, "endTime", e.target.value)}
                          className="w-full text-[11px] text-sky-700 font-semibold bg-transparent border-none outline-none"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        />
                        <button
                          onClick={() => removeBlock(day, bi)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-400 text-white rounded-full hidden group-hover/block:flex items-center justify-center text-[10px] font-bold shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addBlock(day)}
                    className="w-full py-1.5 border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 font-medium hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-all duration-200"
                  >
                    + bloque
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VIEW 6 — REVIEWS
// ─────────────────────────────────────────────────────────

function ReviewsView() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setReviews(MOCK_REVIEWS);
      setLoading(false);
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  const avg = MOCK_DOCTOR.rating;
  const total = MOCK_DOCTOR.totalReviews;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reseñas de Pacientes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Feedback recibido de tus consultas en Zenda</p>
      </div>

      {/* Rating panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
        {loading ? (
          <div className="flex items-start gap-8">
            <Skeleton className="h-28 w-28 rounded-2xl" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-8">
            <div className="text-center shrink-0">
              <p
                className="text-8xl font-black text-slate-900 leading-none tracking-tight"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {avg.toFixed(1)}
              </p>
              <div className="flex justify-center mt-3">
                <StarRating rating={avg} size="lg" />
              </div>
              <p className="text-sm text-slate-400 mt-2 font-medium">{total.toLocaleString("es")} reseñas</p>
            </div>
            <div className="flex-1 w-full space-y-2.5">
              {distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500 w-3 text-right shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400 w-6 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews feed */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-slate-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                    {r.patientName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{r.patientName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(r.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <StarRating rating={r.rating} size="sm" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VIEW 7 — WALLET
// ─────────────────────────────────────────────────────────

function WalletView() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setWallet(MOCK_WALLET);
      setLoading(false);
    }, 1300);
    return () => clearTimeout(t);
  }, []);

  const subConfig: Record<SubscriptionStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Activa", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    GRACE_PERIOD: { label: "Período de Gracia", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    INACTIVE: { label: "Inactiva", cls: "bg-red-50 text-red-600 border-red-200" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Billetera y Suscripción</h1>
        <p className="text-sm text-slate-500 mt-0.5">Finanzas y estado de tu cuenta Zenda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Balance card */}
          {loading ? (
            <Skeleton className="h-52" />
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 p-8 text-white shadow-xl shadow-sky-200/40">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -right-6 w-64 h-64 rounded-full bg-white/5" />
              <div className="absolute top-6 -left-4 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sky-100 text-sm tracking-wide">Zenda Pay</span>
                  </div>
                  <span className="text-xs text-sky-200/80 font-medium tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>MÉDICO · PRO</span>
                </div>
                <p className="text-sky-200/80 text-sm font-medium mb-1">Balance disponible</p>
                <p
                  className="text-5xl font-black tracking-tight"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  ${wallet!.balance.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider">Titular</p>
                    <p className="font-semibold text-sm mt-0.5">{MOCK_DOCTOR.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider">Suscripción válida hasta</p>
                    <p className="font-semibold text-sm mt-0.5">
                      {new Date(wallet!.subscriptionValidUntil).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Historial de Transacciones</h2>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </span>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {wallet!.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors duration-150"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "INCOME" ? "bg-emerald-50" : tx.type === "WITHDRAWAL" ? "bg-sky-50" : "bg-slate-100"
                    }`}>
                      {tx.type === "INCOME"
                        ? <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                        : tx.type === "WITHDRAWAL"
                        ? <ArrowUpRight className="w-4 h-4 text-sky-500" />
                        : <Shield className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{tx.service}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {tx.patientName !== "—" ? `${tx.patientName} · ` : ""}
                        {new Date(tx.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 ${tx.amount > 0 ? "text-emerald-600" : "text-slate-500"}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-64" />
              <Skeleton className="h-36" />
            </>
          ) : (
            <>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <h2 className="font-semibold text-slate-900">Suscripción Zenda</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Estado</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${subConfig[wallet!.subscriptionStatus].cls}`}>
                      {subConfig[wallet!.subscriptionStatus].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Próximo cobro</span>
                    <span className="text-sm font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(wallet!.subscriptionValidUntil).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Financiado por</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {wallet!.paidBy === "SELF" ? "Cuenta propia" : "La clínica"}
                    </span>
                  </div>
                  <div className="pt-4 mt-1 border-t border-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-slate-700">Plan Médico Pro</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Agenda inteligente, historial de pacientes, reportes financieros y soporte prioritario 24/7.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900 mb-4">Acciones</h2>
                <div className="space-y-2.5">
                  <button className="w-full py-3 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Solicitar Retiro
                  </button>
                  <p className="text-xs text-slate-400 text-center">Transferencia en 1-3 días hábiles</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────

function Sidebar({
  currentView,
  setView,
  open,
  onClose,
}: {
  currentView: NavView;
  setView: (v: NavView) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-100 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-sky-200 shrink-0">
              <span className="text-white font-black text-base" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Z</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Zenda</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide uppercase">Panel Médico</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentView === item.id
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span className={currentView === item.id ? "text-white" : "text-slate-400"}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Doctor footer */}
        <div className="p-3 border-t border-slate-50">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              CM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Dr. C. Mendoza</p>
              <p className="text-[11px] text-slate-400 truncate">Cardiología</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────

function Header({
  currentView,
  isAvailable,
  onToggleAvailable,
  subscriptionStatus,
  onMenuClick,
}: {
  currentView: NavView;
  isAvailable: boolean;
  onToggleAvailable: () => void;
  subscriptionStatus: SubscriptionStatus;
  onMenuClick: () => void;
}) {
  const subConfig: Record<SubscriptionStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Activa", cls: "bg-emerald-100 text-emerald-700" },
    GRACE_PERIOD: { label: "Período de Gracia", cls: "bg-amber-100 text-amber-700" },
    INACTIVE: { label: "Inactiva", cls: "bg-red-50 text-red-600" },
  };

  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-5 z-20 gap-3">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors duration-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0">
        <span className="text-slate-400 shrink-0">Panel</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="font-semibold text-slate-900 truncate">{VIEW_LABELS[currentView]}</span>
      </nav>

      <div className="ml-auto flex items-center gap-3 shrink-0">
        {/* Availability toggle */}
        <div className="hidden sm:flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500">
            {isAvailable ? "Disponible" : "No disponible"}
          </span>
          <button
            onClick={onToggleAvailable}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-400 ${
              isAvailable ? "bg-emerald-500 shadow-sm shadow-emerald-200" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                isAvailable ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Subscription badge */}
        <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${subConfig[subscriptionStatus].cls}`}>
          {subConfig[subscriptionStatus].label}
        </span>

        {/* Bell */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(MOCK_DOCTOR.isAvailable);
  const subscriptionStatus: SubscriptionStatus = "ACTIVE";

  const renderView = () => {
    switch (currentView) {
      case "dashboard":      return <DoctorDashboard />;
      case "profile":        return <DoctorProfileView />;
      case "services":       return <ServicesView />;
      case "certifications": return <CertificationsView />;
      case "schedule":       return <WorkScheduleView />;
      case "reviews":        return <ReviewsView />;
      case "wallet":         return <WalletView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header
        currentView={currentView}
        isAvailable={isAvailable}
        onToggleAvailable={() => setIsAvailable((v) => !v)}
        subscriptionStatus={subscriptionStatus}
        onMenuClick={() => setSidebarOpen((v) => !v)}
      />
      <main className="lg:ml-60 pt-16">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
