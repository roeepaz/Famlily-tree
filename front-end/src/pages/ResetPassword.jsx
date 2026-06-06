import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabaseClient } from '@/lib/AuthContext';
import { Heart, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const criteria = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase fires PASSWORD_RECOVERY when the user lands via the reset magic link
  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check existing session (user may have already been redirected)
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const allMet = criteria.every((c) => c.test(password));
  const passwordsMatch = password === confirm && confirm.length > 0;
  const strength = criteria.filter((c) => c.test(password)).length;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-teal-400', 'bg-teal-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allMet) { setError('Password does not meet all requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }
    if (!sessionReady) { setError('Your reset link is invalid or has expired. Please request a new one.'); return; }

    setLoading(true);
    setError(null);

    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      console.error('Update password error:', err);
      setError(err.message || 'Failed to update password. Your link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-cyan-50/30 p-4">
      {/* Branding */}
      <div className="flex flex-col items-center mb-8 text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 shadow-md shadow-teal-500/20 mb-4 animate-pulse">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kinship</h1>
        <p className="text-slate-500 mt-2 text-sm">
          A secure, private space designed exclusively for extended families.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-8">

        {done ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-8 h-8 text-teal-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Password updated!</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
              Your password has been changed successfully.
            </p>
            <p className="text-xs text-slate-400">Redirecting you to the app...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">Set a new password</h2>
                <p className="text-slate-500 text-xs mt-0.5">Choose a strong password for your family vault.</p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 mb-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Couldn't update password</p>
                  <p className="mt-0.5 text-rose-600/90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Strength meter */}
                {password.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength ? strengthColor : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 w-12 text-right">{strengthLabel}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {criteria.map((c) => {
                        const met = c.test(password);
                        return (
                          <div key={c.label} className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-teal-600' : 'text-slate-400'}`}>
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${met ? 'bg-teal-500' : 'bg-slate-200'}`}>
                              {met && <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                            {c.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="reset-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200 ${
                      confirm.length > 0
                        ? passwordsMatch
                          ? 'border-teal-400 focus:border-teal-500 bg-teal-50/20'
                          : 'border-rose-300 focus:border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirm.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-rose-500 mt-1.5 ml-1">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                id="reset-submit"
                disabled={loading || !allMet || !passwordsMatch}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-teal-300 disabled:to-cyan-300 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] outline-none flex items-center justify-center gap-2 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-slate-400 hover:text-teal-600 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
