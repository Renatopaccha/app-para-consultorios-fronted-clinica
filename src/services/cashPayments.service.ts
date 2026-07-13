import axios from 'axios';
import { apiClient } from './api';

export type CashPaymentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | 'EXEMPTED';

export interface CashPayment {
  paymentId: string;
  method: 'CASH';
  status: CashPaymentStatus;
  patient: { id: string; displayName: string };
  doctor: { id: string; displayName: string };
  clinic: { id: string; name: string };
  appointment: { id: string; startsAt: string | null; serviceName: string };
  amountCents: number;
  amount: number;
  currency: 'USD';
  codeExpiresAt: string;
  confirmedAt: string | null;
  confirmedBy: { id: string; displayName: string } | null;
  confirmedClinicId: string | null;
  requiresReview: boolean;
}

export interface PendingCashPaymentFilters {
  date?: string;
  patient?: string;
  doctorId?: string;
  clinicId?: string;
  status?: CashPaymentStatus;
}

export class CashPaymentApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}

function friendlyMessage(status: number, code?: string): string {
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permisos para consultar o confirmar este pago.';
  if (status === 404 || status === 410) return 'El código no está disponible para esta operación.';
  if (status === 409) return 'El pago ya fue procesado o existe un conflicto. Actualiza la información.';
  if (status === 429) return 'Demasiados intentos. Espera unos minutos antes de intentar nuevamente.';
  return code === 'NETWORK_ERROR' ? 'No se pudo conectar con Zenda.' : 'No se pudo procesar la operación.';
}

function unwrap(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0;
    const code = String(error.response?.data?.error || 'NETWORK_ERROR');
    throw new CashPaymentApiError(status, code, friendlyMessage(status, code));
  }
  throw error;
}

export async function lookupCashPayment(code: string): Promise<CashPayment> {
  try { return (await apiClient.post<CashPayment>('/api/cash-payments/lookup', { code })).data; } catch (error) { return unwrap(error); }
}

export async function confirmCashPayment(paymentId: string, code: string, idempotencyKey: string): Promise<CashPayment> {
  try { return (await apiClient.post<CashPayment>(`/api/cash-payments/${paymentId}/confirm`, { code, idempotencyKey })).data; } catch (error) { return unwrap(error); }
}

export async function reissueCashPaymentCode(paymentId: string, reason?: string): Promise<CashPayment & { code: string }> {
  try { return (await apiClient.post<CashPayment & { code: string }>(`/api/cash-payments/${paymentId}/reissue-code`, reason ? { reason } : {})).data; } catch (error) { return unwrap(error); }
}

export async function getPendingCashPayments(filters: PendingCashPaymentFilters = {}): Promise<CashPayment[]> {
  try { return (await apiClient.get<CashPayment[]>('/api/cash-payments/pending', { params: filters })).data; } catch (error) { return unwrap(error); }
}
