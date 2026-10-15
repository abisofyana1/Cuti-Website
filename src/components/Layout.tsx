import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, Settings, UserPlus, FileUp, Download, LogOut, CheckSquare, PlusSquare, Clock, ShieldCheck, User, X, Layers, Menu, PlusCircle, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // State untuk Badge Notifikasi
  const [pendingCount, setPendingCount] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  // Fetch Pending Tasks untuk Badge
  useEffect(() => {
    const fetchPending = async () => {
      if (!user) return;
      // Jika Admin, tidak perlu cek pending approval cuti (kecuali flow admin approval ada)
      if (user.role === 'Admin') return;

      try {
        const allLeaves = await apiService.getLeaves();
        const myTasks = allLeaves.filter(l => {
          if (l.status !== 'PENDING') return false;
          if (l.currentPosition === 'TL' && l.approverTL === user.email) return true;
          if (l.currentPosition === 'SPV' && l.approverSPV === user.email) return true;
          if (l.currentPosition === 'MGR' && l.approverMGR === user.email) return true;
          return false;
        });
        setPendingCount(myTasks.length);
      } catch (e) {
        console.error("Gagal cek notifikasi", e);
      }
    };

    // Fetch awal dan setup interval simple (opsional, agar real-time)
    fetchPending();
    const interval = setInterval(fetchPending, 10000); // Cek setiap 10 detik
    return () => clearInterval(interval);
  }, [user]);

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  // --- RENDER LOGOUT MODAL ---
  const renderLogoutModal = () => {
    if (!showLogoutConfirm) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 transform scale-100 transition-all animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <LogOut size={40} className="text-red-600 ml-1" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Keluar Aplikasi?</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Anda yakin ingin mengakhiri sesi ini?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
            >
              Batal
            </button>
            <button
              onClick={handleLogoutConfirm}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NavItem = ({ to, icon: Icon, label, show, badgeCount }: any) => {
    if (!show) return null;
    return (
      <Link
        to={to}
        onClick={() => setIsMobileOpen(false)}
        title={label} // Tooltip native browser untuk state collapsed
        className={`relative flex items-center px-4 py-3 rounded-lg transition-colors mb-1 overflow-hidden whitespace-nowrap ${isActive(to)
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
          }`}
      >
        <div className="min-w-[24px] flex items-center justify-center relative">
          <Icon size={22} />
        </div>

        {/* Teks selalu muncul */}
        <div className="ml-3 flex-1 flex items-center justify-between">
          <span className="font-medium">{label}</span>
          {badgeCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
              {badgeCount}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Sidebar Desktop - AUTO HIDE / HOVER REVEAL */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen z-30 bg-white border-r border-gray-200 shadow-sm w-64 overflow-hidden flex-shrink-0">

        {/* Header Sidebar */}
        <div className="p-6 border-b border-gray-100 flex items-center h-20">
          <div className="w-8 h-8 min-w-[32px] bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-gray-800 ml-3 whitespace-nowrap">
            E-Cuti App
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
          {user?.role !== 'Admin' && (
            <div className="mb-6">
              <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 whitespace-nowrap h-4">
                Menu Utama
              </div>
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" show={true} />
              <NavItem to="/apply" icon={PlusCircle} label="Ajukan Cuti" show={true} />
            </div>
          )}

          {(user?.role === 'TL' || user?.role === 'SPV' || user?.role === 'MGR') && (
            <div className="mb-6">
              <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 whitespace-nowrap h-4">
                Manajemen
              </div>
              <NavItem
                to="/team-history"
                icon={Users}
                label="Riwayat Team"
                show={true}
              />
              <NavItem
                to="/approvals"
                icon={CheckSquare}
                label="Persetujuan"
                show={true}
                badgeCount={pendingCount} // Tampilkan Badge
              />
            </div>
          )}

          {/* SIDEBAR ADMIN */}
          {user?.role === 'Admin' && (
            <div className="mb-6">
              <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 whitespace-nowrap h-4">
                Administrator
              </div>
              <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" show={true} />
              <NavItem to="/admin/add-user" icon={UserPlus} label="Tambah User" show={true} />

              <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 whitespace-nowrap h-4">
                Manage
              </div>
              <NavItem to="/admin/services" icon={Layers} label="Layanan" show={true} />
              <NavItem to="/admin/holidays" icon={Calendar} label="Hari Libur" show={true} />
            </div>
          )}
        </div>

        {/* Footer Sidebar (User Profile & Logout) */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center mb-4 px-1 overflow-hidden">
            <div className="w-10 h-10 min-w-[40px] rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="ml-3 whitespace-nowrap">
              <p className="text-sm font-bold text-gray-700 truncate w-40">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate w-40">{user?.role} - {user?.service}</p>
            </div>
          </div>
          {/* TRIGGER LOGOUT MODAL */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium overflow-hidden whitespace-nowrap"
            title="Keluar"
          >
            <div className="min-w-[20px] flex justify-center"><LogOut size={20} /></div>
            <span className="ml-3">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="text-white" size={20} />
          </div>
          <span className="font-bold text-gray-800">E-Cuti</span>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-gray-600">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay (Tetap sama seperti sebelumnya) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-30 pt-16">
          <div className="bg-white h-full w-3/4 p-4 shadow-xl overflow-y-auto">
            {/* Logic Menu Mobile disamakan dengan Desktop tapi tanpa auto-hide */}
            {user?.role !== 'Admin' && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</div>
                <NavItem to="/" icon={LayoutDashboard} label="Dashboard" show={true} />
                <NavItem to="/apply" icon={PlusCircle} label="Ajukan Cuti" show={true} />
              </>
            )}
            {(user?.role === 'TL' || user?.role === 'SPV' || user?.role === 'MGR') && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Manajemen</div>
                <NavItem to="/team-history" icon={Users} label="Riwayat Team" show={true} />
                <NavItem to="/approvals" icon={CheckSquare} label="Persetujuan" show={true} badgeCount={pendingCount} />
              </>
            )}

            {user?.role === 'Admin' && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Admin</div>
                <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" show={true} />
                <NavItem to="/admin/add-user" icon={UserPlus} label="Tambah User" show={true} />
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Manage</div>
                <NavItem to="/admin/services" icon={Layers} label="Layanan" show={true} />
              </>
            )}

            <div className="mt-8 border-t pt-4">
              {/* TRIGGER LOGOUT MODAL MOBILE */}
              <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center space-x-2 text-red-600 w-full px-4 py-2 hover:bg-red-50 rounded-lg">
                <LogOut size={20} /> <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:px-6 md:py-4 pt-20 md:pt-4 bg-gray-50 min-h-screen transition-all duration-300 min-w-0">
        <div className="w-full mx-auto">
          {children}
        </div>
      </main>

      {/* RENDER MODAL */}
      {renderLogoutModal()}
    </div>
  );
};