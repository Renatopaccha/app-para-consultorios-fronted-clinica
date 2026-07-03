import { useState, useEffect } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, Shield, Activity } from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPES & MOCKS
// ─────────────────────────────────────────────────────────
type SubscriptionStatus = "ACTIVE" | "GRACE_PERIOD" | "INACTIVE";
type PaidBy = "SELF" | "CLINIC";

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

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />;
}

// ─────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────
export default function WalletView() {
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
          {loading || !wallet ? (
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
                  ${wallet.balance.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider">Titular</p>
                    <p className="font-semibold text-sm mt-0.5">Dr. Carlos Eduardo Mendoza</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider">Suscripción válida hasta</p>
                    <p className="font-semibold text-sm mt-0.5">
                      {new Date(wallet.subscriptionValidUntil).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Historial de Transacciones</h2>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </span>
            </div>
            {loading || !wallet ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {wallet.transactions.map((tx) => (
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

        <div className="space-y-4">
          {loading || !wallet ? (
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${subConfig[wallet.subscriptionStatus].cls}`}>
                      {subConfig[wallet.subscriptionStatus].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Próximo cobro</span>
                    <span className="text-sm font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(wallet.subscriptionValidUntil).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Financiado por</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {wallet.paidBy === "SELF" ? "Cuenta propia" : "La clínica"}
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
