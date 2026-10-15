import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, Bell, X, Circle, Minus, Briefcase, Download } from 'lucide-react';
import { apiService } from '../services/api';
import { LeaveRequest, BalanceHistory } from '../types';
import { AdminPanel } from './AdminPanel';
import { generateLeavePDF } from '../utils/pdfGenerator';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);
  const [liveBalance, setLiveBalance] = useState(user?.balance || 0);
  
  const pendingDays = myLeaves.filter(l => l.status === 'PENDING').reduce((acc, curr) => acc + curr.totalDays, 0);
  const effectiveBalance = liveBalance - pendingDays;
  
  // State untuk Notifikasi Pop-up
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error';
  }>({ show: false, title: '', message: '', type: 'info' });

  // Ref untuk menyimpan data snapshot terakhir agar bisa dibandingkan (Diffing)
  // Kita gunakan useRef agar nilai tetap ada di antara render cycle tanpa memicu re-render berlebih
  const lastLeavesRef = useRef<LeaveRequest[]>([]);
  const isFirstLoad = useRef(true);

  const handleDownloadSurat = async (leave: LeaveRequest) => {
    try {
        const users = await apiService.getUsers();
        if (user) {
            generateLeavePDF(leave, user, users);
        }
    } catch (err) {
        console.error("Failed to download PDF", err);
        setNotification({ show: true, title: 'Error', message: 'Gagal mengunduh Surat Cuti', type: 'error' });
    }
  };

  // --- LOGIC FETCH & NOTIFICATION SYSTEM ---
  useEffect(() => {
    const checkUpdates = async () => {
      // Jika Admin, hentikan fetch data cuti pribadi karena kita akan menampilkan AdminPanel
      if (!user || user.role === 'Admin') return;

      try {
        const currentLeaves = await apiService.getLeaves();
        
        // Ambil data user terbaru untuk cek live balance
        try {
            const allUsers = await apiService.getUsers();
            const me = allUsers.find(u => u.email === user?.email);
            if (me) setLiveBalance(me.balance);
        } catch (e) {}

        // Ambil riwayat penambahan saldo
        if (user?.email) {
            const hist = await apiService.getBalanceHistory(user.email);
            setBalanceHistory(hist);
        }

        // Ambil data cuti tim
        if (user?.service) {
            try {
                const tlResponse = await fetch(`http://localhost:3002/api/leaves/team?service=${encodeURIComponent(user.service)}`);
                const tlData = await tlResponse.json();
                if (Array.isArray(tlData)) setTeamLeaves(tlData);
            } catch (err) { console.error(err) }
        }
        
        // 1. Update Tampilan Dashboard (My Leaves)
        const myCurrentLeaves = currentLeaves.filter(l => l.userEmail === user?.email);
        setMyLeaves(myCurrentLeaves);

        // --- NOTIFICATION LOGIC START ---
        
        // Ambil data lama dari Ref (atau LocalStorage jika refresh halaman)
        let prevLeaves = lastLeavesRef.current;
        if (prevLeaves.length === 0) {
            const stored = localStorage.getItem('ecuti_leaves_snapshot');
            if (stored) prevLeaves = JSON.parse(stored);
        }

        // Jangan trigger notifikasi pada load pertama kali
        if (!isFirstLoad.current && prevLeaves.length > 0) {
            
            // A. LOGIC UNTUK TAD (STAFF/USER): Cek Status Berubah
            // Cari cuti milik user ini yang statusnya berubah dari PENDING ke Final
            const myPrevLeaves = prevLeaves.filter(l => l.userEmail === user?.email);
            
            myCurrentLeaves.forEach(curr => {
                const old = myPrevLeaves.find(o => o.id === curr.id);
                // Jika ketemu data lama, status lamanya PENDING, dan status barunya BUKAN PENDING
                if (old && old.status === 'PENDING' && curr.status !== 'PENDING') {
                    setNotification({
                        show: true,
                        title: curr.status === 'APPROVED' ? 'Pengajuan Disetujui!' : 'Pengajuan Ditolak',
                        message: `Pengajuan cuti Anda untuk tanggal ${new Date(curr.startDate).toLocaleDateString('id-ID')} telah ${curr.status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK'}.`,
                        type: curr.status === 'APPROVED' ? 'success' : 'error'
                    });
                }
            });

            // B. LOGIC UNTUK APPROVER (TL/SPV/MGR): Cek Pengajuan Baru Masuk
            if (user.role !== 'User') {
                // Helper filter task
                const getMyPending = (list: LeaveRequest[]) => list.filter(l => {
                    if (l.status !== 'PENDING') return false;
                    if (l.currentPosition === 'TL' && l.approverTL === user.email) return true;
                    if (l.currentPosition === 'SPV' && l.approverSPV === user.email) return true;
                    if (l.currentPosition === 'MGR' && l.approverMGR === user.email) return true;
                    return false;
                });

                const prevPending = getMyPending(prevLeaves);
                const currPending = getMyPending(currentLeaves);

                // Jika jumlah task bertambah, berarti ada pengajuan baru
                if (currPending.length > prevPending.length) {
                    setNotification({
                        show: true,
                        title: 'Pengajuan Baru Masuk',
                        message: 'Ada pengajuan cuti baru dari staff yang menunggu persetujuan Anda di menu Persetujuan.',
                        type: 'info'
                    });
                }
            }
        }

        // Update Snapshot
        lastLeavesRef.current = currentLeaves;
        localStorage.setItem('ecuti_leaves_snapshot', JSON.stringify(currentLeaves));
        isFirstLoad.current = false;
        // --- NOTIFICATION LOGIC END ---

      } catch (error) {
        console.error("Gagal mengambil data cuti", error);
      }
    };

    // Jalankan checkUpdates segera
    checkUpdates();

    // Jalankan interval setiap 5 detik (Polling)
    const interval = setInterval(checkUpdates, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // --- LOGIKA UTAMA: JIKA ADMIN, TAMPILKAN ADMIN PANEL ---
  if (user?.role === 'Admin') {
    return <AdminPanel />;
  }

  // --- TAMPILAN USER BIASA (STAFF/TL/SPV/MGR) ---
  const pending = myLeaves.filter(l => l.status === 'PENDING').length;
  const approved = myLeaves.filter(l => l.status === 'APPROVED').length;
  const rejected = myLeaves.filter(l => l.status === 'REJECTED').length;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const formatDateFull = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // --- RENDER STATUS ICONS (Visual Flow) ---
  const renderStatusIcons = (leave: LeaveRequest) => {
    const getStageStatus = (role: 'TL' | 'SPV' | 'MGR') => {
        const approverEmail = role === 'TL' ? leave.approverTL : (role === 'SPV' ? leave.approverSPV : leave.approverMGR);
        if (!approverEmail) return 'strip';
        
        const historyArray = Array.isArray(leave.history) ? leave.history : [];
        // Cari status approval terakhir untuk stage ini
        const historyItem = historyArray.find((h: any) => h.stage === role);
        
        if (historyItem) {
            if (historyItem.action === 'APPROVE') return 'approved';
            if (historyItem.action === 'REJECT') return 'rejected';
        }
        
        // Jika belum ada di history, cek posisi dokumen saat ini
        if (leave.currentPosition === role && leave.status === 'PENDING') return 'pending';
        
        // Logika untuk stage yang sudah lewat atau jika status akhir APPROVED
        const rolesOrder = ['User', 'TL', 'SPV', 'MGR', 'Admin'];
        const currentIdx = rolesOrder.indexOf(leave.currentPosition);
        const roleIdx = rolesOrder.indexOf(role);
        
        // Jika dokumen sudah melewati stage ini dan tidak rejected
        if (currentIdx > roleIdx && leave.status !== 'REJECTED') return 'approved';
        // Jika dokumen sudah fully approved
        if (leave.status === 'APPROVED') return 'approved';
        
        return 'waiting';
    };

    const renderIcon = (status: string, label: string) => {
        let icon = <Circle size={18} className="text-gray-200" />;
        let colorClass = "text-gray-400";
        
        if (status === 'approved') {
            icon = <CheckCircle size={18} />;
            colorClass = "text-green-500";
        } else if (status === 'rejected') {
            icon = <XCircle size={18} />;
            colorClass = "text-red-500";
        } else if (status === 'pending') {
            icon = <Clock size={18} className="animate-pulse" />;
            colorClass = "text-amber-500";
        } else if (status === 'strip') {
            icon = <Minus size={18} />;
            colorClass = "text-gray-300";
        }
        
        return (
            <div className={`flex flex-col items-center mx-2 ${colorClass}`} title={`${label}: ${status}`}>
                {icon}
                <span className="text-[10px] font-bold mt-1">{label}</span>
            </div>
        );
    };

    return (
        <div className="flex items-center justify-center">
            {renderIcon(getStageStatus('TL'), 'TL')}
            <div className="w-4 h-0.5 bg-gray-200"></div>
            {renderIcon(getStageStatus('SPV'), 'SPV')}
            <div className="w-4 h-0.5 bg-gray-200"></div>
            {renderIcon(getStageStatus('MGR'), 'MGR')}
        </div>
    );
  };

  const StatCard = ({ title, count, icon: Icon, color, sub, list, listColorClass, alertText }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{count}</h3>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {list && list.length > 0 && (
         <div className="mt-auto border-t border-gray-100 pt-3 max-h-24 overflow-y-auto">
             <ul className="text-xs text-gray-600 space-y-2">
                 {list.map((item: any) => (
                     <li key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-1">
                         <span className="truncate mr-2" title={item.reason}>{new Date(item.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                         <span className={`font-bold whitespace-nowrap ${listColorClass}`}>{item.totalDays} Hari</span>
                     </li>
                 ))}
             </ul>
         </div>
      )}
      {alertText && (
         <div className="mt-4 pt-3 border-t border-gray-100">
             <p className="text-sm text-red-600">{alertText}</p>
         </div>
      )}
    </div>
  );

  const currentYear = new Date().getFullYear();
  const cutiBersamaList = balanceHistory.filter(b => 
      b.description.toLowerCase().includes('cuti bersama') || b.description.match(/^\[\d{4}-\d{2}-\d{2}\]/)
  ).filter(b => {
      const match = b.description.match(/^\[(\d{4}-\d{2}-\d{2})\]/);
      const dateStr = match ? match[1] : b.createdAt;
      return new Date(dateStr).getFullYear() === currentYear;
  });

  const CutiBersamaCard = ({ list }: { list: BalanceHistory[] }) => {
      const total = list.reduce((sum, b) => sum + Number(b.amount), 0);
      return (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
             <div className="flex justify-between items-start mb-3">
                 <div>
                     <p className="text-sm font-medium text-gray-500 mb-0.5">Masuk Cuti Bersama</p>
                     <h3 className="text-2xl font-bold text-gray-800">{total}</h3>
                     <p className="text-xs text-gray-400 mt-1">Tahun {currentYear}</p>
                 </div>
                 <div className="p-2.5 rounded-lg bg-indigo-500">
                     <Briefcase size={20} className="text-white" />
                 </div>
             </div>
             {list.length > 0 && (
                 <div className="mt-auto border-t border-gray-100 pt-3 max-h-24 overflow-y-auto">
                     <ul className="text-xs text-gray-600 space-y-2">
                         {list.map(b => {
                             const match = b.description.match(/^\[(\d{4}-\d{2}-\d{2})\]/);
                             const dateStr = match ? match[1] : b.createdAt;
                             return (
                                 <li key={b.id} className="flex justify-between items-center border-b border-gray-50 pb-1">
                                     <span>{new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                     <span className="font-bold text-indigo-600">+{b.amount}</span>
                                 </li>
                             );
                         })}
                     </ul>
                 </div>
             )}
          </div>
      )
  };

  // --- RENDER NOTIFICATION MODAL ---
  const renderNotificationModal = () => {
      if (!notification.show) return null;
      
      let icon = <Bell size={32} className="text-blue-600" />;
      let bgIcon = "bg-blue-100";
      let btnColor = "bg-blue-600 hover:bg-blue-700";

      if (notification.type === 'success') {
          icon = <CheckCircle size={32} className="text-green-600" />;
          bgIcon = "bg-green-100";
          btnColor = "bg-green-600 hover:bg-green-700";
      } else if (notification.type === 'error') {
          icon = <XCircle size={32} className="text-red-600" />;
          bgIcon = "bg-red-100";
          btnColor = "bg-red-600 hover:bg-red-700";
      }

      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all animate-in zoom-in-95 relative">
                <button 
                    onClick={() => setNotification({ ...notification, show: false })}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <X size={20} />
                </button>
                <div className="p-8 text-center">
                    <div className={`w-20 h-20 ${bgIcon} rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm animate-bounce`}>
                        {icon}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{notification.title}</h2>
                    <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                        {notification.message}
                    </p>
                    <button 
                        onClick={() => setNotification({ ...notification, show: false })}
                        className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02] ${btnColor}`}
                    >
                        OK, Mengerti
                    </button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-1">
      {/* POP UP NOTIFICATION */}
      {renderNotificationModal()}

      {/* Welcome Banner */}
      <div className="sticky top-16 md:top-4 z-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl px-6 py-5 text-white shadow-md overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Halo, {user?.name}!</h1>
          <p className="text-sm text-blue-100 opacity-90">
            Selamat datang di E-Cuti. Anda memiliki <span className="font-bold text-white bg-white/20 px-2 rounded">{effectiveBalance} hari</span> sisa cuti.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4">
          <Calendar size={200} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        <StatCard title="Sisa Cuti" count={effectiveBalance} sub="Hari tersedia" icon={Calendar} color="bg-blue-500" />
        <CutiBersamaCard list={cutiBersamaList} />
        <StatCard 
            title="Menunggu" 
            count={pending} 
            sub="Permohonan aktif" 
            icon={Clock} 
            color="bg-amber-500" 
            list={myLeaves.filter(l => l.status === 'PENDING')} 
            listColorClass="text-amber-600" 
            alertText={pending > 0 ? `Saat ini Permohonan Cuti masih menunggu persetujuan ${Array.from(new Set(myLeaves.filter(l => l.status === 'PENDING').map(l => l.currentPosition))).join('/')}` : null}
        />
        <StatCard title="Disetujui" count={approved} sub="Total disetujui" icon={CheckCircle} color="bg-green-500" list={myLeaves.filter(l => l.status === 'APPROVED')} listColorClass="text-green-600" />
        <StatCard title="Ditolak" count={rejected} sub="Total ditolak" icon={XCircle} color="bg-red-500" list={myLeaves.filter(l => l.status === 'REJECTED')} listColorClass="text-red-600" />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Riwayat Pengajuan Terakhir</h3>
        </div>
        <div className="relative border border-gray-100 rounded-lg w-full overflow-x-auto overflow-y-auto max-h-[420px]">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-6 py-3 bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-100">Tanggal Cuti</th>
                <th className="px-6 py-3 bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-100">Alasan</th>
                <th className="px-6 py-3 text-center bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-100">Durasi</th>
                <th className="px-6 py-3 text-center bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-100">Posisi Saat Ini</th>
                <th className="px-6 py-3 text-center bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-100">Surat Cuti</th>
                <th className="px-6 py-3 text-center bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-100">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myLeaves.length > 0 ? myLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap align-middle">
                    {formatDate(l.startDate)} <span className="text-gray-400 mx-1">➜</span> {formatDate(l.endDate)}
                  </td>
                  <td className="px-6 py-4 truncate max-w-xs align-middle">{l.reason}</td>
                  <td className="px-6 py-4 text-center align-middle font-bold">{l.totalDays} Hari</td>
                  <td className="px-6 py-4 align-middle">
                     {renderStatusIcons(l)}
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                      {l.status === 'APPROVED' ? (
                          <button onClick={() => handleDownloadSurat(l)} title="Download Surat Cuti" className="flex flex-col items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition mx-auto w-12">
                              <Download size={18} />
                              <span className="text-[10px] font-bold mt-1">PDF</span>
                          </button>
                      ) : (
                          <span className="text-gray-300">-</span>
                      )}
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      l.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      l.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {l.status}
                    </span>
                    {l.status === 'REJECTED' && l.history && l.history.find(h => h.action === 'REJECT' && h.comment) && (
                      <p className="text-[10px] text-red-500 mt-1 italic max-w-[120px] mx-auto break-words">
                        "{l.history.find(h => h.action === 'REJECT' && h.comment)?.comment}"
                      </p>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Belum ada riwayat pengajuan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Team Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Briefcase className="text-indigo-600" size={18} />
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
                        <p className="text-sm text-indigo-700 truncate">{formatDateFull(tl.startDate)} - {formatDateFull(tl.endDate)}</p>
                        <p className="text-xs text-indigo-600 mt-1">{tl.totalDays} Hari • {tl.reason || 'Cuti'}</p>
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