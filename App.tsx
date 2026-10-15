import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LeaveForm } from './pages/LeaveForm';
import { Approvals } from './pages/Approvals';
import { Admin } from './pages/Admin';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/apply" element={<ProtectedRoute><LeaveForm /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
      
      {/* Placeholder pages for routes not fully implemented in this demo */}
      <Route path="/history" element={<ProtectedRoute><div className="text-center mt-10 text-gray-500">Halaman Riwayat (Implementasi Serupa Dashboard)</div></ProtectedRoute>} />
      <Route path="/team-history" element={<ProtectedRoute><div className="text-center mt-10 text-gray-500">Riwayat Tim (Khusus Manager)</div></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;