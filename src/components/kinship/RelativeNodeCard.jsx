import React from "react";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RelativeNodeCard({ member, isCenter, onClick }) {
  return (
    <button
      onClick={() => onClick(member)}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center w-full max-w-[160px] ${
        isCenter
          ? "bg-primary/10 border-primary/30 shadow-md ring-2 ring-primary/20"
          : member.isDeceased
            ? "bg-card border-border opacity-70 hover:opacity-100 hover:shadow-md"
            : "bg-card border-border hover:border-primary/20 hover:shadow-md"
      }`}
    >
      <div className="relative">
        <Avatar className={`w-14 h-14 ${isCenter ? "ring-2 ring-primary" : "ring-1 ring-border"}`}>
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className="font-heading text-lg">{member.name[0]}</AvatarFallback>
        </Avatar>
        {member.isDeceased && (
          <span className="absolute -top-1 -right-1 text-xs">🕊️</span>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground leading-tight">{member.name}</p>
        <p className="text-[10px] text-muted-foreground">{member.relation || "You"}</p>
        {member.location && (
          <p className="text-[10px] text-muted-foreground/70 flex items-center justify-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />
            {member.location}
          </p>
        )}
      </div>
    </button>
  );
}