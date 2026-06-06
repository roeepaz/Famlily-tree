import React from "react";
import { CompactRowSkeleton } from "../SkeletonLoaders";

export default function UpcomingBirthdaysWidget({ isLoading, upcomingBirthdays, onSelectMember }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="font-heading text-base font-semibold text-foreground mb-3">Upcoming Birthdays</h3>
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <CompactRowSkeleton key={i} />)
        ) : upcomingBirthdays.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No upcoming birthdays.</p>
        ) : (
          upcomingBirthdays.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectMember && onSelectMember(b)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all text-left group"
            >
              {b.avatar ? (
                <img
                  src={b.avatar}
                  alt={b.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs ring-2 ring-primary/5 group-hover:scale-105 transition-transform">
                  {b.name?.[0] || "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {b.name}
                  {b.relation === "You" && (
                    <span className="text-[9px] bg-primary/20 text-primary px-1 rounded font-normal">You</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {b.ageTurning ? `Turning ${b.ageTurning}` : "Birthday"} on{" "}
                  {new Date(b.nextBirthdayDate + "T00:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                  {b.daysUntil === 0 ? "Today! 🎂" : b.daysUntil === 1 ? "Tomorrow!" : `in ${b.daysUntil}d`}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
