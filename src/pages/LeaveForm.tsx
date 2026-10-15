import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Calendar, Save, AlertTriangle, CheckCircle, Ban, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeaveRequest, User, Holiday } from '../types';

export const LeaveForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // State untuk Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [holidaysList, setHolidaysList] = useState<Holiday[]>([]);
  
  // Ambil daftar user dan hari libur
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [usersData, holidaysData] = await Promise.all([
            apiService.getUsers(),
            apiService.getHolidays()
        ]);
        setUsersList(usersData);
        setHolidaysList(holidaysData);
      } catch (err) {
        console.warn("Failed to fetch initial data from server, using mock fallback", err);
        try {
          const { MOCK_USERS, MOCK_HOLIDAYS } = await import('../services/mockData');
          setUsersList(MOCK_USERS);
          setHolidaysList(MOCK_HOLIDAYS);
        } catch (e) {}
      }
    };
    fetchInitData();
  }, []);

  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [ownOverlapWarning, setOwnOverlapWarning] = useState<string | null>(null);

  useEffect(() => {
    if (user?.service) {
      fetch(`http://localhost:3002/api/leaves/team?service=${encodeURIComponent(user.service)}&status=all_active`)
        .then(res => res.json())
        .then(data => {
           if(Array.isArray(data)) setTeamLeaves(data);
        })
        .catch(console.error);
    }
  }, [user]);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const toLocalDateStr = (dateInput: string | Date) => {
      const d = new Date(dateInput);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
     if (formData.startDate && formData.endDate && teamLeaves.length > 0) {
        const startStr = formData.startDate;
        const endStr = formData.endDate;
        
        const myOverlaps = teamLeaves.filter(tl => {
            if (tl.userEmail !== user?.email) return false;
            const tlStartStr = toLocalDateStr(tl.startDate);
            const tlEndStr = toLocalDateStr(tl.endDate);
            return (startStr <= tlEndStr && endStr >= tlStartStr);
        });

        const teamOverlaps = teamLeaves.filter(tl => {
            if (tl.userEmail === user?.email) return false;
            const tlStartStr = toLocalDateStr(tl.startDate);
            const tlEndStr = toLocalDateStr(tl.endDate);
            return (startStr <= tlEndStr && endStr >= tlStartStr);
        });

        if (myOverlaps.length > 0) {
            setOwnOverlapWarning(`Anda sudah memiliki pengajuan cuti pada tanggal yang bersinggungan (${new Date(myOverlaps[0].startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} - ${new Date(myOverlaps[0].endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} dengan status ${myOverlaps[0].status}).`);
        } else {
            setOwnOverlapWarning(null);
        }

        if (teamOverlaps.length > 0) {
            const overlapDetails = teamOverlaps.map(l => 
                `${l.userName} mengajukan cuti tanggal ${new Date(l.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} - ${new Date(l.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`
            ).join(', ');
            
            setDateWarning(`Perhatian: Di tanggal tersebut ${overlapDetails}, Silahkan pilih tanggal lain.`);
        } else {
            setDateWarning(null);
        }
     } else {
        setDateWarning(null);
        setOwnOverlapWarning(null);
     }
  }, [formData.startDate, formData.endDate, teamLeaves, user]);



  const calculateWorkingDays = (start: string, end: string) => {
    if (!start || !end) return { days: 0, warning: null };
    const s = new Date(start);
    const e = new Date(end);
    if (s > e) return { days: 0, warning: null };

    let workingDays = 0;
    let currentDate = new Date(s);
    let holidayDates: string[] = [];
    let weekendDates: string[] = [];

    while (currentDate <= e) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = toLocalDateStr(currentDate);
        
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const holiday = holidaysList.find(h => toLocalDateStr(h.date) === dateStr);

        if (holiday) {
            const formattedDate = currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            holidayDates.push(`${holiday.description} ${formattedDate}`);
        } else if (isWeekend) {
            const dayName = dayOfWeek === 0 ? 'Minggu' : 'Sabtu';
            const formattedDateWithoutDay = currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            weekendDates.push(`${dayName}, ${formattedDateWithoutDay}`);
        } else {
            workingDays++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }

    let warningMsg = null;
    let skippedCount = holidayDates.length + weekendDates.length;
    
    if (skippedCount > 0) {
        let combinedMessages = [];
        if (holidayDates.length > 0) {
            let hString = holidayDates.length === 1 ? holidayDates[0] : (holidayDates.length === 2 ? holidayDates.join(' dan ') : holidayDates.slice(0, -1).join(', ') + ' dan ' + holidayDates[holidayDates.length - 1]);
            combinedMessages.push(`bertepatan dengan ${hString}`);
        }
        if (weekendDates.length > 0) {
            let wString = weekendDates.length === 1 ? weekendDates[0] : (weekendDates.length === 2 ? weekendDates.join(' dan ') : weekendDates.slice(0, -1).join(', ') + ' dan ' + weekendDates[weekendDates.length - 1]);
            combinedMessages.push(`Hari Libur - ${wString}`);
        }
        
        let finalString = combinedMessages.join(' dan ');
        warningMsg = `Perhatian: Ada ${skippedCount} hari yang tidak dihitung memotong kuota cuti karena ${finalString}.`;
    }

    return { days: workingDays, warning: warningMsg };
  };

  const { days: totalDays, warning: holidayWarning } = calculateWorkingDays(formData.startDate, formData.endDate);

  // Helper untuk mendapatkan Nama User berdasarkan Email
  const getApproverName = (email?: string) => {
      if (!email) return '-';
      const found = usersList.find(u => u.email === email);
      return found ? found.name : email;
  };

  const dbBalance = usersList.find(u => u.email === user?.email)?.balance ?? (user?.balance || 0);
  const pendingDays = teamLeaves.filter(l => l.userEmail === user?.email && l.status === 'PENDING').reduce((acc, curr) => acc + curr.totalDays, 0);
  const currentBalance = dbBalance - pendingDays;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (formData.startDate > formData.endDate) {
      alert("Tanggal Selesai tidak boleh mendahului Tanggal Mulai.");
      return;
    }
    if (ownOverlapWarning) {
      alert("Anda sudah memiliki pengajuan cuti di tanggal tersebut.");
      return;
    }
    if (dateWarning) {
      alert("Ada rekan tim yang mengajukan cuti pada tanggal tersebut. Silahkan pilih tanggal lain.");
      return;
    }
    if (totalDays <= 0) {
      alert("Durasi cuti minimal 1 hari.");
      return;
    }
    if (totalDays > currentBalance) {
      alert("Sisa cuti tidak mencukupi!");
      return;
    }

    setLoading(true);

    // Capture Time saat tombol diklik
    const submissionTime = new Date().toISOString();

    const newLeave: LeaveRequest = {
        id: `CT-${Date.now()}`,
        userEmail: user.email,
        userName: user.name,
        service: user.service, // Lock to user service
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: totalDays,
        reason: formData.reason,
        status: 'PENDING',
        // Tentukan posisi awal dokumen berdasarkan siapa approver pertama yang ada
        currentPosition: user.tlEmail ? 'TL' : (user.spvEmail ? 'SPV' : 'MGR'),
        approverTL: user.tlEmail,
        approverSPV: user.spvEmail,
        approverMGR: user.mgrEmail,
        createdAt: submissionTime, // WAKTU PENGAJUAN DIAMBIL DISINI
        history: [{ stage: 'User', actor: user.name, action: 'SUBMIT', timestamp: submissionTime }]
    };

    try {
      await apiService.addLeave(newLeave);
      setShowSuccessModal(true);
    } catch (error) {
      alert("Gagal mengajukan cuti.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  const renderModal = () => {
    if (!showSuccessModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center transform scale-100 transition-all animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pengajuan Terkirim!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Permohonan cuti Anda telah berhasil dikirim dan menunggu persetujuan atasan.
                </p>
                <button 
                    onClick={handleCloseModal}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200"
                >
                    OK, Mengerti
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {renderModal()}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Calendar className="mr-2 text-blue-600" size={18} /> Form Cuti
          </h2>
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold text-gray-500">
               Sisa: <span className="text-blue-600 text-md">{currentBalance}</span>
             </span>
             <button type="button" onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 p-1 rounded transition">
               <X size={20} />
             </button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-4 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Layanan</label>
              <input 
                type="text" 
                value={user?.service || '-'} 
                disabled 
                className="w-full rounded-lg border-gray-300 border px-3 py-2 bg-gray-100 text-gray-500 text-sm focus:outline-none"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                <AlertTriangle className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={14} />
                <p className="text-[11px] text-blue-700 leading-tight">
                    Sistem otomatis menghitung sisa cuti berdasarkan hari kerja.
                </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Approval</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">TL</label>
                <input type="text" value={getApproverName(user?.tlEmail)} disabled className="w-full text-xs rounded border-gray-300 p-2 bg-gray-100 text-gray-600 border" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">SPV</label>
                <input type="text" value={getApproverName(user?.spvEmail)} disabled className="w-full text-xs rounded border-gray-300 p-2 bg-gray-100 text-gray-600 border" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">MGR</label>
                <input type="text" value={getApproverName(user?.mgrEmail)} disabled className="w-full text-xs rounded border-gray-300 p-2 bg-gray-100 text-gray-600 border" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-2 text-center italic">*Otomatis berdasarkan struktur.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mulai</label>
              <input type="date" required className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Selesai</label>
              <input type="date" required className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Durasi</label>
               <div className={`w-full px-3 py-2 rounded-lg border font-bold text-sm text-center ${totalDays > currentBalance ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                 {totalDays} Hari
               </div>
            </div>
          </div>

          {dateWarning && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start mt-4">
                <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0" size={16} />
                <p className="text-sm text-amber-700 leading-relaxed font-bold">
                    {dateWarning}
                </p>
            </div>
          )}

          {formData.startDate && formData.endDate && formData.startDate > formData.endDate && (
             <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start mt-4">
                 <AlertTriangle className="text-red-500 mr-2 flex-shrink-0" size={16} />
                 <p className="text-sm text-red-700 leading-relaxed font-bold">
                     Tanggal Selesai tidak boleh mendahului Tanggal Mulai.
                 </p>
             </div>
          )}

          {ownOverlapWarning && (
             <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start mt-4">
                 <AlertTriangle className="text-red-500 mr-2 flex-shrink-0" size={16} />
                 <p className="text-sm text-red-700 leading-relaxed font-bold">
                     {ownOverlapWarning}
                 </p>
             </div>
          )}

          {holidayWarning && (
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start mt-4">
                 <Calendar className="text-blue-500 mr-2 flex-shrink-0" size={16} />
                 <p className="text-sm text-blue-700 leading-relaxed font-bold">
                     {holidayWarning}
                 </p>
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Cuti</label>
            <textarea 
                rows={3} 
                required 
                placeholder="Contoh: Acara keluarga, Sakit, dll..."
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                value={formData.reason} 
                onChange={e => setFormData({...formData, reason: e.target.value})} 
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button 
                type="submit" 
                disabled={loading || totalDays <= 0 || totalDays > currentBalance || !!ownOverlapWarning || !!dateWarning} 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center shadow-lg hover:shadow-blue-200 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? 'Mengirim...' : <><Save size={20} className="mr-2" /> Kirim Pengajuan</>}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};