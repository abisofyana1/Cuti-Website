import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { MOCK_LEAVES } from '../services/mockData';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);

  useEffect(() => {
    if (user?.service) {
      fetch(`http://localhost:3002/api/leaves/team?service=${encodeURIComponent(user.service)}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setTeamLeaves(data);
            }
        })
        .catch(err => console.error("Failed to fetch team leaves:", err));
    }
  }, [user]);
  
  
  // Calculate Stats
  const myLeaves = MOCK_LEAVES.filter(l => l.userEmail === user?.email);
  const pending = myLeaves.filter(l => l.status === 'PENDING').length;
  const approved = myLeaves.filter(l => l.status === 'APPROVED').length;
  const rejected = myLeaves.filter(l => l.status === 'REJECTED').length;

  const StatCard = ({ title, count, icon: Icon, color, sub }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{count}</h3>
          {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Halo, {user?.name}!</h1>
          <p className="text-blue-100 opacity-90">Selamat datang kembali di E-Cuti. Anda memiliki <span className="font-bold text-white">{user?.balance} hari</span> sisa cuti tahunan.</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4">
          <Calendar size={200} />
        </div>
      </div>

      {/* Analysis Section (The "Review" requested by user) */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <AlertCircle className="text-amber-600 mt-1 mr-3 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-amber-800 mb-1">Analisa & Perbaikan Sistem (Analysis & Improvements)</h4>
            <p className="text-sm text-amber-700 mb-2">
              Sistem ini telah diperbarui dari versi Google Apps Script sebelumnya. Peningkatan utama meliputi:
            </p>
            <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
              <li><strong>Kecepatan:</strong> Tidak ada lagi reload halaman penuh (SPA Architecture).</li>
              <li><strong>Keamanan:</strong> Logika validasi dan autentikasi dipisahkan dari loop sederhana.</li>
              <li><strong>User Experience:</strong> Notifikasi real-time dan validasi form yang lebih baik.</li>
              <li><strong>Struktur Data:</strong> Penggunaan TypeScript memastikan data konsisten dan minim error.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Sisa Cuti" 
          count={user?.balance} 
          sub="Hari tersedia"
          icon={Calendar} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Menunggu" 
          count={pending} 
          sub="Permohonan aktif"
          icon={Clock} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Disetujui" 
          count={approved} 
          sub="Tahun ini"
          icon={CheckCircle} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Ditolak" 
          count={rejected} 
          sub="Tahun ini"
          icon={XCircle} 
          color="bg-red-500" 
        />
      </div>

      {/* Recent Activity Mini Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Aktivitas Terakhir</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Tipe</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myLeaves.slice(0, 3).map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{l.startDate}</td>
                  <td className="px-6 py-4">{l.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      l.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      l.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {myLeaves.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Belum ada aktivitas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      {/* Team Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users className="text-indigo-600" size={18} />
          </div>
          <h3 className="font-bold text-gray-800">Kalender Tim ({user?.service})</h3>
        </div>
        <div className="p-6">
          {teamLeaves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamLeaves.map((tl, idx) => (
                <div key={idx} className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg flex items-start space-x-3">
                    <Calendar className="text-indigo-500 mt-1 flex-shrink-0" size={20} />
                    <div className="overflow-hidden">
                        <h4 className="font-bold text-indigo-900 truncate">{tl.userName}</h4>
                        <p className="text-sm text-indigo-700 truncate">{new Date(tl.startDate).toLocaleDateString('id-ID')} - {new Date(tl.endDate).toLocaleDateString('id-ID')}</p>
                        <p className="text-xs text-indigo-600 mt-1">{tl.totalDays} Hari</p>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Belum ada anggota tim yang dijadwalkan cuti (Disetujui).</p>
          )}
        </div>
      </div>
    </div>
  );
};