import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  ShieldCheck, 
  BriefcaseMedical, 
  Building2, 
  MapPin, 
  CircleDollarSign,
  IdCard,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { registerService } from '../services/auth.service';

// ==========================================
// Esquema de Validación (Zod)
// ==========================================
const registerSchema = z.object({
  firstName: z.string().min(2, 'Debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['DOCTOR', 'CLINIC_ADMIN', 'ASSISTANT', 'PATIENT'], {
    errorMap: () => ({ message: 'Debes seleccionar un rol válido' })
  }),
  terms: z.boolean().refine(val => val === true, 'Debes aceptar los términos'),
  
  // Campos condicionales (opcionales por defecto, requeridos en superRefine)
  licenseNumber: z.string().optional(),
  consultationPrice: z.coerce.number().optional(),
  name: z.string().optional(), // Clinic name
  address: z.string().optional() // Clinic address
}).superRefine((data, ctx) => {
  // Validación: Contraseñas coinciden
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword']
    });
  }
  
  // Validación: Reglas de negocio DOCTOR
  if (data.role === 'DOCTOR') {
    if (!data.licenseNumber || data.licenseNumber.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La cédula profesional es obligatoria', path: ['licenseNumber'] });
    }
    if (data.consultationPrice === undefined || data.consultationPrice <= 0 || isNaN(data.consultationPrice)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa un precio de consulta válido', path: ['consultationPrice'] });
    }
  }

  // Validación: Reglas de negocio CLINIC_ADMIN
  if (data.role === 'CLINIC_ADMIN') {
    if (!data.name || data.name.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El nombre de la clínica es obligatorio', path: ['name'] });
    }
    if (!data.address || data.address.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La dirección de la clínica es obligatoria', path: ['address'] });
    }
  }
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ==========================================
// Componente Principal
// ==========================================
export default function Register() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'DOCTOR', // Valor por defecto
      terms: false,
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      // 1. Ejecutamos el registro en el backend (creará el usuario y nos devolverá JWT + User)
      await registerService({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        licenseNumber: data.licenseNumber,
        consultationPrice: data.consultationPrice,
        name: data.name,
        address: data.address,
      });

      // 2. Si es exitoso, hacemos login directamente usando la función de nuestro AuthContext
      // AuthContext.login volverá a pedir el token internamente, o podemos mapearlo si tu backend
      // devuelve la sesión ya activa. Dado que authLogin pide credentials, hacemos un login normal:
      await authLogin({ email: data.email, password: data.password });

      // 3. Redirigimos al dashboard
      navigate('/dashboard', { replace: true });

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setApiError(err.response.data?.error || 'No se pudo completar el registro. Inténtalo de nuevo.');
      } else {
        setApiError('Error inesperado al conectar con el servidor.');
      }
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center text-on-background m-0 p-0 overflow-hidden">
      <main className="w-full h-screen flex flex-col md:flex-row max-w-container-max-width mx-auto bg-surface-container-lowest overflow-hidden">
        
        {/* ========================================== */}
        {/* Left Panel: Brand & Imagery (40%)          */}
        {/* ========================================== */}
        <aside className="hidden md:flex flex-col w-[40%] relative bg-surface-container-high border-r border-outline-variant/30 animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGiNu1VO9Epzei01VJmoWJdPK3IlNoQ93le-5XkBpNKgMTKqilXLsxbCIblZEWov_WM0lOGxJqT_IKou3reRJuGjKDrR8UoX5lJcRYMdCG8pdqsZ9fGj9mgLbwypfQLPSPTw70g_zPOxQI8PWHsCXmfv5NSjjDl7E184b-FWXBT_0E7Lao1cy7tr2VMjJZwDwaEGn5bpiepwWK1AQXers9B8DntTZ50J1H2-fNyuK57ABCqYtuCIlw")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-inverse-surface/90 mix-blend-multiply"></div>
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between p-section-padding">
            <div>
              <h1 className="font-headline-md text-2xl font-bold text-on-primary tracking-tight">
                ZENDA PLATAFORMA MÉDICA
              </h1>
            </div>
            
            <div className="mb-section-padding animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s' }}>
              <h2 className="font-headline-xl text-4xl text-on-primary mb-stack-md font-bold leading-tight">
                Únase a la red más avanzada de profesionales de la salud.
              </h2>
              <p className="font-body-lg text-lg text-surface-container-low opacity-90 max-w-md">
                Optimice su práctica médica, conecte con pacientes y gestione su clínica con herramientas diseñadas para la excelencia.
              </p>
            </div>
            
            <div className="flex items-center gap-stack-sm text-surface-container-low animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s' }}>
              <ShieldCheck className="w-5 h-5" />
              <span className="font-label-sm text-xs font-medium">Plataforma segura y cifrada HIPAA</span>
            </div>
          </div>
        </aside>

        {/* ========================================== */}
        {/* Right Panel: Registration Form (60%)       */}
        {/* ========================================== */}
        <section className="w-full md:w-[60%] flex items-center justify-center p-margin-mobile md:p-section-padding bg-surface-container-lowest overflow-y-auto">
          <div className="w-full max-w-2xl flex flex-col gap-stack-lg animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
            
            {/* Mobile Header */}
            <div className="md:hidden mb-stack-sm text-center">
              <h1 className="font-headline-md text-2xl font-bold text-primary tracking-tight">ZENDA</h1>
            </div>
            
            <div className="text-left mb-stack-sm">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-3xl font-bold text-on-background mb-unit">
                Únase a Zenda como Profesional
              </h2>
              <p className="font-body-md text-base text-on-surface-variant">
                Complete sus datos para crear su cuenta en la plataforma.
              </p>
            </div>

            {/* Error Global API */}
            {apiError && (
              <div className="flex animate-fade-in items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-100 shadow-sm">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="font-medium">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-stack-lg">
              
              {/* Rol Selector */}
              <div className="flex flex-col gap-unit">
                <label className="font-label-md text-sm font-semibold text-on-surface">Tipo de Cuenta</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedRole === 'DOCTOR' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}>
                    <input type="radio" value="DOCTOR" className="hidden" {...register('role')} />
                    <BriefcaseMedical className="w-5 h-5" />
                    <span className="font-medium text-sm">Doctor Independiente</span>
                  </label>
                  <label className={`relative flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedRole === 'CLINIC_ADMIN' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}>
                    <input type="radio" value="CLINIC_ADMIN" className="hidden" {...register('role')} />
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium text-sm">Administrador Clínica</span>
                  </label>
                </div>
                {errors.role && <span className="text-xs text-red-500 font-medium">{errors.role.message}</span>}
              </div>

              {/* 2-Column Grid Fields (Información Personal) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                
                {/* Row 1 */}
                <div className="flex flex-col gap-unit">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="firstName">Nombres</label>
                  <div className="relative group transition-all">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="firstName"
                      disabled={isSubmitting}
                      {...register('firstName')}
                      className={`w-full bg-surface-container-lowest border ${errors.firstName ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-4 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                      placeholder="Ej. María Luisa" 
                    />
                  </div>
                  {errors.firstName && <span className="text-xs text-red-500 font-medium">{errors.firstName.message}</span>}
                </div>
                
                <div className="flex flex-col gap-unit">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="lastName">Apellidos</label>
                  <div className="relative group transition-all">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="lastName" 
                      disabled={isSubmitting}
                      {...register('lastName')}
                      className={`w-full bg-surface-container-lowest border ${errors.lastName ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-4 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                      placeholder="Ej. Pérez Gómez" 
                    />
                  </div>
                  {errors.lastName && <span className="text-xs text-red-500 font-medium">{errors.lastName.message}</span>}
                </div>

                {/* Row 2 */}
                <div className="flex flex-col gap-unit md:col-span-2">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="email">Correo Electrónico</label>
                  <div className="relative group transition-all">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="email" 
                      type="email"
                      disabled={isSubmitting}
                      {...register('email')}
                      className={`w-full bg-surface-container-lowest border ${errors.email ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-4 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                      placeholder="correo@ejemplo.com" 
                    />
                  </div>
                  {errors.email && <span className="text-xs text-red-500 font-medium">{errors.email.message}</span>}
                </div>

              </div>

              {/* ===== CAMPOS CONDICIONALES DOCTOR ===== */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-gutter transition-all duration-500 ease-in-out origin-top ${selectedRole === 'DOCTOR' ? 'opacity-100 scale-y-100 h-auto' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
                <div className="flex flex-col gap-unit">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="licenseNumber">Cédula Profesional</label>
                  <div className="relative group transition-all">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="licenseNumber" 
                      disabled={isSubmitting}
                      {...register('licenseNumber')}
                      className={`w-full bg-surface-container-lowest border ${errors.licenseNumber ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-4 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                      placeholder="Número de cédula" 
                    />
                  </div>
                  {errors.licenseNumber && <span className="text-xs text-red-500 font-medium">{errors.licenseNumber.message}</span>}
                </div>

                <div className="flex flex-col gap-unit">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="consultationPrice">Precio de Consulta ($)</label>
                  <div className="relative group transition-all">
                    <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="consultationPrice" 
                      type="number"
                      step="0.01"
                      disabled={isSubmitting}
                      {...register('consultationPrice')}
                      className={`w-full bg-surface-container-lowest border ${errors.consultationPrice ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-4 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                      placeholder="0.00" 
                    />
                  </div>
                  {errors.consultationPrice && <span className="text-xs text-red-500 font-medium">{errors.consultationPrice.message}</span>}
                </div>
              </div>

              {/* ===== CAMPOS CONDICIONALES CLÍNICA ===== */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-gutter transition-all duration-500 ease-in-out origin-top ${selectedRole === 'CLINIC_ADMIN' ? 'opacity-100 scale-y-100 h-auto' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
                <div className="flex flex-col gap-unit md:col-span-2">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="name">Nombre de la Clínica</label>
                  <div className="relative group transition-all">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="name" 
                      disabled={isSubmitting}
                      {...register('name')}
                      className={`w-full bg-surface-container-lowest border ${errors.name ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-4 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                      placeholder="Clínica Zenda" 
                    />
                  </div>
                  {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-unit md:col-span-2">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="address">Dirección de la Clínica</label>
                  <div className="relative group transition-all">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="address" 
                      disabled={isSubmitting}
                      {...register('address')}
                      className={`w-full bg-surface-container-lowest border ${errors.address ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-4 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
                      placeholder="Calle Principal 123" 
                    />
                  </div>
                  {errors.address && <span className="text-xs text-red-500 font-medium">{errors.address.message}</span>}
                </div>
              </div>


              {/* Row Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="flex flex-col gap-unit">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="password">Contraseña</label>
                  <div className="relative group transition-all">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      disabled={isSubmitting}
                      {...register('password')}
                      className={`w-full bg-surface-container-lowest border ${errors.password ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-10 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
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
                  {errors.password && <span className="text-xs text-red-500 font-medium">{errors.password.message}</span>}
                </div>
                
                <div className="flex flex-col gap-unit">
                  <label className="font-label-md text-sm font-semibold text-on-surface" htmlFor="confirmPassword">Confirmar Contraseña</label>
                  <div className="relative group transition-all">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary-container transition-colors" />
                    <input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"}
                      disabled={isSubmitting}
                      {...register('confirmPassword')}
                      className={`w-full bg-surface-container-lowest border ${errors.confirmPassword ? 'border-red-400' : 'border-outline-variant'} rounded-lg py-3 pl-10 pr-10 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 focus:outline-none transition-all`}
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
                  {errors.confirmPassword && <span className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</span>}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-stack-sm mt-stack-sm">
                <div className="flex items-center h-5">
                  <input 
                    id="terms" 
                    type="checkbox"
                    disabled={isSubmitting}
                    {...register('terms')}
                    className="w-4 h-4 text-primary-container bg-surface-container-lowest border-outline-variant rounded focus:ring-primary-container focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer" 
                  />
                </div>
                <div className="ml-1 text-sm flex flex-col">
                  <label className="font-body-sm text-sm text-on-surface-variant cursor-pointer" htmlFor="terms">
                    Acepto los <a className="text-primary-container hover:text-primary hover:underline transition-colors font-semibold" href="#">Términos de Servicio</a> y la <a className="text-primary-container hover:text-primary hover:underline transition-colors font-semibold" href="#">Política de Privacidad</a>.
                  </label>
                  {errors.terms && <span className="text-xs text-red-500 font-medium mt-1">{errors.terms.message}</span>}
                </div>
              </div>

              {/* Primary Button */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-stack-sm bg-primary-container hover:bg-primary text-on-primary font-label-md text-sm font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-[0.99] active:scale-[0.97] focus:outline-none focus:ring-4 focus:ring-primary-container/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta profesional'
                )}
              </button>

            </form>

            {/* Footer Link */}
            <div className="mt-stack-lg text-center pb-margin-mobile">
              <p className="font-body-sm text-sm text-on-surface-variant">
                ¿Ya tiene una clínica registrada? 
                <Link to="/login" className="font-label-md text-sm font-semibold text-primary-container hover:text-primary hover:underline transition-colors ml-1">
                  Iniciar sesión
                </Link>
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
