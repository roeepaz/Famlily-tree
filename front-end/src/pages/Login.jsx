import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Heart, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      // Auth listener in AuthContext will automatically detect SIGNED_IN and update state
      navigate('/');
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-slate-50 to-orange-50/30 p-4">
      {/* Visual branding/header */}
      <div className="flex flex-col items-center mb-8 text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md shadow-orange-500/20 mb-4 animate-pulse">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kinship</h1>
        <p className="text-slate-500 mt-2 text-sm">
          A secure, private space designed exclusively for extended families to archive history and stay close.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back</h2>
        <p className="text-slate-500 text-sm mb-6">Enter your credentials to enter your family vault</p>

        {error && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to sign in</p>
              <p className="mt-0.5 text-rose-600/90">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-400 disabled:to-orange-400 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] outline-none flex items-center justify-center gap-2 transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing you in...
              </>
            ) : (
              'Enter Family Vault'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            New to Kinship?{' '}
            <Link
              to="/register"
              className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              Start a new tree
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
