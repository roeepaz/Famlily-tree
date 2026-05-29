import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { LogOut } from 'lucide-react';

const UserNotRegisteredError = () => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-cyan-50/30 p-4">
      <div className="max-w-md w-full p-8 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-teal-100/60 text-teal-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Access Restricted</h1>
          <p className="text-slate-600 mb-8 text-sm">
            You are authenticated, but we couldn't find a corresponding family profile for your account. Please ask your family tree administrator to invite you or create your node.
          </p>
          <div className="p-4 bg-slate-50/80 rounded-2xl text-xs text-slate-500 text-left space-y-2 mb-8">
            <p className="font-semibold text-slate-700">Possible steps to resolve this:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verify that you are using the correct email account</li>
              <li>Ask the tree creator to add you to the tree with this exact email</li>
              <li>Log out and log back in to clear cached sessions</li>
            </ul>
          </div>
          
          <button
            onClick={logout}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log Out and Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
