'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces de Dados
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

    // Função central para buscar dados do utilizador
    const fetchUser = async (token: string) => {
        try {
            const res = await fetch('http://127.0.0.1:8000/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                logout(); // Token inválido -> Logout
            }
        } catch (error) {
            console.error("Erro auth:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem('token', token);
        fetchUser(token).then(() => router.push('/')); // Vai para o Dashboard
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (token) await fetchUser(token);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);