import React from "react";
import { Check, X } from "lucide-react";

export default function PasswordChecker({ password, isPasswordFocused, isPasswordValid, passwordRules }) {
  if (!isPasswordFocused && (password.length === 0 || isPasswordValid)) {
    return null;
  }

  return (
    <div className="mt-2.5 p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl transition-all duration-300 ease-in-out shadow-inner">
      <p className="text-[11px] font-semibold text-slate-500 mb-2">Password Requirements</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {passwordRules.map((rule) => {
          const isMet = rule.test(password);
          return (
            <div key={rule.id} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-200 ${
                  isMet
                    ? "bg-emerald-100 text-emerald-600"
                    : password.length > 0
                    ? "bg-rose-100 text-rose-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isMet ? (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : password.length > 0 ? (
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                )}
              </div>
              <span
                className={`text-[11px] transition-colors duration-200 ${
                  isMet
                    ? "text-emerald-700 font-medium"
                    : password.length > 0
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}
              >
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
