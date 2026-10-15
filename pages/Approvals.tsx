import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_LEAVES } from '../services/mockData';
import { CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { LeaveRequest } from '../types';

export const Approvals: React.FC = () => {
  const { user } = useAuth();
  
  // Logic to determine if it is "My Turn" to approve
  const myPendingTasks = MOCK_LEAVES.filter(l => {
    if (l.status !== 'PENDING') return false;
    
    if (l.currentPosition === 'TL' && l.approverTL === user?.email) return true;
    if (l.currentPosition === 'SPV' && l.approverSPV === user?.email) return true;
    if (l.currentPosition === 'MGR' && l.approverMGR === user?.email) return true;
    
    return false;
  });

  const [tasks, setTasks] = useState(myPendingTasks);

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    // In real app, API call here
    alert(`${action === 'APPROVE' ? 'Disetujui' : 'Ditolak'} successfully.`);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Semua Beres!</h3>
        <p className="text-gray-500">Tidak ada pengajuan yang perlu persetujuan Anda saat ini.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <CheckCircle className="mr-3 text-blue-600" />
        Menunggu Persetujuan ({tasks.length})
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
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    {task.totalDays} Hari
                  </span>
               </div>

               <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                     <Calendar size={14} className="mr-2" />
                     {task.startDate} s/d {task.endDate}
                  </div>
                  <p className="text-sm italic text-gray-700 mt-2">"{task.reason}"</p>
               </div>

               <div className="flex space-x-3">
                  <button 
                    onClick={() => handleAction(task.id, 'REJECT')}
                    className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 font-semibold transition"
                  >
                    Tolak
                  </button>
                  <button 
                    onClick={() => handleAction(task.id, 'APPROVE')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold transition shadow"
                  >
                    Setujui
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};