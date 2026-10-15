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
      const response = await fetch('http://localhost:3002/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: pass }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Email / HQ atau password salah");
      }

      const userData = await response.json();
      setUser(userData as User);
      localStorage.setItem('ecuti_user', JSON.stringify(userData));
    } catch (err: any) {
      throw err;
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