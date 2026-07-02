import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, HeartPulse } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Si venimos de un redirect con mensaje de éxito (ej. forgot password)
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Limpiamos el state para que si recarga la página no se vuelva a mostrar eternamente
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      await authLogin({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || 'Credenciales inválidas.');
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest h-screen w-full flex overflow-hidden text-on-surface">
      {/* Left Panel (40%) */}
      <div className="hidden lg:flex w-[40%] h-full relative animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA6yaLHZmrkTgwzufVYMM0IcbFuFajLxLJ0SnuyC441oXNL6ypSCI8C4E-aQUSBPTt2dyqBv68LICVR_pzX_G0mNyWoNs7FbBznYJ2tIU9qzg9wJpXxpjFZu68J5RnwN8t_qXBdTmfIy7pmRK3-eFbZY5LX5C0HN6pTQ0chzJGOSmjt8ZOXM1X9y6llKdXi8S14HHivzo81W9zADWvHQnS5qsseiAxMtFxiWPIg7Ullk8LwlQD5y7Yb")' }}
        ></div>
        <div className="absolute inset-0 z-10 bg-primary/70 mix-blend-multiply"></div>
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-primary-container/90 via-primary-container/40 to-transparent"></div>
        <div className="relative z-30 flex flex-col justify-end p-section-padding h-full w-full">
          <h2 className="font-headline-lg text-4xl font-bold text-on-primary max-w-md animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s' }}>
            La eficiencia que su práctica médica necesita.
          </h2>
        </div>
      </div>

      {/* Right Panel (60%) */}
      <div className="w-full lg:w-[60%] h-full flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop bg-surface-container-lowest overflow-y-auto">
        <div className="w-full max-w-md mx-auto animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
          
          {/* Logo & Title */}
          <div className="mb-stack-lg text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-stack-sm mb-stack-md">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZPKWS5LAHL4l6uGFuNhgpqCVVTsMCukyxv6doQFhzT2zox6XnfN2X0diyVL3lY1wjXrW2QFvtKf-XmRm1Pc8VoiIZZewKt1zAX3NTH8dvE126uolQgejMFjSuf32eWBShxL613LFUDiaaeaC0KFi1W87GA0DW7Y8-XytHE9CIXdlEjVVmIOnhRI1fHBBatx39E-p2lv_rKu_Z7A6lH7USpZ0I7aS8kXzjTF-zIYJ1AKWw0_DRXazUvu4VnvdNmJc5cg" 
                alt="Zenda Logo" 
                className="w-8 h-8 object-contain"
              />
              <h1 className="font-headline-sm text-xl font-bold text-primary tracking-tight uppercase">
                Zenda Plataforma Médica
              </h1>
            </div>
            <h2 className="font-headline-md text-2xl font-semibold text-on-surface">
              Bienvenido a su consultorio digital
            </h2>
            <p className="font-body-md text-base text-on-surface-variant mt-unit">
              Ingrese sus credenciales para acceder al sistema.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-stack-md flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-100 shadow-sm animate-fade-in">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Success Message (e.g. from password reset) */}
          {successMessage && (
            <div className="mb-stack-md flex items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-800 border border-green-100 shadow-sm animate-fade-in">
              <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-stack-md w-full">
            
            {/* Email Input */}
            <div className="relative">
              <label className="block font-label-md text-sm font-semibold text-on-surface-variant mb-unit" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline group-focus-within:text-primary-container transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input 
                  id="email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="dr.nombre@clinica.com" 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-base rounded-lg py-3 pl-10 pr-3 focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all placeholder-outline-variant disabled:opacity-70" 
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="flex justify-between items-center mb-unit">
                <label className="block font-label-md text-sm font-semibold text-on-surface-variant" htmlFor="password">
                  Contraseña
                </label>
                <Link to="/forgot-password" className="font-label-md text-sm font-semibold text-primary-container hover:text-primary transition-colors">
                  ¿Olvidó su contraseña?
                </Link>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline group-focus-within:text-primary-container transition-colors">
                  <Lock className="w-5 h-5" />
                </span>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••" 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-base rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all placeholder-outline-variant disabled:opacity-70" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline hover:text-primary-container transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-container hover:bg-primary text-on-primary font-label-md text-sm font-semibold rounded-lg py-3 transition-colors mt-stack-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" 
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-stack-lg mb-stack-md flex items-center w-full">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="px-stack-sm font-label-sm text-xs font-medium text-outline">o continúe con</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col sm:flex-row gap-stack-sm w-full">
            <button type="button" className="flex-1 flex justify-center items-center gap-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface font-label-md text-sm font-semibold rounded-lg py-3 transition-colors">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbRUxg1kxWkOkN60Sg3LGoW9kUlum6Z1yImfNOE0wryaIfp2Rr6kk8YvP597M2lLMtyJIXACw8Ov9_FWlLeEBbX0O5KRVq0P7zX4m5m1iS9Zkh-cC1n-Sjd8poMLdJP-Z70z-0JS_1J2yiKRc5uLWJQw9HZJFrRl8eRPr5M_My3JOUs2xccwtP-5uXiaX59d_LPcOE-abdlIfg6PKSCc5uBnEwUX07w73CUVhFn5ns3ay6-pUN6juu" alt="Google" className="w-5 h-5 object-contain" />
              Google
            </button>
            <button type="button" className="flex-1 flex justify-center items-center gap-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface font-label-md text-sm font-semibold rounded-lg py-3 transition-colors">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK0VLrdjPgo5E_ASQMT6sb31VHbXewow29WEJx2dfqnmt10jAykSo3fdCLBl5nX9C6QmTSvBmlzybh_nkSNAYl5ESGQ6AGVPYhQpZyLwoDBdDSYlsw6kad0nPZQcrnuP0dzMwBMIkkAmyd0de7_Y-XY9WB2Qq0Gl0r963ddGPOIteBgsUzU81O1qYe2UkiLR9XXDoUDHWYWEu1r3n-uCz68YbTKox1yY6Xug0sFA4jwjyE-CZdOrq-AzNl46vhZd0hog" alt="Outlook" className="w-5 h-5 object-contain" />
              Outlook
            </button>
          </div>

          {/* Footer */}
          <div className="mt-stack-lg text-center">
            <p className="font-body-md text-base text-on-surface-variant">
              ¿Es un profesional nuevo en Zenda? 
              <Link to="/register" className="font-label-md text-sm font-semibold text-primary-container hover:text-primary hover:underline transition-all ml-1">
                Crear cuenta.
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
