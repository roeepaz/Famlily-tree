import React from "react";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RelativeNodeCard({ member, isCenter, onClick, isDark }) {
  return (
    <button
      onClick={() => onClick(member)}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center w-full max-w-[160px] ${
        isCenter
          ? isDark
            ? "bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-lg ring-2 ring-teal-500/10"
            : "bg-primary/10 border-primary/30 shadow-md ring-2 ring-primary/20"
          : member.isDeceased
            ? isDark
              ? "bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/60"
              : "bg-card border-border opacity-70 hover:opacity-100 hover:shadow-md"
            : isDark
              ? "bg-slate-900/80 border-slate-800 text-slate-200 hover:border-teal-500/30 hover:bg-slate-800/80 hover:text-slate-100"
              : "bg-card border-border hover:border-primary/20 hover:shadow-md"
      }`}
    >
      <div className="relative">
        <Avatar className={`w-14 h-14 ${isCenter ? (isDark ? "ring-2 ring-teal-500" : "ring-2 ring-primary") : (isDark ? "ring-1 ring-slate-800" : "ring-1 ring-border")}`}>
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className="font-heading text-lg">{member.name[0]}</AvatarFallback>
        </Avatar>
        {member.isDeceased && (
          <span className="absolute -top-1 -right-1 text-xs">🕊️</span>
        )}
      </div>
      <div className="space-y-0.5">
        <p className={`text-xs font-semibold leading-tight ${isDark ? "text-slate-100" : "text-foreground"}`}>{member.name}</p>
        <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-muted-foreground"}`}>{member.relation || "You"}</p>
        {member.location && (
          <p className={`text-[10px] flex items-center justify-center gap-0.5 ${isDark ? "text-slate-500" : "text-muted-foreground/70"}`}>
            <MapPin className="w-2.5 h-2.5" />
            {member.location}
          </p>
        )}
      </div>
    </button>
  );
}