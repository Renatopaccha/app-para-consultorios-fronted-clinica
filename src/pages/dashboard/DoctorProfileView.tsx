import { useState, useEffect } from "react";
import { Check, Camera, Upload, Plus, X } from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
type ChipField = "specialties" | "insurances" | "languages";

interface DoctorProfile {
  id: string; name: string; email: string; specialty: string;
  specialties: string[]; bio: string; insurances: string[];
  languages: string[]; isAvailable: boolean; rating: number;
  totalReviews: number;
}

// ─────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />;
}

function InputField({ label, value, onChange, placeholder, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string;
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
// MOCKS
// ─────────────────────────────────────────────────────────
const MOCK_DOCTOR: DoctorProfile = {
  id: "doc-001",
  name: "Dr. Carlos Eduardo Mendoza",
  email: "carlos.mendoza@zenda.med",
  specialty: "Cardiología Intervencionista",
  specialties: ["Cardiología", "Medicina Interna", "Ecocardiografía"],
  bio: "Cardiólogo intervencionista con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares complejas.",
  insurances: ["Seguros Caracas", "Mapfre Salud", "Sanitas"],
  languages: ["Español", "Inglés"],
  isAvailable: true,
  rating: 4.8,
  totalReviews: 247,
};

// ─────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────
export default function DoctorProfileView() {
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
                Arrastra una imagen o <span className="text-sky-600 font-semibold group-hover:underline">haz clic para subir</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900">Información Básica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Nombre completo" value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} />
          <InputField label="Especialidad principal" value={profile.specialty} onChange={(v) => setProfile((p) => ({ ...p, specialty: v }))} />
          <InputField label="Correo electrónico" value={profile.email} onChange={(v) => setProfile((p) => ({ ...p, email: v }))} type="email" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Biografía profesional <span className={`font-normal text-xs ${bioCount > 480 ? "text-red-500" : "text-slate-400"}`}>{bioCount}/500</span>
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
              <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${colorMap[color]}`}>
                {item}
                <button onClick={() => removeChip(field, i)} className="w-4 h-4 rounded-full bg-current/20 hover:bg-current/30 flex items-center justify-center transition-colors duration-150">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newVals[field]}
              onChange={(e) => setNewVals((v) => ({ ...v, [field]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addChip(field, newVals[field])}
              placeholder={`Agregar ${label.toLowerCase()}...`}
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 placeholder:text-slate-300"
            />
            <button onClick={() => addChip(field, newVals[field])} className="px-3.5 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 active:scale-95 transition-all duration-200">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
