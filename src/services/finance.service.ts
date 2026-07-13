import axios from 'axios';
import { apiClient } from './api';
import { CashPaymentApiError, type CashPaymentStatus } from './cashPayments.service';

export interface FinanceFilters { startDate?: string; endDate?: string; doctorId?: string; clinicId?: string; status?: CashPaymentStatus; page?: number; pageSize?: number; }
export interface FinanceMetricSummary { confirmedCashCents: number; pendingCashCents: number; cancelledCashCents: number; requiresReviewCents: number; confirmedPaymentCount: number; pendingPaymentCount: number; averageConfirmedPaymentCents: number; }
export interface FinanceGroup { key: string; label: string; confirmedCashCents: number; pendingCashCents: number; paymentCount: number; }
export interface FinanceSummary { label: string; currency: 'USD'; metrics: FinanceMetricSummary; groups: { byDay: FinanceGroup[]; byDoctor: FinanceGroup[]; byClinic: FinanceGroup[]; byService: FinanceGroup[]; }; }
export interface FinancePayment { paymentId: string; date: string | null; patient: { id: string; displayName: string }; doctor: { id: string; displayName: string }; clinic: { id: string; name: string }; service: { id: string; name: string }; amountCents: number; amount: number; currency: 'USD'; status: CashPaymentStatus; method: 'CASH'; confirmedBy: { id: string; displayName: string } | null; confirmedAt: string | null; requiresReview: boolean; }
export interface FinancePaymentsPage { page: number; pageSize: number; total: number; items: FinancePayment[]; }

function unwrap(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0; const code = String(error.response?.data?.error || 'NETWORK_ERROR');
    const message = status === 401 ? 'Tu sesión expiró.' : status === 403 ? 'No tienes permisos para ver ingresos registrados.' : 'No se pudo cargar la información financiera.';
    throw new CashPaymentApiError(status, code, message);
  }
  throw error;
}

export async function getFinanceSummary(filters: FinanceFilters = {}): Promise<FinanceSummary> {
  try { return (await apiClient.get<FinanceSummary>('/api/finance/summary', { params: filters })).data; } catch (error) { return unwrap(error); }
}

export async function getFinancePayments(filters: FinanceFilters = {}): Promise<FinancePaymentsPage> {
  try { return (await apiClient.get<FinancePaymentsPage>('/api/finance/payments', { params: filters })).data; } catch (error) { return unwrap(error); }
}
