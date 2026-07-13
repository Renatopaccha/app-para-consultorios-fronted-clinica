import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

/** Professional accounts are provisioned exclusively through invitations. */
export default function Register() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const navigate = useNavigate();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = token.trim();
    if (trimmed) navigate(`/accept-invitation?token=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-container-low p-6">
      <section className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-on-background">Cuenta profesional Zenda</h1>
        <p className="mt-3 text-on-surface-variant">Para crear una cuenta profesional necesitas una invitación de Zenda o de tu clínica.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium" htmlFor="invitation-token">Token de invitación</label>
          <input id="invitation-token" value={token} onChange={(event) => setToken(event.target.value)} className="w-full rounded-lg border border-outline-variant p-3" placeholder="Pega aquí tu token" required />
          <button type="submit" className="w-full rounded-lg bg-primary p-3 font-semibold text-on-primary">Continuar con invitación</button>
        </form>
        <p className="mt-5 text-sm text-on-surface-variant">¿No tienes invitación? Contacta a Zenda o al administrador de tu clínica.</p>
        <Link className="mt-4 inline-block text-sm text-primary underline" to="/login">Ya tengo una cuenta</Link>
      </section>
    </main>
  );
}
