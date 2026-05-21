import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { HERITAGE_TYPE_CONFIG } from "@/lib/mockData";

export default function TimelineEvent({ event, isLast }) {
  const typeConfig = HERITAGE_TYPE_CONFIG[event.type] || HERITAGE_TYPE_CONFIG.story;

  return (
    <div className="relative flex gap-6">
      {/* Timeline Track */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-card border-2 border-primary/30 flex items-center justify-center shadow-sm z-10">
          <span className="text-xs font-bold text-primary">{event.year}</span>
        </div>
        {!isLast && <div className="flex-1 w-px bg-border mt-2" />}
      </div>

      {/* Content Card */}
      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6 hover:shadow-md transition-shadow">
        {event.image && (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="font-heading text-lg font-semibold text-foreground">{event.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-xs ${typeConfig.color}`}>
                {typeConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">{event.branch}</Badge>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/80">{event.content}</p>

          <div className="flex items-center gap-1.5 pt-1">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Contributors: {event.contributors.join(", ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}