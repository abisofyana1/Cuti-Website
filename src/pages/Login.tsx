import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import bgImage from '../assets/E-Cuti-BG.png';

export const Login: React.FC = () => {
  const { login, isSessionExpired, resetSessionStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset status expired saat komponen dimount, tapi kita biarkan alert muncul dulu
  // Kita reset status expired ketika user mulai mengetik atau submit
  useEffect(() => {
      // Optional: Clear fields
      setEmail('');
      setPass('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    resetSessionStatus(); // Hilangkan alert expired saat mencoba login kembali
    
    try {
      await login(email, pass);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
      setter(value);
      if (error) setError('');
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark overlay with slight blur so form card stands out cleanly */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all relative overflow-hidden z-10 border border-white/20">
        
        {/* Session Expired Notification Overlay */}
        {isSessionExpired && (
            <div className="absolute top-0 left-0 w-full bg-amber-50 border-b border-amber-200 p-4 flex items-start animate-in slide-in-from-top-10 z-10">
                <div className="bg-amber-100 p-2 rounded-full mr-3 text-amber-600">
                    <Clock size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-800">Sesi Telah Berakhir</h4>
                    <p className="text-xs text-amber-700 mt-1">Anda telah tidak aktif selama lebih dari 30 menit. Demi keamanan, silakan login kembali.</p>
                </div>
                <button onClick={resetSessionStatus} className="ml-auto text-amber-500 hover:text-amber-700 text-xs font-bold px-2 py-1">Tutup</button>
            </div>
        )}

        <div className="text-center mb-8 mt-4">
           <div className="inline-flex p-4 rounded-xl bg-blue-50 text-blue-600 mb-4 shadow-inner">
             <CheckSquare size={40} />
           </div>
           <h1 className="text-2xl font-bold text-gray-800">E-Cuti</h1>
           <p className="text-gray-500 mt-2">Silakan login dengan akun Anda</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium border border-red-100 flex items-center justify-center">
            <AlertTriangle size={16} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email / HQ</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="email@domain.com atau HQ"
                value={email}
                onChange={e => handleInputChange(setEmail, e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
                value={pass}
                onChange={e => handleInputChange(setPass, e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg transform active:scale-95 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
                <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Memproses...
                </>
            ) : 'MASUK'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 mb-2">Akun Uji Coba Demo (Password: 123):</p>
          <div className="bg-gray-50 p-2.5 rounded-lg text-xs text-gray-600 grid grid-cols-2 gap-1 text-left">
            <p>• <strong>User:</strong> <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">user@ecuti.com</code></p>
            <p>• <strong>TL:</strong> <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">tl@ecuti.com</code></p>
            <p>• <strong>SPV:</strong> <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">spv@ecuti.com</code></p>
            <p>• <strong>MGR:</strong> <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">mgr@ecuti.com</code></p>
            <p className="col-span-2 text-center mt-1 pt-1 border-t border-gray-200">• <strong>Admin:</strong> <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">admin@ecuti.com</code> (Pass: <code className="text-blue-600">admin</code>)</p>
          </div>
        </div>
      </div>
    </div>
  );
};