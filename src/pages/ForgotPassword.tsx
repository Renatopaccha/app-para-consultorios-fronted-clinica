import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { 
  Mail, 
  Lock, 
  Loader2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

import { forgotPasswordService, resetPasswordService } from '../services/auth.service';

// ==========================================
// Esquemas de Validación (Zod)
// ==========================================
const step1Schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

const step2Schema = z.object({
  pin: z.string().length(6, 'El PIN debe ser exactamente de 6 dígitos'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword']
    });
  }
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

// ==========================================
// Componente Principal
// ==========================================
export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Estado para el flujo de la vista
  const [step, setStep] = useState<1 | 2>(1);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Estados de UI
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // ==========================================
  // Formularios
  // ==========================================
  const formStep1 = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
  });

  const formStep2 = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
  });

  // ==========================================
  // Handlers
  // ==========================================
  const onSubmitStep1 = async (data: Step1FormData) => {
    setApiError(null);
    try {
      await forgotPasswordService(data.email);
      setUserEmail(data.email);
      setStep(2); // Transición al paso 2
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setApiError(err.response.data?.error || 'No se pudo enviar el correo. Inténtalo de nuevo.');
      } else if (err.code === 'ERR_NETWORK' || !navigator.onLine) {
        setApiError('No hay conexión a internet o el servidor no responde. Por favor, revisa tu red e inténtalo nuevamente.');
      } else {
        setApiError('Error inesperado al conectar con el servidor. Inténtalo más tarde.');
      }
    }
  };

  const onSubmitStep2 = async (data: Step2FormData) => {
    setApiError(null);
    try {
      await resetPasswordService({
        token: data.pin,
        newPassword: data.newPassword,
      });
      // Éxito: Redirigimos al login con mensaje de éxito (usando el estado de react-router)
      navigate('/login', { state: { message: 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.' } });
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setApiError(err.response.data?.error || 'El PIN es incorrecto o ha expirado.');
      } else if (err.code === 'ERR_NETWORK' || !navigator.onLine) {
        setApiError('No hay conexión a internet o el servidor no responde. Por favor, revisa tu red e inténtalo nuevamente.');
      } else {
        setApiError('Error inesperado al conectar con el servidor. Inténtalo más tarde.');
      }
    }
  };

  const handleResendCode = async () => {
    if (isResending) return;
    setIsResending(true);
    setApiError(null);
    setResendSuccess(false);
    try {
      await forgotPasswordService(userEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000); // Ocultar mensaje de éxito después de 5s
    } catch (err) {
      setApiError('No se pudo reenviar el código. Inténtalo más tarde.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center font-body-md text-on-surface antialiased p-margin-mobile md:p-margin-desktop py-20 overflow-y-auto">
      <main className="w-full max-w-[480px] mx-auto flex flex-col items-center animate-fade-in-up mt-8 mb-24">
        
        {/* Main Card (Glass Panel effect converted to Tailwind) */}
        <div className="w-full rounded-xl p-8 md:p-[48px] flex flex-col gap-stack-lg relative overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_10px_40px_-10px_rgba(0,169,157,0.08),0_4px_12px_-4px_rgba(0,169,157,0.04)]">
          
          {/* Subtle Decorative Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
          
          {/* Header Section */}
          <div className="flex flex-col items-center text-center gap-stack-md w-full relative z-10 transition-all duration-500">
            {/* Brand Logo */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuACGbSfqri5AOfoCy_mgmH8d-ZNnX43xvWmE_y8TTrX83tzBXsqaiOL_lE0-1neFu-TFYjaJH2Kv7ji_Ijyz3RQ8fsXNVEDWrahN_xIuR_40gcnbHSsaZkPxCzqLyTGCofsScc4X7mpAhSl8j7__JQ7iBG1ErHW-XIJmtuhO3MLifnECZhifmNxb5ZxCNvy_OrCyyezB-hD6XWhmYD7714vJIz-k1NE0AgbfTYyDyS1VuzuFvYB_qQIrQr2zr8C8cNNIw" 
                  alt="Zenda Logo" 
                  className="w-full h-full object-contain rounded-lg" 
                />
              </div>
              <span className="font-headline-md text-xl md:text-2xl text-on-background tracking-tight font-bold">
                ZENDA PLATAFORMA MÉDICA
              </span>
            </div>
            
            {/* Title & Subtitle */}
            <div className="flex flex-col gap-stack-sm">
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">
                Restablecer su contraseña
              </h1>
              <p className="font-body-md text-base text-on-surface-variant max-w-sm mx-auto">
                {step === 1 
                  ? 'Ingrese el correo electrónico asociado a su cuenta y le enviaremos un código de seguridad de 6 dígitos.'
                  : `Hemos enviado un código a ${userEmail}. Introdúzcalo a continuación para crear su nueva contraseña.`
                }
              </p>
            </div>
          </div>

          {/* Error Global API */}
          <div className={`transition-all duration-300 overflow-hidden ${apiError ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0'}`}>
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-100 shadow-sm mt-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="font-medium">{apiError}</p>
            </div>
          </div>

          <div className="relative w-full h-auto min-h-[250px]">
            {/* ========================================== */}
            {/* Formulario Paso 1 (Solicitar PIN)          */}
            {/* ========================================== */}
            <form 
              onSubmit={formStep1.handleSubmit(onSubmitStep1)} 
              className={`flex flex-col gap-stack-lg w-full absolute top-0 left-0 transition-all duration-500 ease-in-out ${step === 1 ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-12 pointer-events-none'}`}
            >
              <div className="flex flex-col gap-unit w-full">
                <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                  </div>
                  <input 
                    id="email" 
                    type="email"
                    disabled={formStep1.formState.isSubmitting}
                    {...formStep1.register('email')}
                    className={`block w-full pl-10 pr-3 py-3 border ${formStep1.formState.errors.email ? 'border-red-400' : 'border-outline-variant'} rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline-variant text-base focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                    placeholder="dr.ejemplo@clinica.com" 
                  />
                </div>
                {formStep1.formState.errors.email && <span className="text-xs text-red-500 font-medium">{formStep1.formState.errors.email.message}</span>}
              </div>

              <div className="flex flex-col gap-stack-md w-full mt-2">
                <button 
                  type="submit"
                  disabled={formStep1.formState.isSubmitting}
                  className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-container/30 transition-all hover:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none gap-2"
                >
                  {formStep1.formState.isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Enviando correo...</>
                  ) : (
                    'Enviar código de recuperación'
                  )}
                </button>
                <Link 
                  to="/login"
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-tertiary hover:bg-slate-200/50 font-label-md text-sm font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-tertiary-container/30"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>

            {/* ========================================== */}
            {/* Formulario Paso 2 (Ingresar PIN y Clave)   */}
            {/* ========================================== */}
            <form 
              onSubmit={formStep2.handleSubmit(onSubmitStep2)} 
              className={`flex flex-col gap-stack-md w-full absolute top-0 left-0 transition-all duration-500 ease-in-out ${step === 2 ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-12 pointer-events-none'}`}
            >
              
              {/* PIN Input */}
              <div className="flex flex-col gap-unit w-full">
                <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="pin">
                  Código de 6 dígitos
                </label>
                <div className="relative group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                  </div>
                  <input 
                    id="pin" 
                    type="text"
                    maxLength={6}
                    disabled={formStep2.formState.isSubmitting}
                    {...formStep2.register('pin')}
                    className={`block w-full pl-10 pr-3 py-3 border ${formStep2.formState.errors.pin ? 'border-red-400' : 'border-outline-variant'} rounded-lg bg-surface-container-lowest text-on-surface text-center tracking-[0.5em] text-lg font-bold placeholder:tracking-normal placeholder:font-normal placeholder:text-outline-variant focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                    placeholder="123456" 
                  />
                </div>
                
                {/* Mensajes de error y reenvío */}
                <div className="flex items-start justify-between mt-1 min-h-[20px]">
                  {formStep2.formState.errors.pin ? (
                    <span className="text-xs text-red-500 font-medium">{formStep2.formState.errors.pin.message}</span>
                  ) : (
                    <span className="text-xs text-on-surface-variant flex-1">¿No recibiste el código?</span>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {resendSuccess && <span className="text-xs text-green-600 font-medium animate-fade-in">¡Código enviado!</span>}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending || formStep2.formState.isSubmitting}
                      className="text-xs font-semibold text-primary-container hover:text-primary transition-colors focus:outline-none disabled:opacity-50"
                    >
                      {isResending ? 'Reenviando...' : 'Reenviar código'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div className="flex flex-col gap-unit w-full mt-2">
                <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="newPassword">Nueva Contraseña</label>
                <div className="relative group transition-all">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                  <input 
                    id="newPassword" 
                    type={showPassword ? "text" : "password"}
                    disabled={formStep2.formState.isSubmitting}
                    {...formStep2.register('newPassword')}
                    className={`w-full bg-surface-container-lowest border ${formStep2.formState.errors.newPassword ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-10 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formStep2.formState.errors.newPassword && <span className="text-xs text-red-500 font-medium">{formStep2.formState.errors.newPassword.message}</span>}
              </div>

              {/* Confirmar Contraseña */}
              <div className="flex flex-col gap-unit w-full">
                <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <div className="relative group transition-all">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                  <input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={formStep2.formState.isSubmitting}
                    {...formStep2.register('confirmPassword')}
                    className={`w-full bg-surface-container-lowest border ${formStep2.formState.errors.confirmPassword ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-10 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formStep2.formState.errors.confirmPassword && <span className="text-xs text-red-500 font-medium">{formStep2.formState.errors.confirmPassword.message}</span>}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-stack-md w-full mt-4">
                <button 
                  type="submit"
                  disabled={formStep2.formState.isSubmitting}
                  className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-container/30 transition-all hover:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none gap-2"
                >
                  {formStep2.formState.isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Restableciendo...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Restablecer contraseña</>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setApiError(null);
                    formStep2.reset();
                  }}
                  disabled={formStep2.formState.isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-tertiary hover:bg-slate-200/50 font-label-md text-sm font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-tertiary-container/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Modificar correo
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer (Simplified as requested in the design) */}
      <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest/80 backdrop-blur-sm border-t border-outline-variant py-4 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-2 z-0">
        <div className="font-headline-sm text-sm font-bold text-on-surface">
          ZENDA PLATAFORMA MÉDICA
        </div>
        <nav aria-label="Footer Navigation">
          <ul className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-on-surface-variant">
            <li><a className="hover:text-secondary underline transition-all" href="#">Términos y Condiciones</a></li>
            <li><a className="hover:text-secondary underline transition-all" href="#">Política de Privacidad</a></li>
            <li><a className="hover:text-secondary underline transition-all" href="#">Soporte</a></li>
          </ul>
        </nav>
        <div className="text-xs text-secondary font-medium">
          © 2024 Zenda Plataforma Médica.
        </div>
      </footer>
    </div>
  );
}
