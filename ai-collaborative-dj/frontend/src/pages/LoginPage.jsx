import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Headphones, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('dj@auradj.com');
    setPassword('demodj123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white mb-3 shadow-lg shadow-purple-500/30">
            <Headphones size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to your collaborative DJ account</p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-dark-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-neon-purple hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all mt-6"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={fillDemoAccount}
            className="text-[11px] text-neon-cyan hover:underline font-medium"
          >
            Click here to fill Demo DJ Credentials
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-neon-pink font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
