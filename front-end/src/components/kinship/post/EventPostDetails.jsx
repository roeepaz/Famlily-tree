import React from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddToCalendar from "../AddToCalendar";

export default function EventPostDetails({ post, eventDetails, onTabChange }) {
  return (
    <div className="space-y-3">
      <div className="bg-secondary/40 rounded-xl p-4 border border-border/50 space-y-3 shadow-inner">
        <div className="flex items-start gap-2.5">
          <span className="text-2xl shrink-0">📢</span>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
              Gathering Scheduled
            </span>
            <h3 className="font-heading text-lg font-extrabold text-foreground leading-snug mt-0.5">
              {post.content.split("\n")[0].replace("📢 New Family Event Scheduled: ", "").replace(/\*\*/g, "")}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-2.5 border-t border-border/40">
          {post.content.split("\n").map((line, idx) => {
            if (line.includes("🗓️")) {
              const dateVal = line.replace("🗓️ **Date:** ", "").replace(/\*\*/g, "");
              return eventDetails ? (
                <AddToCalendar key={idx} event={eventDetails}>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-left cursor-pointer hover:bg-primary/5 hover:text-primary rounded-lg p-1 px-1.5 -mx-1 -my-1 transition-all border border-transparent hover:border-primary/10 group/date focus:outline-none"
                    title="Click to add to your calendar"
                  >
                    <span className="shrink-0 text-base group-hover/date:scale-110 transition-transform">🗓️</span>
                    <span className="font-semibold text-foreground/90 border-b border-dashed border-foreground/30 group-hover/date:border-primary/50 transition-colors">
                      {dateVal}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover/date:opacity-100 transition-opacity ml-1">
                      (Save)
                    </span>
                  </button>
                </AddToCalendar>
              ) : (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="shrink-0 text-base">🗓️</span>
                  <span className="font-semibold text-foreground/90">{dateVal}</span>
                </div>
              );
            }
            if (line.includes("📍")) {
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="shrink-0 text-base">📍</span>
                  <span className="font-semibold text-foreground/90">
                    {line.replace("📍 **Location:** ", "").replace(/\*\*/g, "")}
                  </span>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Description details */}
        {post.content.split("\n\n")[1] && (
          <div className="bg-card/70 p-3 rounded-lg border border-border/30">
            <p className="text-xs text-foreground/80 leading-relaxed italic whitespace-pre-line">
              "{post.content.split("\n\n")[1]}"
            </p>
          </div>
        )}
      </div>

      {/* Event Link Banner */}
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-foreground">Family Event Announcement</h4>
            <p className="text-[10px] text-muted-foreground">Check options, dates, and RSVP now.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {eventDetails && <AddToCalendar event={eventDetails} />}
          <Button
            onClick={() => onTabChange && onTabChange("events")}
            size="sm"
            className="text-[10px] px-3.5 h-8 bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg shadow-sm"
          >
            View Event & RSVP
          </Button>
        </div>
      </div>
    </div>
  );
}
