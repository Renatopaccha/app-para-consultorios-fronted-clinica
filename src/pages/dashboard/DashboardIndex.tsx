import { useState, useEffect, useRef } from "react";
import { Calendar, CheckCircle, Users, Play, XCircle, Lock } from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "MISSED";
type PaymentMethod = "CASH" | "CARD" | "INSURANCE";

interface Patient { id: string; name: string; }
interface MedicalService { id: string; title: string; description: string; price: number; durationMinutes: number; }
interface Appointment {
  id: string; turnNumber: number; startTime: string; patient: Patient;
  service: MedicalService; status: AppointmentStatus; paymentMethod: PaymentMethod;
}

// ─────────────────────────────────────────────────────────
// UTILS
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

// ─────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────
const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "apt-001", turnNumber: 1, startTime: "07:30", patient: { id: "p1", name: "María Alejandra González Rivas" }, service: { id: "s1", title: "Consulta Cardiológica", description: "", price: 85, durationMinutes: 30 }, status: "COMPLETED", paymentMethod: "CARD" },
  { id: "apt-002", turnNumber: 2, startTime: "08:00", patient: { id: "p2", name: "Juan Pablo Pérez Morales" }, service: { id: "s2", title: "Electrocardiograma + Consulta", description: "", price: 120, durationMinutes: 45 }, status: "COMPLETED", paymentMethod: "CARD" },
  { id: "apt-003", turnNumber: 3, startTime: "08:45", patient: { id: "p3", name: "Luisa Fernanda Rodríguez Castro" }, service: { id: "s1", title: "Consulta Cardiológica", description: "", price: 85, durationMinutes: 30 }, status: "IN_PROGRESS", paymentMethod: "CASH" },
  { id: "apt-004", turnNumber: 4, startTime: "09:15", patient: { id: "p4", name: "Roberto Carlos Jiménez Fuentes" }, service: { id: "s3", title: "Ecocardiograma Doppler", description: "", price: 180, durationMinutes: 60 }, status: "CONFIRMED", paymentMethod: "INSURANCE" },
  { id: "apt-005", turnNumber: 5, startTime: "10:15", patient: { id: "p5", name: "Ana Sofía Martínez Blanco" }, service: { id: "s1", title: "Consulta Cardiológica", description: "", price: 85, durationMinutes: 30 }, status: "PENDING", paymentMethod: "CASH" },
];

// ─────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────
export default function DashboardIndex() {
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
        <p className="text-sm text-slate-500 mt-0.5">Hoy · Clínica Principal</p>
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
                  <div className="w-14 text-center shrink-0">
                    <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{apt.startTime}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide">T-{String(apt.turnNumber).padStart(2, "0")}</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor[apt.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${["CANCELLED", "COMPLETED"].includes(apt.status) ? "text-slate-400" : "text-slate-900"}`}>
                      {apt.patient.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {apt.service.title} · {apt.service.durationMinutes} min
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden md:block">
                    <p className="text-sm font-bold text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${apt.service.price}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {apt.paymentMethod === "CASH" ? "Efectivo" : apt.paymentMethod === "CARD" ? "Tarjeta" : "Seguro"}
                    </p>
                  </div>
                  <div className="shrink-0 hidden sm:block">
                    <StatusBadge status={apt.status} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                      <button onClick={() => updateStatus(apt.id, "IN_PROGRESS")} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 transition-all">
                        <Play className="w-3 h-3" /> <span className="hidden lg:inline">Iniciar</span>
                      </button>
                    )}
                    {apt.status === "IN_PROGRESS" && (
                      <button onClick={() => updateStatus(apt.id, "COMPLETED")} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-all">
                        <CheckCircle className="w-3 h-3" /> <span className="hidden lg:inline">Finalizar</span>
                      </button>
                    )}
                    {["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(apt.status) && (
                      <button onClick={() => updateStatus(apt.id, "MISSED")} className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    {apt.status === "PENDING" && apt.paymentMethod === "CASH" && (
                      <button onClick={() => openPin(apt)} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-all">
                        <Lock className="w-3 h-3" /> <span className="hidden xl:inline">Validar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {pinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-sky-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Validar Pago en Efectivo</h3>
              <p className="text-sm text-slate-500">Monto: <strong className="text-slate-700">${pinModal.service.price}</strong></p>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              {pin.map((digit, i) => (
                <input
                  key={i} ref={(el) => { pinRefs.current[i] = el; }}
                  type="password" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !pin[i] && i > 0) pinRefs.current[i - 1]?.focus(); }}
                  className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all ${digit ? "border-sky-500 bg-sky-50" : "border-slate-200"}`}
                />
              ))}
            </div>
            {pinError && <p className="text-sm text-red-500 text-center mb-4 font-medium">{pinError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setPinModal(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50">Cancelar</button>
              <button onClick={submitPin} className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
