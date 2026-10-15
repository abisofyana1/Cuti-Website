import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LeaveForm } from './pages/LeaveForm';
import { Approvals } from './pages/Approvals';
import { AdminPanel } from './pages/AdminPanel';
import { TeamHistory } from './pages/TeamHistory'; // Import komponen baru

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
      <Route path="/apply" element={<ProtectedRoute><><Dashboard /><LeaveForm /></></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
      
      {/* Route Baru untuk Riwayat Team */}
      <Route path="/team-history" element={<ProtectedRoute><TeamHistory /></ProtectedRoute>} />
      
      {/* Admin Routes - View Controlled via Props */}
      <Route path="/admin" element={<ProtectedRoute><AdminPanel view="dashboard" /></ProtectedRoute>} />
      <Route path="/admin/add-user" element={<ProtectedRoute><AdminPanel view="add-user" /></ProtectedRoute>} />
      <Route path="/admin/export" element={<ProtectedRoute><AdminPanel view="export" /></ProtectedRoute>} />
      <Route path="/admin/import" element={<ProtectedRoute><AdminPanel view="import" /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute><AdminPanel view="services" /></ProtectedRoute>} />
      <Route path="/admin/holidays" element={<ProtectedRoute><AdminPanel view="holidays" /></ProtectedRoute>} />
      
      <Route path="/history" element={<ProtectedRoute><div className="text-center mt-10 text-gray-500">Halaman Riwayat (Segera Hadir)</div></ProtectedRoute>} />
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