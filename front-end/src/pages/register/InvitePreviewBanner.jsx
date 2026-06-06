import React from "react";
import { Sparkles } from "lucide-react";

export default function InvitePreviewBanner({ invitePreview }) {
  if (!invitePreview) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl text-left">
      <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">
        <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
        You've Been Invited!
      </div>
      <h3 className="text-sm font-bold text-slate-800 leading-tight">Hi {invitePreview.inviteeName},</h3>
      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
        Your family member <strong>{invitePreview.creatorName}</strong> has started your private family circle:{" "}
        <span className="font-semibold text-teal-600">{invitePreview.treeName}</span>. Look who is already here:
      </p>

      {/* Tree preview snippet */}
      <div className="mt-3.5 flex flex-wrap gap-2.5 justify-center p-3 bg-slate-50/80 border border-slate-100 rounded-xl max-h-[160px] overflow-y-auto">
        {invitePreview.profiles.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium leading-tight shadow-sm ${
              p.relation === "You"
                ? "bg-teal-50 border-teal-200 text-teal-800"
                : "bg-white border-slate-100 text-slate-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                p.relation === "You" ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"
              }`}
            >
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
  );
}
