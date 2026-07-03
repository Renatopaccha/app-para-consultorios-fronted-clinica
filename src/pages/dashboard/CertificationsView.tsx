import { useState, useEffect } from "react";
import { Plus, Award, Trash2 } from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPES & MOCKS
// ─────────────────────────────────────────────────────────
interface Certification {
  id: string;
  name: string;
  institution: string;
  year: number;
}

const MOCK_CERTIFICATIONS: Certification[] = [
  { id: "c1", name: "Especialista en Cardiología Intervencionista", institution: "Universidad Central de Venezuela", year: 2012 },
  { id: "c2", name: "Fellowship en Electrofisiología Cardíaca", institution: "Cleveland Clinic, Ohio, EEUU", year: 2015 },
  { id: "c3", name: "Board Certification – Cardiovascular Disease", institution: "American Board of Internal Medicine", year: 2016 },
  { id: "c4", name: "Especialista en Medicina Interna", institution: "Hospital Universitario de Caracas", year: 2009 },
  { id: "c5", name: "Médico Cirujano", institution: "Universidad Central de Venezuela – UCV", year: 2006 },
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
export default function CertificationsView() {
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
