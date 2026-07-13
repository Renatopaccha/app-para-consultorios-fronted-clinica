import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../services/auth.service";
import {
  Calendar,
  Clock,
  User,
  Award,
  Star,
  Banknote,
  Stethoscope,
  LogOut,
  Menu,
  ChevronRight,
  Bell
} from "lucide-react";

type SubscriptionStatus = "ACTIVE" | "GRACE_PERIOD" | "INACTIVE";

const NAV_ITEMS = [
  { id: "dashboard", label: "Mi Agenda", icon: <Calendar className="w-[18px] h-[18px]" />, path: "/dashboard" },
  { id: "profile", label: "Mi Perfil", icon: <User className="w-[18px] h-[18px]" />, path: "/dashboard/profile" },
  { id: "services", label: "Mis Servicios", icon: <Stethoscope className="w-[18px] h-[18px]" />, path: "/dashboard/services" },
  { id: "certifications", label: "Certificaciones", icon: <Award className="w-[18px] h-[18px]" />, path: "/dashboard/certifications" },
  { id: "schedule", label: "Horarios", icon: <Clock className="w-[18px] h-[18px]" />, path: "/dashboard/schedule" },
  { id: "reviews", label: "Reseñas", icon: <Star className="w-[18px] h-[18px]" />, path: "/dashboard/reviews" },
  { id: "cash-payments", label: "Pagos en efectivo", icon: <Banknote className="w-[18px] h-[18px]" />, path: "/dashboard/cash-payments", staffOnly: true },
  { id: "finance", label: "Ingresos", icon: <Banknote className="w-[18px] h-[18px]" />, path: "/dashboard/finance", staffOnly: true },
];

const VIEW_LABELS: Record<string, string> = {
  "/dashboard": "Mi Agenda",
  "/dashboard/profile": "Mi Perfil Profesional",
  "/dashboard/services": "Mis Servicios y Precios",
  "/dashboard/certifications": "Certificaciones y Formación",
  "/dashboard/schedule": "Horarios de Trabajo",
  "/dashboard/reviews": "Reseñas de Pacientes",
  "/dashboard/cash-payments": "Pagos en efectivo",
  "/dashboard/finance": "Ingresos registrados",
  "/dashboard/wallet": "Ingresos registrados",
};

// ─────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────
function Sidebar({
  currentPath,
  open,
  onClose,
  userName,
  role,
}: {
  currentPath: string;
  open: boolean;
  onClose: () => void;
  userName: string;
  role?: Role;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
          {NAV_ITEMS.filter(item => !item.staffOnly || role !== 'PATIENT').map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-200/60"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Doctor footer */}
        <div className="p-3 border-t border-slate-50">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-[11px] text-slate-400 truncate">Doctor</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
          >
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
  currentPath,
  isAvailable,
  onToggleAvailable,
  subscriptionStatus,
  onMenuClick,
}: {
  currentPath: string;
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
        <span className="font-semibold text-slate-900 truncate">
          {VIEW_LABELS[currentPath] || "Dashboard"}
        </span>
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
// LAYOUT
// ─────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const location = useLocation();
  const { user } = useAuth();
  
  const userName = user ? `${user.firstName} ${user.lastName}` : "Dr. Usuario";
  const subscriptionStatus: SubscriptionStatus = "ACTIVE";

  return (
    <div className="min-h-screen bg-slate-50/60">
      <Sidebar
        currentPath={location.pathname}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        role={user?.role}
      />
      <Header
        currentPath={location.pathname}
        isAvailable={isAvailable}
        onToggleAvailable={() => setIsAvailable((v) => !v)}
        subscriptionStatus={subscriptionStatus}
        onMenuClick={() => setSidebarOpen((v) => !v)}
      />
      <main className="lg:ml-60 pt-16">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
