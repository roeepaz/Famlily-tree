import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { Heart, User, Mail, Lock, Loader2, AlertCircle, Sparkles, Phone, MapPin, Calendar, Users, Camera, X, Check } from 'lucide-react';
import { compressImage } from '@/lib/imageCompressor';

const PASSWORD_RULES = [
  { id: 'length', label: '8+ characters', test: (pw) => pw.length >= 8 },
  { id: 'uppercase', label: '1 uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: '1 lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: '1 number', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: '1 special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

const Register = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const inviteId = searchParams.get('inviteId');
      await signInWithGoogle(inviteId);
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError(err.message || 'Failed to sign up with Google. Please try again.');
      setLoading(false);
    }
  };
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [familyBranchName, setFamilyBranchName] = useState('');
  const [isBranchManuallyEdited, setIsBranchManuallyEdited] = useState(false);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const [invitePreview, setInvitePreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Automatically pre-fill email, phone, or inviteId if invited via link (?inviteId=...&email=... or ?inviteId=...&phone=...)
  useEffect(() => {
    const inviteId = searchParams.get('inviteId');
    const inviteEmail = searchParams.get('email');
    const invitePhone = searchParams.get('phone');
    if (inviteId || inviteEmail || invitePhone) {
      if (inviteEmail) setEmail(inviteEmail);
      if (invitePhone) setPhone(invitePhone);
      setIsLoadingPreview(true);
      
      const queryParam = {};
      if (inviteId) queryParam.inviteId = inviteId;
      if (inviteEmail) queryParam.email = inviteEmail;
      if (invitePhone) queryParam.phone = invitePhone;
      
      api.getInvitePreview(queryParam)
        .then(data => {
          setInvitePreview(data);
          if (data.inviteeName) {
            setFirstName(data.inviteeName);
          }
          if (data.treeName) {
            setFamilyBranchName(data.treeName);
            setIsBranchManuallyEdited(true);
          }
        })
        .catch(err => {
          console.warn("Failed to fetch invite preview:", err);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [searchParams]);

  // Dynamically default the family branch name using Last Name
  useEffect(() => {
    if (!isBranchManuallyEdited) {
      setFamilyBranchName(lastName ? `${lastName} Family` : '');
    }
  }, [lastName, isBranchManuallyEdited]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Please select a photo under 10MB.');
        return;
      }
      setError(null);
      try {
        const compressed = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.6 });
        setAvatarPreview(compressed);
        setAvatarUrl(compressed);
      } catch (err) {
        setError('Failed to compress avatar photo.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword || !familyBranchName || !birthDate || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    // Confirm password matching
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Strong password validation
    if (!isPasswordValid) {
      setError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }

    // Birth Date validation (prevent future date)
    if (new Date(birthDate) > new Date()) {
      setError('Birth date cannot be in the future.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, firstName, lastName, {
        familyBranchName,
        phone: phone || null,
        location: location || null,
        birthDate: birthDate || null,
        avatarUrl: avatarUrl || null,
        inviteId: searchParams.get('inviteId') || null,
      });
      setSuccess(true);
      // Clean up inputs
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFamilyBranchName('');
      setPhone('');
      setLocation('');
      setBirthDate('');
      setAvatarUrl('');
      setAvatarPreview(null);
      setIsBranchManuallyEdited(false);
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err.message || 'Failed to create account. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-cyan-50/30 p-4">
      {/* Branding/header */}
      <div className="flex flex-col items-center mb-8 text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 shadow-md shadow-teal-500/20 mb-4">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kinship</h1>
        <p className="text-slate-500 mt-2 text-sm">
          A secure, private space designed exclusively for extended families to archive history and stay close.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-8">
        {success ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full mb-6 border border-emerald-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              We sent a verification link to your email address. Please click it to verify your account and activate your family tree node.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-2xl transition-colors shadow-md shadow-teal-500/10 hover:shadow-teal-500/20"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            {invitePreview ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Claim Your Node</h2>
                <p className="text-slate-500 text-sm mb-6">Claim your profile in the {invitePreview.treeName}</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Family Vault</h2>
                <p className="text-slate-500 text-sm mb-6">Set up your secure profile to map family relationships</p>
              </>
            )}
 
            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to register</p>
                  <p className="mt-0.5 text-rose-600/90">{error}</p>
                </div>
              </div>
            )}

            {isLoadingPreview && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2 mb-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
                <p className="text-xs">Loading invitation details...</p>
              </div>
            )}

            {!isLoadingPreview && invitePreview && (
              <div className="mb-6 p-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">
                  <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
                  You've Been Invited!
                </div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  Hi {invitePreview.inviteeName},
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Your family member <strong>{invitePreview.creatorName}</strong> has started your private family circle: <span className="font-semibold text-teal-600">{invitePreview.treeName}</span>. Look who is already here:
                </p>

                {/* Tree preview snippet */}
                <div className="mt-3.5 flex flex-wrap gap-2.5 justify-center p-3 bg-slate-50/80 border border-slate-100 rounded-xl max-h-[160px] overflow-y-auto">
                  {invitePreview.profiles.map(p => (
                    <div 
                      key={p.id} 
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium leading-tight shadow-sm ${
                        p.relation === 'You' 
                          ? 'bg-teal-50 border-teal-200 text-teal-800' 
                          : 'bg-white border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        p.relation === 'You' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.name[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-bold truncate max-w-[90px]">{p.name}</p>
                        <p className="text-[9px] text-slate-400 font-normal">{p.relation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Register Via
              </span>
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 disabled:bg-slate-50 disabled:border-slate-200 text-slate-700 font-semibold rounded-2xl shadow-sm hover:shadow active:scale-[0.98] outline-none flex items-center justify-center gap-3 transition-all duration-200"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/90 px-3 text-slate-400 font-semibold">Or use email instead</span>
              </div>
            </div>
 
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Photo Selector */}
              <div className="flex flex-col items-center justify-center pb-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 group-hover:border-teal-400 overflow-hidden flex items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all duration-200 relative shadow-inner">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 flex flex-col items-center justify-center">
                        <Camera className="w-7 h-7 text-slate-400 group-hover:text-teal-500 transition-colors" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-teal-500 transition-colors mt-1">Photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview(null);
                        setAvatarUrl('');
                      }}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition-colors shadow-md border border-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Upload a profile photo (Optional)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                      required
                    />
                  </div>
                </div>
  
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Birth Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={birthDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {!invitePreview && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Family Branch Name
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Doe Family"
                      value={familyBranchName}
                      onChange={(e) => {
                        setIsBranchManuallyEdited(true);
                        setFamilyBranchName(e.target.value);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Location <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="New York, USA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="jane.doe@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!invitePreview && !searchParams.get('inviteId')}
                    className={`w-full pl-12 pr-4 py-3 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200 ${
                      (invitePreview && !searchParams.get('inviteId'))
                        ? 'bg-slate-100/80 text-slate-500 cursor-not-allowed opacity-85 hover:border-slate-200' 
                        : 'bg-slate-50/50 hover:bg-slate-50'
                    }`}
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
                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                </div>
                
                {/* Password Requirements Popover / Checklist */}
                {(isPasswordFocused || (password.length > 0 && !isPasswordValid)) && (
                  <div className="mt-2.5 p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl transition-all duration-300 ease-in-out shadow-inner">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Password Requirements</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PASSWORD_RULES.map((rule) => {
                        const isMet = rule.test(password);
                        return (
                          <div key={rule.id} className="flex items-center gap-2">
                            <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-200 ${
                              isMet 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : password.length > 0 
                                  ? 'bg-rose-100 text-rose-600' 
                                  : 'bg-slate-100 text-slate-400'
                            }`}>
                              {isMet ? (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              ) : password.length > 0 ? (
                                <X className="w-2.5 h-2.5 stroke-[3]" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              )}
                            </div>
                            <span className={`text-[11px] transition-colors duration-200 ${
                              isMet 
                                ? 'text-emerald-700 font-medium' 
                                : password.length > 0 
                                  ? 'text-rose-600' 
                                  : 'text-slate-500'
                            }`}>
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Passwords do not match
                  </p>
                )}
                {password && confirmPassword && password === confirmPassword && (
                  <p className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
              </div>
 
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-teal-400 disabled:to-cyan-400 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] outline-none flex items-center justify-center gap-2 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {invitePreview ? 'Claiming profile...' : 'Creating your vault...'}
                  </>
                ) : (
                  invitePreview ? 'Claim My Profile' : 'Start My Family Tree'
                )}
              </button>
            </form>
 
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already registered?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
