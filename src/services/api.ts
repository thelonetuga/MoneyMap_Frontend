import axios from 'axios';
import { HistoryPoint, SpendingItem, PortfolioResponse, EvolutionPoint } from '../types/api';

// Ajusta a URL se o teu backend estiver noutro sítio
export const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Mágico: Injeta o token antes de cada pedido sair
api.interceptors.request.use((config) => {
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

// --- SERVIÇOS DE ANALYTICS ---

export const getPortfolio = async (): Promise<PortfolioResponse> => {
  const response = await api.get('/portfolio');
  return response.data as PortfolioResponse;
};

export const updateAssetPrices = async (): Promise<{ updated_count: number }> => {
  const response = await api.post('/portfolio/update-prices');
  return response.data as { updated_count: number };
};

export const getHistory = async (range: string = '30d'): Promise<HistoryPoint[]> => {
  const response = await api.get('/analytics/history', {
    params: { range }
  });
  return response.data as HistoryPoint[];
};

export const getSpending = async (range: string = '30d'): Promise<SpendingItem[]> => {
  const response = await api.get('/analytics/spending', {
    params: { range }
  });
  return response.data as SpendingItem[];
};

export const getEvolution = async (period: string = 'year'): Promise<EvolutionPoint[]> => {
  const response = await api.get('/analytics/evolution', {
    params: { period }
  });
  return response.data as EvolutionPoint[];
};

export default api;
