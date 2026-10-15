import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { MOCK_USERS } from '../services/mockData';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ecuti_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      // Coba fetch backend jika aktif
      const response = await fetch('http://localhost:3002/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: pass }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData as User);
        localStorage.setItem('ecuti_user', JSON.stringify(userData));
        return;
      }
    } catch (err) {
      // Backend offline / mode demo tanpa database
      console.warn("Backend offline, menggunakan akun demo lokal.");
    }

    // Fallback: Login menggunakan data mock lokal (tanpa database)
    const normalizedInput = email.trim().toLowerCase();
    const mockUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === normalizedInput || (u as any).hq?.toLowerCase() === normalizedInput
    );

    if (mockUser && mockUser.password === pass) {
      setUser(mockUser);
      localStorage.setItem('ecuti_user', JSON.stringify(mockUser));
    } else {
      throw new Error("Email / HQ atau password salah. Coba akun demo: staff@ecuti.com / 123");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ecuti_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};