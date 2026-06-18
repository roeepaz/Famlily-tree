import React, { useState } from "react";
import { createPortal } from "react-dom";
import { CompactRowSkeleton } from "../SkeletonLoaders";
import FamilyGatheringsModal from "./FamilyGatheringsModal";
import { CalendarDays, ChevronLeft, MapPin, Compass } from "lucide-react";

export default function UpcomingGatheringsWidget({ 
  isLoading, 
  nextEvents = [], 
  events = [], 
  onTabChange,
  layout = "sidebar" // 'sidebar' | 'minibar'
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [navLocation, setNavLocation] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysCountdownText = (eventDateStr) => {
    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);
    const timeDiff = eventDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return "היום! 🎈";
    if (daysDiff === 1) return "מחר!";
    if (daysDiff === 2) return "בעוד יומיים";
    return `בעוד ${daysDiff} ימים`;
  };

  const getMonthStrHebrew = (dateStr) => {
    const date = new Date(dateStr);
    const months = [
      "ינו", "פבר", "מרץ", "אפר", "מאי", "יונ",
      "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"
    ];
    return months[date.getMonth()];
  };

  const getDayStr = (dateStr) => {
    return new Date(dateStr).getDate();
  };

  const renderPreviewRow = (evt) => {
    const hasLocation = evt.location && evt.location !== "TBD";
    const countdown = getDaysCountdownText(evt.eventDate);

    return (
      <div
        key={evt.id}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-border/20 transition-all text-right group"
      >
        {/* Event Meta/Action */}
        <div className="flex items-center gap-2 shrink-0 order-first">
          {hasLocation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNavLocation(evt);
              }}
              className="p-1.5 px-2 text-[10px] font-bold rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 transition-colors flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>נווט</span>
            </button>
          )}

          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
            countdown.includes("היום") || countdown.includes("מחר")
              ? "bg-rose-500/20 text-rose-500 animate-pulse font-bold" 
              : "bg-primary/10 text-primary border border-primary/10"
          }`}>
            {countdown}
          </span>
        </div>

        {/* Date Block & Details */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
        >
          {/* Date Block */}
          <div className="w-9 h-10 bg-card rounded-lg border border-border overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-colors">
            <div className="w-full bg-primary text-[8px] font-bold text-primary-foreground py-0.5 text-center leading-none uppercase">
              {getMonthStrHebrew(evt.eventDate)}
            </div>
            <div className="text-xs font-extrabold text-foreground leading-none py-1">
              {getDayStr(evt.eventDate)}
            </div>
          </div>
          
          <div className="min-w-0 flex-1 text-right">
            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {evt.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium flex items-center justify-end gap-1">
              <span className="truncate">{evt.location || "טרם נקבע מיקום"}</span>
              <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            </p>
          </div>
        </div>
      </div>
    );
  };

  // LAYOUT 1: MINIBAR (Premium horizontal top alert for mobile)
  if (layout === "minibar") {
    if (isLoading) {
      return (
        <div className="w-full h-14 bg-secondary/40 rounded-2xl border border-border/40 animate-pulse" />
      );
    }

    if (nextEvents.length === 0) {
      return null;
    }

    const nextEv = nextEvents[0];
    const countdown = getDaysCountdownText(nextEv.eventDate);
    const eventDate = new Date(nextEv.eventDate);
    const dateFormatted = `${eventDate.getDate()}/${eventDate.getMonth() + 1}`;

    return (
      <>
        <div 
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-card border border-emerald-500/25 hover:border-emerald-500/40 rounded-2xl shadow-sm hover:shadow-md hover:bg-emerald-500/15 transition-all text-right group cursor-pointer"
          dir="rtl"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-inner transition-transform group-hover:scale-105 ${
              countdown.includes("היום") || countdown.includes("מחר")
                ? "bg-rose-500/20 text-rose-500 animate-bounce" 
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}>
              🎈
            </div>
            
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">המפגש הבא:</span>
                <span className="truncate group-hover:text-emerald-600 transition-colors">{nextEv.title}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {nextEv.location ? `${nextEv.location} • ` : ""}
                <span>{dateFormatted}</span>
                {" • "}
                <span className="font-bold text-foreground/80">
                  {countdown}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <span>כל המפגשים</span>
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        <FamilyGatheringsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          events={events.length > 0 ? events : nextEvents}
          isLoading={isLoading}
          onTabChange={onTabChange}
        />
      </>
    );
  }

  // LAYOUT 2: SIDEBAR CARD (Desktop sidebar view)
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span>מפגשים משפחתיים</span>
        </h3>
      </div>

      {/* Compact Preview List */}
      <div className="space-y-2.5">
        {isLoading ? (
          [1, 2].map((i) => <CompactRowSkeleton key={i} />)
        ) : nextEvents.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-4 bg-secondary/10 rounded-xl">אין מפגשים מתוכננים בקרוב.</p>
        ) : (
          nextEvents.map((evt) => renderPreviewRow(evt))
        )}
      </div>

      {/* Open Full Events Button */}
      {nextEvents.length > 0 && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 bg-secondary/40 hover:bg-secondary/80 border border-border/60 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 text-foreground"
        >
          <span>לכל המפגשים והאירועים</span>
          <span>📅</span>
        </button>
      )}

      {/* Main Gatherings Modal */}
      <FamilyGatheringsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        events={events.length > 0 ? events : nextEvents}
        isLoading={isLoading}
        onTabChange={onTabChange}
      />

      {/* Navigation Engine Chooser Modal - rendered via Portal so it's above everything */}
      {navLocation && createPortal(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl max-w-xs w-full space-y-4 animate-in fade-in zoom-in duration-200 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h4 className="font-heading text-sm font-bold text-foreground">בחר אפליקציית ניווט</h4>
              <button onClick={() => setNavLocation(null)} className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-secondary">✕</button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ניווט אל מיקום המפגש "{navLocation.title}": <span className="font-medium text-foreground block mt-1">{navLocation.location}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  window.open(`https://waze.com/ul?q=${encodeURIComponent(navLocation.location)}&navigate=yes`, '_blank');
                  setNavLocation(null);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border bg-secondary/40 hover:bg-secondary transition-all gap-2 hover:border-primary/40 group active:scale-95"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🚙</span>
                <span className="text-xs font-bold">Waze</span>
              </button>
              <button
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navLocation.location)}`, '_blank');
                  setNavLocation(null);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border bg-secondary/40 hover:bg-secondary transition-all gap-2 hover:border-primary/40 group active:scale-95"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🗺️</span>
                <span className="text-xs font-bold">Google Maps</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

