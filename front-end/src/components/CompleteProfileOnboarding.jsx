import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { Heart, User, Calendar, Phone, MapPin, Users, Loader2, AlertCircle, Sparkles, LogOut } from 'lucide-react';

const CompleteProfileOnboarding = () => {
  const { user, checkUserAuth, logout } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [familyBranchName, setFamilyBranchName] = useState('');
  const [isFreshCreator, setIsFreshCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Parse user's existing details (e.g. from Google profile)
  useEffect(() => {
    if (user) {
      if (user.name) {
        const parts = user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      } else {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
      }
      
      // Default family branch name if it's the generic default
      if (user.branch && !user.branch.toLowerCase().includes('first name') && !user.branch.toLowerCase().includes('user family')) {
        setFamilyBranchName(user.branch);
      } else if (user.lastName) {
        setFamilyBranchName(`${user.lastName} Family`);
      }
      
      if (user.location) setLocation(user.location);
      if (user.phone) setPhone(user.phone);

      // Check if they are the sole member of their family circle (meaning fresh creator)
      api.getCircle()
        .then(circle => {
          if (circle.length <= 1) {
            setIsFreshCreator(true);
          }
        })
        .catch(err => {
          console.warn("Failed to retrieve family circle status:", err);
          // Default to true just to allow customizing tree name if unsure
          setIsFreshCreator(true);
        });
    }
  }, [user]);

  // Dynamically default the family branch name using Last Name if it is a fresh creator
  useEffect(() => {
    if (isFreshCreator && lastName && !familyBranchName) {
      setFamilyBranchName(`${lastName} Family`);
    }
  }, [lastName, isFreshCreator, familyBranchName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !birthDate || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    if (new Date(birthDate) > new Date()) {
      setError('Birth date cannot be in the future.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update Profile info
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        phone: phone.trim(),
        location: location.trim() || null,
      };

      if (isFreshCreator && familyBranchName.trim()) {
        updateData.family_branch_name = familyBranchName.trim();
      }

      await api.updateProfile(user.id, updateData);
      
      // 2. Re-authenticate to update user profile globally in AuthContext
      await checkUserAuth();
    } catch (err) {
      console.error('Failed to complete profile:', err);
      setError(err.message || 'Failed to complete profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-cyan-50/30 p-4">
      {/* Branding Header */}
      <div className="flex flex-col items-center mb-6 text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 shadow-md shadow-teal-500/20 mb-4 animate-pulse">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kinship</h1>
        <p className="text-slate-500 mt-2 text-sm">
          A secure, private space designed exclusively for extended families to archive history and stay close.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full -ml-10 -mb-10 blur-xl"></div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Complete Your Vault</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            You've signed in successfully! Let's fill in the missing details to configure your node.
          </p>

          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to save</p>
                <p className="mt-0.5 text-rose-600/90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {isFreshCreator && (
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
                    onChange={(e) => setFamilyBranchName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-sm outline-none transition-all duration-200"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                  Since you're planting a fresh root, this will name your new family vault tree.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-teal-400 disabled:to-cyan-400 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] outline-none flex items-center justify-center gap-2 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Completing setup...
                </>
              ) : (
                'Enter Kinship Vault'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out & Choose Another Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfileOnboarding;
