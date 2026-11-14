import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-purple-500/30 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white mb-3 shadow-lg shadow-purple-500/30">
            <Headphones size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={40} className="text-neon-green mx-auto" />
            <p className="text-sm font-semibold text-white">Instructions Dispatched</p>
            <p className="text-xs text-slate-400">
              If an account with <span className="text-white font-medium">{email}</span> exists, password reset details have been sent.
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 text-xs font-semibold text-neon-purple hover:underline"
            >
              Return to Login
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all mt-6"
            >
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
              <ArrowRight size={15} />
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-400 hover:text-white">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
