import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, AuthState } from '../types';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthState | undefined>(undefined);

// Key untuk localStorage
const STORAGE_USER_KEY = 'ecuti_user_session';
const STORAGE_ACTIVITY_KEY = 'ecuti_last_activity';
const STORAGE_TIMEOUT_KEY = 'ecuti_timeout_config';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUserStr = localStorage.getItem(STORAGE_USER_KEY);
    return savedUserStr ? JSON.parse(savedUserStr) : null;
  });
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load user dan cek session saat aplikasi pertama kali dimuat
  useEffect(() => {
    if (user) {
      updateLastActivity();
    }
  }, []);

  // --- SESSION IDLE LOGIC ---

  const updateLastActivity = () => {
    localStorage.setItem(STORAGE_ACTIVITY_KEY, Date.now().toString());
  };

  const getTimeoutConfig = () => {
    const config = localStorage.getItem(STORAGE_TIMEOUT_KEY);
    // Default 30 menit jika tidak ada config dari server
    return config ? parseInt(config) : 30 * 60 * 1000;
  };

  const checkSessionTimeout = () => {
    const lastActivity = localStorage.getItem(STORAGE_ACTIVITY_KEY);
    if (!lastActivity) return;

    const now = Date.now();
    const timeSinceLastActivity = now - parseInt(lastActivity);
    const timeoutDuration = getTimeoutConfig();

    if (timeSinceLastActivity > timeoutDuration) {
        handleLogout(true); // Logout karena timeout
    }
  };

  // Setup Event Listeners untuk mendeteksi aktivitas User
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
        updateLastActivity();
    };

    // Pasang listener
    events.forEach(event => {
        window.addEventListener(event, handleUserActivity);
    });

    // Mulai Interval Pengecekan setiap 10 detik
    // Cukup sering untuk akurasi, tapi tidak membebani browser
    checkIntervalRef.current = setInterval(checkSessionTimeout, 10000);

    // Cleanup saat unmount atau user logout
    return () => {
        events.forEach(event => {
            window.removeEventListener(event, handleUserActivity);
        });
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
        }
    };
  }, [user]);

  // --- AUTH ACTIONS ---

  const login = async (email: string, pass: string) => {
    try {
      const response: any = await apiService.login(email, pass);
      
      // Pisahkan user data dan config jika ada
      const { config, ...userData } = response;
      const loggedInUser = userData as User;

      // Simpan User
      setUser(loggedInUser);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(loggedInUser));
      
      // Simpan Config Timeout dari Server (Backend as source of truth)
      if (config && config.sessionTimeout) {
          localStorage.setItem(STORAGE_TIMEOUT_KEY, config.sessionTimeout.toString());
      } else {
          // Fallback default 30 menit
          localStorage.setItem(STORAGE_TIMEOUT_KEY, (30 * 60 * 1000).toString());
      }

      // Mulai tracking waktu
      updateLastActivity();
      setIsSessionExpired(false);

    } catch (error: any) {
      throw new Error(error.message || "Terjadi kesalahan saat login.");
    }
  };

  const handleLogout = (expired: boolean = false) => {
    setUser(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_ACTIVITY_KEY);
    localStorage.removeItem(STORAGE_TIMEOUT_KEY); // Bersihkan config saat logout
    
    if (expired) {
        setIsSessionExpired(true);
    }
  };

  const logout = () => {
    handleLogout(false);
  };

  const resetSessionStatus = () => {
      setIsSessionExpired(false);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated: !!user, 
        isSessionExpired,
        login, 
        logout,
        resetSessionStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};