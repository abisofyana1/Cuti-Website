import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  CheckSquare, 
  Users, 
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label, show }: any) => {
    if (!show) return null;
    return (
      <Link
        to={to}
        onClick={() => setIsMobileOpen(false)}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
          isActive(to) 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm fixed h-full z-10">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-gray-800">E-Cuti App</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="mb-6 px-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</div>
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" show={true} />
            <NavItem to="/apply" icon={PlusCircle} label="Ajukan Cuti" show={user?.role !== 'Admin'} />
            <NavItem to="/history" icon={History} label="Riwayat Saya" show={user?.role !== 'Admin'} />
          </div>

          {(user?.role === 'TL' || user?.role === 'SPV' || user?.role === 'MGR') && (
            <div className="mb-6 px-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Manajemen</div>
              <NavItem to="/approvals" icon={CheckSquare} label="Persetujuan" show={true} />
              <NavItem to="/team-history" icon={Users} label="Riwayat Tim" show={true} />
            </div>
          )}

          {user?.role === 'Admin' && (
             <div className="mb-6 px-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Administrator</div>
              <NavItem to="/admin" icon={ShieldCheck} label="Admin Panel" show={true} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {user?.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-700 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role} - {user?.service}</p>
              </div>
           </div>
           <button 
            onClick={logout} 
            className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
           >
             <LogOut size={16} />
             <span>Keluar</span>
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

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-10 pt-16">
          <div className="bg-white h-full w-3/4 p-4 shadow-xl">
             <NavItem to="/" icon={LayoutDashboard} label="Dashboard" show={true} />
             <NavItem to="/apply" icon={PlusCircle} label="Ajukan Cuti" show={user?.role !== 'Admin'} />
             <NavItem to="/history" icon={History} label="Riwayat Saya" show={user?.role !== 'Admin'} />
             {(user?.role === 'TL' || user?.role === 'SPV' || user?.role === 'MGR') && (
                <>
                  <div className="my-2 border-t border-gray-100"></div>
                  <NavItem to="/approvals" icon={CheckSquare} label="Persetujuan" show={true} />
                  <NavItem to="/team-history" icon={Users} label="Riwayat Tim" show={true} />
                </>
             )}
             {user?.role === 'Admin' && <NavItem to="/admin" icon={ShieldCheck} label="Admin Panel" show={true} />}
             <div className="mt-8 border-t pt-4">
               <button onClick={logout} className="flex items-center space-x-2 text-red-600">
                 <LogOut size={20} /> <span>Keluar</span>
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};