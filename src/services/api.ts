import axios from 'axios';
import { HistoryPoint, SpendingItem, PortfolioResponse, EvolutionPoint, PaginatedResponse, TransactionResponse, TransactionQueryParams, UserResponse, SmartShoppingAnalysis, SmartShoppingSummary, Tag, RecurringTransaction } from '@/types/models';

// Lógica para Runtime Environment Variables (Docker/TrueNAS)
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_API_URL) {
    return (window as any).__ENV__.NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
};

export const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Mágico: Injeta o token antes de cada pedido sair
api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de Resposta: Se der erro 401 (Token expirado), faz logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- AUTH ---
export const loginUser = async (username: string, password: string): Promise<{ access_token: string }> => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  
  const response = await api.post('/auth/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const registerUser = async (data: any): Promise<UserResponse> => {
  const response = await api.post('/users/', data);
  return response.data;
};

// NOVO: Recuperação de Password
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, new_password: string): Promise<void> => {
  await api.post('/auth/reset-password', { token, new_password });
};

// --- SERVIÇOS DE ANALYTICS ---

export const getPortfolio = async (): Promise<PortfolioResponse> => {
  const response = await api.get('/portfolio/');
  return response.data as PortfolioResponse;
};

export const updateManualPrice = async (symbol: string, price: number): Promise<void> => {
  await api.post('/portfolio/price/', { symbol, price });
};

export const getHistory = async (range: string = '30d'): Promise<HistoryPoint[]> => {
  const response = await api.get('/analytics/history/', { params: { range } });
  return response.data as HistoryPoint[];
};

export const getSpending = async (range: string = '30d'): Promise<SpendingItem[]> => {
  const response = await api.get('/analytics/spending/', { params: { range } });
  return response.data as SpendingItem[];
};

export const getEvolution = async (period: string = 'year', time_range: string = 'all'): Promise<EvolutionPoint[]> => {
  const response = await api.get('/analytics/evolution/', { params: { period, time_range } });
  return response.data as EvolutionPoint[];
};

// --- SMART SHOPPING ---
export const getSmartShoppingAnalysis = async (itemName: string, currentPrice: number, unit: string): Promise<SmartShoppingAnalysis> => {
  const response = await api.get('/analytics/smart-shopping/', {
    params: {
      item_name: itemName,
      current_price: currentPrice,
      unit: unit
    }
  });
  return response.data as SmartShoppingAnalysis;
};

export const getSmartShoppingSummary = async (period: 'month' | 'year' | 'all' = 'all', page: number = 1, size: number = 10): Promise<SmartShoppingSummary> => {
  const safePeriod = period || 'all';
  const response = await api.get('/analytics/smart-shopping/summary/', { 
    params: { 
      period: safePeriod,
      page,
      size
    } 
  });
  return response.data as SmartShoppingSummary;
};

// --- SERVIÇOS DE TRANSAÇÕES ---

export const getTransactions = async (params?: TransactionQueryParams): Promise<PaginatedResponse<TransactionResponse>> => {
  const response = await api.get('/transactions/', { params });
  return response.data as PaginatedResponse<TransactionResponse>;
};

export const createTransaction = async (data: any): Promise<TransactionResponse> => {
  const response = await api.post('/transactions/', data);
  return response.data;
};

export const transferFunds = async (data: { source_account_id: number; destination_account_id: number; amount: number; date: string; description: string }): Promise<void> => {
  await api.post('/transactions/transfer/', data);
};

export const exportTransactions = async (): Promise<Blob> => {
  const response = await api.get('/transactions/export/', { responseType: 'blob' });
  return response.data;
};

// --- SERVIÇOS DE CONTAS E CATEGORIAS ---
export const getAccounts = async (): Promise<any[]> => {
  const response = await api.get('/accounts/');
  return response.data;
};

export const updateAccountBalance = async (id: number, newBalance: number): Promise<void> => {
  await api.patch(`/accounts/${id}/balance/`, { new_balance: newBalance });
};

export const getCategories = async (): Promise<any[]> => {
  const response = await api.get('/categories/');
  return response.data;
};

export const getTransactionTypes = async (): Promise<any[]> => {
  const response = await api.get('/lookups/transaction-types/');
  return response.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/accounts/${id}/`);
};

// --- SERVIÇOS DE TAGS (PREMIUM) ---
export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/tags/');
  return response.data;
};

export const createTag = async (name: string, color: string): Promise<Tag> => {
  const response = await api.post('/tags/', { name, color });
  return response.data;
};

export const deleteTag = async (id: number): Promise<void> => {
  await api.delete(`/tags/${id}/`);
};

// --- SERVIÇOS DE RECORRÊNCIA (PREMIUM) ---
export const getRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
  const response = await api.get('/recurring/');
  return response.data;
};

export const createRecurringTransaction = async (data: any): Promise<RecurringTransaction> => {
  const response = await api.post('/recurring/', data);
  return response.data;
};

export const deleteRecurringTransaction = async (id: number): Promise<void> => {
  await api.delete(`/recurring/${id}/`);
};

// --- SERVIÇOS DE REGRAS (AUTOMATION) ---
export interface Rule {
  id: number;
  pattern: string;
  category_id: number;
  category_name?: string;
}

export const getRules = async (): Promise<Rule[]> => {
  const response = await api.get('/rules/');
  return response.data as Rule[];
};

export const createRule = async (pattern: string, category_id: number): Promise<Rule> => {
  const response = await api.post('/rules/', { pattern, category_id });
  return response.data as Rule;
};

export const deleteRule = async (id: number): Promise<void> => {
  await api.delete(`/rules/${id}/`);
};

// --- SERVIÇOS DE ADMIN ---

export const getAdminUsers = async (page: number = 1): Promise<PaginatedResponse<UserResponse>> => {
  const response = await api.get('/admin/users/', { params: { page, size: 20 } });
  return response.data as PaginatedResponse<UserResponse>;
};

export const updateUserRole = async (userId: number, role: string): Promise<void> => {
  await api.patch(`/admin/users/${userId}/role/`, { role });
};

export const updateUserStatus = async (userId: number, isActive: boolean): Promise<void> => {
  await api.patch(`/admin/users/${userId}/status/`, { is_active: isActive });
};

export const deleteUser = async (userId: number): Promise<void> => {
  await api.delete(`/admin/users/${userId}/`);
};

export const getAdminStats = async (): Promise<{ total_users: number; total_transactions: number }> => {
  const response = await api.get('/admin/stats/');
  return response.data as { total_users: number; total_transactions: number };
};

export default api;
