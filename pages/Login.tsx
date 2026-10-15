import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, CheckSquare } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, pass);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all">
        <div className="text-center mb-8">
           <div className="inline-flex p-4 rounded-xl bg-blue-50 text-blue-600 mb-4 shadow-inner">
             <CheckSquare size={40} />
           </div>
           <h1 className="text-2xl font-bold text-gray-800">E-Cuti</h1>
           <p className="text-gray-500 mt-2">Silakan login dengan akun Anda</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium border border-red-100">
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
                onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPass(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'MASUK'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Demo Credentials:</p>
          <p>staff@ecuti.com / 123 (User)</p>
          <p>tl@ecuti.com / 123 (Manager)</p>
        </div>
      </div>
    </div>
  );
};