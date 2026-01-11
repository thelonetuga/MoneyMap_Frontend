'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface User {
    id: number;
    email: string;
    role: 'basic' | 'premium' | 'admin';
    profile?: {
        first_name: string;
        last_name: string;
        preferred_currency: string;
        avatar_url?: string;
    };
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    refreshUser: () => Promise<void>;
    formatCurrency: (value: number) => string;
    currencySymbol: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const queryClient = useQueryClient();

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (error) {
            console.error("Auth error:", error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem('token', token);
        fetchUser().then(() => {
            queryClient.invalidateQueries(); // Limpa cache ao login
            router.push('/');
        }); 
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        queryClient.clear(); // Limpa cache ao logout
        router.push('/login');
    };

    const refreshUser = async () => {
        await fetchUser();
        queryClient.invalidateQueries(); // Força atualização de todos os dados ao mudar perfil
    };

    // --- CURRENCY HELPER ---
    const getCurrencyConfig = () => {
        const currency = user?.profile?.preferred_currency || 'EUR';
        switch (currency) {
            case 'USD': return { locale: 'en-US', currency: 'USD', symbol: '$' };
            case 'GBP': return { locale: 'en-GB', currency: 'GBP', symbol: '£' };
            case 'BRL': return { locale: 'pt-BR', currency: 'BRL', symbol: 'R$' };
            default: return { locale: 'pt-PT', currency: 'EUR', symbol: '€' };
        }
    };

    const formatCurrency = (value: number) => {
        const config = getCurrencyConfig();
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const currencySymbol = getCurrencyConfig().symbol;

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            isAuthenticated: !!user, 
            loading, 
            refreshUser,
            formatCurrency,
            currencySymbol
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);