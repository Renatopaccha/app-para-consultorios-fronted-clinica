import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInvitationService, validateInvitationService } from '../services/auth.service';
import type { InvitationValidation } from '../services/auth.service';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [invitation, setInvitation] = useState<InvitationValidation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('El enlace de invitación no contiene un token.'); setLoading(false); return; }
    validateInvitationService(token).then(setInvitation).catch((requestError: unknown) => {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.error || 'La invitación no es válida.' : 'No se pudo validar la invitación.');
    }).finally(() => setLoading(false));
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invitation) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    try {
      await acceptInvitationService({
        token,
        firstName: String(data.get('firstName') || ''),
        lastName: String(data.get('lastName') || ''),
        password,
        ...(invitation.role === 'DOCTOR' ? { licenseNumber: String(data.get('licenseNumber') || ''), consultationPrice: Number(data.get('consultationPrice')) } : { name: String(data.get('name') || ''), address: String(data.get('address') || '') }),
      });
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.error || 'No se pudo aceptar la invitación.' : 'Error inesperado.');
    }
  };

  if (loading) return <main className="p-8">Validando invitación…</main>;
  if (!invitation) return <main className="p-8 text-red-700">{error}</main>;
  return <main className="min-h-screen flex items-center justify-center bg-surface-container-low p-6"><form className="w-full max-w-lg space-y-4 rounded-xl bg-surface-container-lowest p-8 shadow-sm" onSubmit={submit}>
    <h1 className="text-2xl font-bold">Completa tu cuenta {invitation.role === 'DOCTOR' ? 'médica' : 'de clínica'}</h1>
    <p className="text-sm text-on-surface-variant">Invitación para {invitation.emailMasked}. El rol no puede modificarse.</p>
    <input name="firstName" className="w-full rounded border p-3" placeholder="Nombres" required />
    <input name="lastName" className="w-full rounded border p-3" placeholder="Apellidos" required />
    {invitation.role === 'DOCTOR' ? <><input name="licenseNumber" className="w-full rounded border p-3" placeholder="Licencia profesional" required /><input name="consultationPrice" type="number" min="0" step="0.01" className="w-full rounded border p-3" placeholder="Precio de consulta" required /></> : <><input name="name" className="w-full rounded border p-3" placeholder="Nombre de la clínica" required /><input name="address" className="w-full rounded border p-3" placeholder="Dirección" required /></>}
    <input name="password" type="password" minLength={12} className="w-full rounded border p-3" placeholder="Contraseña (mínimo 12 caracteres)" required />
    {error && <p className="text-sm text-red-700">{error}</p>}
    <button className="w-full rounded bg-primary p-3 font-semibold text-on-primary" type="submit">Crear cuenta pendiente de aprobación</button>
  </form></main>;
}
