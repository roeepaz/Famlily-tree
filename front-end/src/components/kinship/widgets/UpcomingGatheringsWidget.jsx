import React from "react";
import { CompactRowSkeleton } from "../SkeletonLoaders";

export default function UpcomingGatheringsWidget({ isLoading, nextEvents, onTabChange }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="font-heading text-base font-semibold text-foreground mb-3">Upcoming Gatherings</h3>
      <div className="space-y-3">
        {isLoading ? (
          [1, 2].map((i) => <CompactRowSkeleton key={i} />)
        ) : nextEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No upcoming family events.</p>
        ) : (
          nextEvents.map((evt) => {
            const date = new Date(evt.eventDate);
            const monthStr = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
            const dayStr = date.getDate();
            return (
              <button
                key={evt.id}
                onClick={() => onTabChange && onTabChange("events")}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all text-left group"
              >
                {/* Date Block */}
                <div className="w-9 h-10 bg-background rounded-lg border border-border overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-inner">
                  <div className="w-full bg-primary text-[8px] font-bold text-primary-foreground py-0.5 text-center leading-none">
                    {monthStr}
                  </div>
                  <div className="text-sm font-bold text-foreground leading-none py-1">
                    {dayStr}
                  </div>
                </div>
                {/* Event Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {evt.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {evt.location || "TBD"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
