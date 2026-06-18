import React, { useState } from "react";
import { createPortal } from "react-dom";
import { CompactRowSkeleton } from "../SkeletonLoaders";
import FamilyCalendarModal from "./FamilyCalendarModal";
import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";

export default function UpcomingBirthdaysWidget({ 
  isLoading, 
  upcomingBirthdays = [], 
  onSelectMember, 
  calendarType = "gregorian", 
  setCalendarType,
  layout = "sidebar" // 'sidebar' | 'minibar'
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [navMember, setNavMember] = useState(null);

  // Parse and sort all events by proximity
  const allEvents = upcomingBirthdays
    .map((b) => ({
      ...b,
      isBirthday: b.eventType === "birthday" || !b.isDeceased
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Filter for next events (limit to 3 for compact sidebar view)
  const previewEvents = allEvents.slice(0, 3);

  const getDaysText = (days, isBirthday) => {
    if (days === 0) return isBirthday ? "היום! 🎂" : "היום 🕯️";
    if (days === 1) return "מחר!";
    if (days === 2) return "בעוד יומיים";
    return `בעוד ${days} ימים`;
  };

  const renderPreviewRow = (b) => {
    const hasBurial = !b.isBirthday && b.burialPlace;

    return (
      <div
        key={`${b.id}-${b.eventType}`}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-border/20 transition-all text-right group"
      >
        {/* Event Meta/Action */}
        <div className="flex items-center gap-2 shrink-0 order-first">
          {hasBurial && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNavMember(b);
              }}
              className="p-1.5 px-2 text-[10px] font-bold rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 transition-colors flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>נווט</span>
            </button>
          )}

          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
            b.daysUntil === 0 
              ? "bg-rose-500/20 text-rose-500 animate-pulse font-bold" 
              : "bg-primary/10 text-primary border border-primary/10"
          }`}>
            {getDaysText(b.daysUntil, b.isBirthday)}
          </span>
        </div>

        {/* Member Details */}
        <div 
          onClick={() => onSelectMember && onSelectMember(b)}
          className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
        >
          {b.avatar ? (
            <img
              src={b.avatar}
              alt={b.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/5 group-hover:scale-105 transition-transform">
              {b.name?.[0] || "?"}
            </div>
          )}
          
          <div className="min-w-0 flex-1 text-right">
            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors flex items-center justify-end gap-1.5">
              {b.name}
              {b.relation === "You" && (
                <span className="text-[9px] bg-primary/20 text-primary px-1 rounded font-normal">אני</span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-end gap-1 font-medium">
              <span>
                {b.isBirthday 
                  ? (b.ageTurning ? `חוגג/ת ${b.ageTurning}` : "יום הולדת") 
                  : `אזכרה (${b.yearsSince || 0} שנים)`
                }
                {" ב-"}{b.formattedDate}
              </span>
              <span>{b.isBirthday ? "🎂" : "🕯️"}</span>
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

    if (allEvents.length === 0) {
      return null;
    }

    const nextEv = allEvents[0];
    return (
      <>
        <div 
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-card border border-teal-500/25 hover:border-teal-500/40 rounded-2xl shadow-sm hover:shadow-md hover:bg-teal-500/15 transition-all text-right group cursor-pointer"
          dir="rtl"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-inner transition-transform group-hover:scale-105 ${
              nextEv.daysUntil === 0 
                ? "bg-rose-500/20 text-rose-500 animate-bounce" 
                : "bg-primary/10 text-primary"
            }`}>
              {nextEv.isBirthday ? "🎂" : "🕯️"}
            </div>
            
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="text-teal-600 dark:text-teal-400 font-medium">האירוע המשפחתי הבא:</span>
                <span className="truncate group-hover:text-primary transition-colors">{nextEv.name}</span>
                {nextEv.relation === "You" && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">אני</span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {nextEv.isBirthday 
                  ? (nextEv.ageTurning ? `חוגג/ת ${nextEv.ageTurning}` : "יום הולדת") 
                  : `אזכרה (${nextEv.yearsSince || 0} שנים)`
                }
                {" • "}
                <span className="font-bold text-foreground/80">
                  {nextEv.daysUntil === 0 
                    ? "היום! 🎉" 
                    : nextEv.daysUntil === 1 
                      ? "מחר!" 
                      : `בעוד ${nextEv.daysUntil} ימים`
                  }
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-primary font-bold shrink-0 bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
            <span>לוח שנה</span>
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        <FamilyCalendarModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          upcomingBirthdays={upcomingBirthdays}
          isLoading={isLoading}
          onSelectMember={onSelectMember}
          calendarType={calendarType}
          setCalendarType={setCalendarType}
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
          <span>תאריכים משפחתיים</span>
        </h3>
        
        {/* Calendar Selection Toggle */}
        <div className="flex bg-secondary/80 border border-border p-0.5 rounded-lg text-[9px]">
          <button
            onClick={() => setCalendarType("gregorian")}
            className={`px-2 py-0.5 rounded-md transition-all font-semibold ${
              calendarType === "gregorian"
                ? "bg-teal-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            לועזי
          </button>
          <button
            onClick={() => setCalendarType("hebrew")}
            className={`px-2 py-0.5 rounded-md transition-all font-semibold ${
              calendarType === "hebrew"
                ? "bg-teal-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            עברי
          </button>
        </div>
      </div>

      {/* Compact Preview List */}
      <div className="space-y-2.5">
        {isLoading ? (
          [1, 2].map((i) => <CompactRowSkeleton key={i} />)
        ) : previewEvents.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-4 bg-secondary/10 rounded-xl">אין אירועים קרובים ב-150 הימים הבאים.</p>
        ) : (
          previewEvents.map((b) => renderPreviewRow(b))
        )}
      </div>

      {/* Open Full Calendar Button */}
      {allEvents.length > 0 && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 bg-secondary/40 hover:bg-secondary/80 border border-border/60 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 text-foreground"
        >
          <span>לכל התאריכים והאזכרות</span>
          <span>📅</span>
        </button>
      )}

      {/* Main Full Calendar Modal */}
      <FamilyCalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        upcomingBirthdays={upcomingBirthdays}
        isLoading={isLoading}
        onSelectMember={onSelectMember}
        calendarType={calendarType}
        setCalendarType={setCalendarType}
      />

      {/* Navigation Engine Chooser Modal - rendered via Portal so it's above everything */}
      {navMember && createPortal(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl max-w-xs w-full space-y-4 animate-in fade-in zoom-in duration-200 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h4 className="font-heading text-sm font-bold text-foreground">בחר אפליקציית ניווט</h4>
              <button onClick={() => setNavMember(null)} className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-secondary">✕</button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ניווט אל מקום קבורתו של {navMember.name}: <span className="font-medium text-foreground block mt-1">{navMember.burialPlace}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  window.open(`https://waze.com/ul?q=${encodeURIComponent(navMember.burialPlace)}&navigate=yes`, '_blank');
                  setNavMember(null);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border bg-secondary/40 hover:bg-secondary transition-all gap-2 hover:border-primary/40 group active:scale-95"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🚙</span>
                <span className="text-xs font-bold">Waze</span>
              </button>
              <button
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navMember.burialPlace)}`, '_blank');
                  setNavMember(null);
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

