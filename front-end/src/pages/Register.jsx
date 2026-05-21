import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Heart, User, Mail, Lock, Loader2, AlertCircle, Sparkles, Phone, MapPin, Calendar, ChevronDown, ChevronUp, Users, Camera, X } from 'lucide-react';

const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyBranchName, setFamilyBranchName] = useState('');
  const [isBranchManuallyEdited, setIsBranchManuallyEdited] = useState(false);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Automatically pre-fill email if invited via email link (?email=...)
  useEffect(() => {
    const inviteEmail = searchParams.get('email');
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [searchParams]);

  // Dynamically default the family branch name using Last Name
  useEffect(() => {
    if (!isBranchManuallyEdited) {
      setFamilyBranchName(lastName ? `${lastName} Family` : '');
    }
  }, [lastName, isBranchManuallyEdited]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Please select a photo under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !familyBranchName) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      });
      setSuccess(true);
      // Clean up inputs
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setFamilyBranchName('');
      setPhone('');
      setLocation('');
      setBirthDate('');
      setAvatarUrl('');
      setAvatarPreview(null);
      setIsBranchManuallyEdited(false);
      setShowOptionalFields(false);
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err.message || 'Failed to create account. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-slate-50 to-orange-50/30 p-4">
      {/* Branding/header */}
      <div className="flex flex-col items-center mb-8 text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md shadow-orange-500/20 mb-4">
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
              className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl transition-colors shadow-md shadow-orange-500/10 hover:shadow-orange-500/20"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Family Vault</h2>
            <p className="text-slate-500 text-sm mb-6">Set up your secure profile to map family relationships</p>
 
            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to register</p>
                  <p className="mt-0.5 text-rose-600/90">{error}</p>
                </div>
              </div>
            )}
 
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Photo Selector */}
              <div className="flex flex-col items-center justify-center pb-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 group-hover:border-amber-400 overflow-hidden flex items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all duration-200 relative shadow-inner">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 flex flex-col items-center justify-center">
                        <Camera className="w-7 h-7 text-slate-400 group-hover:text-amber-500 transition-colors" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-500 transition-colors mt-1">Photo</span>
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
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
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
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                      required
                    />
                  </div>
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
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider focus:outline-none"
                >
                  {showOptionalFields ? (
                    <>
                      <span>Hide Additional Details</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Add More Info (Optional)</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>

                {showOptionalFields && (
                  <div className="mt-4 space-y-4 border-l-2 border-amber-100 pl-4 py-1 transition-all duration-200">
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
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="New York, USA"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                        />
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
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
 
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-400 disabled:to-orange-400 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] outline-none flex items-center justify-center gap-2 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating your vault...
                  </>
                ) : (
                  'Start My Family Tree'
                )}
              </button>
            </form>
 
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already registered?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
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
