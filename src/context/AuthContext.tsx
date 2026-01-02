'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api'; // <--- A peça chave

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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            // Usa api.get em vez de fetch. O token vai automático.
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (error) {
            console.error("Erro auth:", error);
            // Se der erro de auth, o próprio api.ts já trata do redirect,
            // mas podemos forçar limpeza aqui por segurança
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
        // Esperamos que o user carregue antes de navegar
        fetchUser().then(() => router.push('/')); 
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);