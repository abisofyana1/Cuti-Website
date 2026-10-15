import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_USERS, MOCK_LEAVES } from '../services/mockData';
import { Calendar, Save, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeaveForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service: user?.service || '',
    startDate: '',
    endDate: '',
    reason: '',
    approverTL: user?.tlEmail || '',
    approverSPV: user?.spvEmail || '',
    approverMGR: user?.mgrEmail || '',
  });

  const getDaysDiff = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const totalDays = getDaysDiff(formData.startDate, formData.endDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (totalDays > user.balance) {
      alert("Sisa cuti tidak mencukupi!");
      return;
    }

    setLoading(true);

    // Simulate API submission
    setTimeout(() => {
      // In a real app, we would POST to API here.
      // For this demo, we just alert success.
      alert(`Pengajuan Berhasil! ID: CT-${Date.now()}`);
      setLoading(false);
      navigate('/history');
    }, 1500);
  };

  const tlUsers = MOCK_USERS.filter(u => u.role === 'TL');
  const spvUsers = MOCK_USERS.filter(u => u.role === 'SPV');
  const mgrUsers = MOCK_USERS.filter(u => u.role === 'MGR');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Calendar className="mr-2 text-blue-600" /> Form Pengajuan Cuti
          </h2>
          <span className="text-sm font-bold text-gray-500">
            Sisa Cuti: <span className="text-blue-600 text-lg">{user?.balance}</span> Hari
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layanan (Divisi)</label>
              <select
                value={formData.service}
                onChange={e => setFormData({ ...formData, service: e.target.value })}
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              >
                <option value="">Pilih Layanan</option>
                <option value="CX DIGITAL">CX DIGITAL</option>
                <option value="CX EXCELLENCE">CX EXCELLENCE</option>
                <option value="CX MANAJEMEN">CX MANAJEMEN</option>
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <AlertTriangle className="text-blue-500 mr-2 mt-0.5" size={16} />
                <p className="text-xs text-blue-700">
                  Pastikan Anda memilih atasan yang benar sesuai struktur organisasi terbaru.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Approval</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Team Leader (TL)</label>
                <select
                  className="w-full text-sm rounded border-gray-300 p-2"
                  value={formData.approverTL}
                  onChange={e => setFormData({ ...formData, approverTL: e.target.value })}
                >
                  <option value="">-- Pilih TL --</option>
                  {tlUsers.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Supervisor (SPV)</label>
                <select
                  className="w-full text-sm rounded border-gray-300 p-2"
                  value={formData.approverSPV}
                  onChange={e => setFormData({ ...formData, approverSPV: e.target.value })}
                >
                  <option value="">-- Pilih SPV --</option>
                  {spvUsers.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Manager (MGR)</label>
                <select
                  className="w-full text-sm rounded border-gray-300 p-2"
                  value={formData.approverMGR}
                  onChange={e => setFormData({ ...formData, approverMGR: e.target.value })}
                >
                  <option value="">-- Pilih MGR --</option>
                  {mgrUsers.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
              <input
                type="date"
                required
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-blue-500"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
              <input
                type="date"
                required
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-blue-500"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Hari</label>
              <div className={`w-full p-3 rounded-lg border font-bold text-center ${totalDays > (user?.balance || 0) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {totalDays} Hari
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Cuti</label>
            <textarea
              rows={4}
              required
              className="w-full rounded-lg border-gray-300 border p-3 focus:ring-blue-500"
              placeholder="Jelaskan keperluan cuti anda..."
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={loading || totalDays <= 0 || totalDays > (user?.balance || 0)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <span className="animate-spin mr-2">⏳</span> : <Save size={20} className="mr-2" />}
              Kirim Pengajuan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};