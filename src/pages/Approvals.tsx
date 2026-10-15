import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { CheckCircle, User, Calendar, X, XCircle } from 'lucide-react';
import { LeaveRequest, Role } from '../types';

export const Approvals: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<LeaveRequest[]>([]);
  
  // State Modal
  const [modal, setModal] = useState<{show: boolean, type: 'APPROVE' | 'REJECT', message: string}>({
      show: false, type: 'APPROVE', message: ''
  });
  
  // State for Reject Reason Modal
  const [rejectModal, setRejectModal] = useState<{show: boolean, request: LeaveRequest | null}>({show: false, request: null});
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState(false);
  const rejectInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        const allLeaves = await apiService.getLeaves();
        const myTasks = allLeaves.filter(l => {
            if (l.status !== 'PENDING') return false;
            // Cek apakah user saat ini adalah approver yang dituju
            if (l.currentPosition === 'TL' && l.approverTL === user.email) return true;
            if (l.currentPosition === 'SPV' && l.approverSPV === user.email) return true;
            if (l.currentPosition === 'MGR' && l.approverMGR === user.email) return true;
            return false;
        });
        setTasks(myTasks);
      } catch (e) {
        console.warn("Backend offline, menggunakan data demo untuk approval", e);
        try {
          const { MOCK_LEAVES } = await import('../services/mockData');
          const myTasks = MOCK_LEAVES.filter(l => {
              if (l.status !== 'PENDING') return false;
              if (l.currentPosition === 'TL' && l.approverTL === user.email) return true;
              if (l.currentPosition === 'SPV' && l.approverSPV === user.email) return true;
              if (l.currentPosition === 'MGR' && l.approverMGR === user.email) return true;
              return false;
          });
          setTasks(myTasks);
        } catch (err) {}
      }
    };
    fetchTasks();
  }, [user]);

  const handleAction = async (request: LeaveRequest, action: 'APPROVE' | 'REJECT', reason?: string) => {
    let nextStatus = request.status;
    let nextPosition = request.currentPosition;

    if (action === 'REJECT') {
        nextStatus = 'REJECTED';
    } else {
        // Logika Approval Flow
        if (request.currentPosition === 'TL') {
            nextPosition = request.approverSPV ? 'SPV' : (request.approverMGR ? 'MGR' : 'Admin');
            if (!request.approverSPV && !request.approverMGR) nextStatus = 'APPROVED';
        } else if (request.currentPosition === 'SPV') {
            nextPosition = request.approverMGR ? 'MGR' : 'Admin';
            if (!request.approverMGR) nextStatus = 'APPROVED';
        } else if (request.currentPosition === 'MGR') {
            nextStatus = 'APPROVED';
        }
    }

    const updatedLeave: LeaveRequest = {
        ...request,
        status: nextStatus,
        currentPosition: nextPosition,
        history: [
            ...(request.history || []),
            { stage: user?.role as Role, actor: user?.name || '', action: action, timestamp: new Date().toISOString(), comment: reason }
        ]
    };

    try {
        await apiService.updateLeave(updatedLeave);
        // Hapus dari daftar lokal setelah sukses
        setTasks(prev => prev.filter(t => t.id !== request.id));
        
        // Show Modal
        setModal({
            show: true,
            type: action,
            message: action === 'APPROVE' 
                ? `Pengajuan cuti ${request.userName} telah disetujui.` 
                : `Pengajuan cuti ${request.userName} telah ditolak.`
        });

    } catch (e) {
        alert("Gagal memproses persetujuan");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  // Render Modal Component
  const renderModal = () => {
      if (!modal.show) return null;
      const isApprove = modal.type === 'APPROVE';
      
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 transform scale-100 transition-all animate-in zoom-in-95">
                <div className={`w-20 h-20 ${isApprove ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm`}>
                    {isApprove ? <CheckCircle size={40} className="text-green-600" /> : <XCircle size={40} className="text-red-600" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{isApprove ? 'Disetujui!' : 'Ditolak!'}</h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    {modal.message}
                </p>
                <button 
                    onClick={() => setModal({...modal, show: false})} 
                    className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02] ${isApprove ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                >
                    Tutup
                </button>
             </div>
        </div>
      );
  };

  const renderRejectModal = () => {
      if (!rejectModal.show || !rejectModal.request) return null;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 transform scale-100 transition-all animate-in zoom-in-95">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle size={28} className="text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Alasan Penolakan</h2>
                        <p className="text-sm text-gray-500">Tolak cuti {rejectModal.request.userName}</p>
                    </div>
                </div>
                <textarea
                    ref={rejectInputRef}
                    className={`w-full border ${rejectError ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none ${rejectError ? 'mb-2' : 'mb-6'} resize-none h-32`}
                    placeholder="Masukkan alasan penolakan cuti di sini..."
                    value={rejectReason}
                    onChange={(e) => {
                        setRejectReason(e.target.value);
                        if (e.target.value.trim()) setRejectError(false);
                    }}
                ></textarea>
                {rejectError && <p className="text-red-500 text-sm font-bold text-left mb-4">Alasan penolakan tidak boleh kosong.</p>}
                <div className="flex space-x-3">
                    <button
                        onClick={() => { setRejectModal({show: false, request: null}); setRejectReason(""); setRejectError(false); }}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => {
                            if (!rejectReason.trim()) {
                                setRejectError(true);
                                rejectInputRef.current?.focus();
                                return;
                            }
                            handleAction(rejectModal.request!, 'REJECT', rejectReason);
                            setRejectModal({show: false, request: null});
                            setRejectReason("");
                            setRejectError(false);
                        }}
                        className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition transform hover:scale-[1.02]"
                    >
                        Kirim Penolakan
                    </button>
                </div>
            </div>
        </div>
      );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <>
            {renderModal()}
            {renderRejectModal()}
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Semua Bersih!</h3>
            <p className="text-gray-500">Tidak ada pengajuan yang membutuhkan persetujuan Anda.</p>
        </>
      </div>
    );
  }

  return (
    <div>
      {renderModal()}
      {renderRejectModal()}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <CheckCircle className="mr-3 text-blue-600" /> Menunggu Persetujuan ({tasks.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{task.userName}</h4>
                      <p className="text-xs text-gray-500">{task.service}</p>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{task.totalDays} Hari</span>
               </div>
               <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                     <Calendar size={14} className="mr-2" /> {formatDate(task.startDate)} s/d {formatDate(task.endDate)}
                  </div>
                  <p className="text-sm italic text-gray-700 mt-2">"{task.reason}"</p>
               </div>
               <div className="flex space-x-3">
                  <button onClick={() => setRejectModal({show: true, request: task})} className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 font-semibold transition flex items-center justify-center">
                    <X size={16} className="mr-2"/> Tolak
                  </button>
                  <button onClick={() => handleAction(task, 'APPROVE')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition shadow flex items-center justify-center">
                    <CheckCircle size={16} className="mr-2"/> Setujui
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};