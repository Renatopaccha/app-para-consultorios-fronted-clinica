import { useState, useEffect } from "react";
import { Plus, Clock, Stethoscope, Trash2 } from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPES & MOCKS
// ─────────────────────────────────────────────────────────
interface MedicalService {
  id: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
}

const MOCK_SERVICES: MedicalService[] = [
  { id: "s1", title: "Consulta Cardiológica", description: "Evaluación clínica integral del sistema cardiovascular con revisión de historia médica y análisis de síntomas.", price: 85, durationMinutes: 30 },
  { id: "s2", title: "Electrocardiograma + Consulta", description: "Registro de la actividad eléctrica del corazón con interpretación inmediata y recomendaciones terapéuticas.", price: 120, durationMinutes: 45 },
  { id: "s3", title: "Ecocardiograma Doppler", description: "Ultrasonido cardíaco avanzado para evaluar la estructura y función del corazón con tecnología Doppler color.", price: 180, durationMinutes: 60 },
  { id: "s4", title: "Holter 24 horas + Análisis", description: "Monitoreo continuo del ritmo cardíaco durante 24 horas con análisis detallado e informe médico completo.", price: 220, durationMinutes: 20 },
  { id: "s5", title: "Prueba de Esfuerzo (Ergometría)", description: "Evaluación de la respuesta cardíaca al ejercicio controlado para detectar isquemia y arritmias latentes.", price: 160, durationMinutes: 90 },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />;
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
// COMPONENT
// ─────────────────────────────────────────────────────────
export default function ServicesView() {
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
