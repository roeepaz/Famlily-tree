import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Search, CalendarDays, Gift, Flame, MapPin, Compass, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FamilyCalendarModal({
  isOpen,
  onClose,
  upcomingBirthdays = [],
  isLoading,
  onSelectMember,
  calendarType = "gregorian",
  setCalendarType
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'birthday', 'memorial'
  const [navMember, setNavMember] = useState(null);

  // Group events by closeness
  const events = upcomingBirthdays.map(b => {
    const isBirthday = b.eventType === "birthday" || !b.isDeceased;
    return {
      ...b,
      isBirthday
    };
  });

  // Filter events based on search query and category tab
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.relation && e.relation.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === "all" || 
                          (filterType === "birthday" && e.isBirthday) ||
                          (filterType === "memorial" && !e.isBirthday);

    return matchesSearch && matchesFilter;
  });

  const getDaysBadgeStyle = (days) => {
    if (days === 0) {
      return "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md animate-pulse font-bold";
    }
    if (days === 1) {
      return "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-semibold";
    }
    return "bg-primary/10 text-primary border border-primary/20";
  };

  const getDaysText = (days, isBirthday) => {
    if (days === 0) return isBirthday ? "היום! 🎂" : "היום 🕯️";
    if (days === 1) return "מחר!";
    if (days === 2) return "בעוד יומיים";
    return `בעוד ${days} ימים`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[92vw] sm:w-full max-h-[85vh] p-0 overflow-hidden bg-card border border-border/60 rounded-3xl shadow-2xl flex flex-col" dir="rtl">
        {/* Navigation Chooser — inside DialogContent portal so it appears on top */}
        {navMember && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl max-w-xs w-full space-y-4 animate-in fade-in zoom-in duration-200 text-right" dir="rtl">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h4 className="font-heading text-sm font-bold text-foreground">בחר אפליקציית ניווט</h4>
                <button onClick={() => setNavMember(null)} className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-secondary">✕</button>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ניווט אל מקום קבורתו של {navMember.name}:</p>
                <p className="text-xs font-bold text-foreground bg-secondary/40 p-2 rounded-xl border border-border/40">{navMember.burialPlace}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
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
          </div>
        )}
        <div className="absolute top-0 right-1/4 w-60 h-60 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-border/40 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-right">
              <DialogTitle className="font-heading text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <span>📅</span>
                <span>לוח תאריכים משפחתי</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground font-medium">
                ימי הולדת ואזכרות של יקיריכם ב-150 הימים הקרובים
              </DialogDescription>
            </div>
            
            {/* Calendar System Switcher */}
            <div className="flex bg-secondary/80 border border-border p-1 rounded-xl text-xs ml-4">
              <button
                onClick={() => setCalendarType("gregorian")}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                  calendarType === "gregorian"
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                לועזי
              </button>
              <button
                onClick={() => setCalendarType("hebrew")}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                  calendarType === "hebrew"
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                עברי
              </button>
            </div>
          </div>

          {/* Search & Category Filter Section */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="חיפוש לפי שם או קרבה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-2xl bg-secondary/50 border border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm transition-all text-right"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-secondary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-secondary/40 p-1 rounded-2xl border border-border/30 gap-1 self-start sm:self-auto">
              {[
                { id: "all", label: "הכל" },
                { id: "birthday", label: "🎂 ימי הולדת" },
                { id: "memorial", label: "🕯️ אזכרות" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterType === tab.id
                      ? "bg-card text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Event List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {isLoading ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full bg-secondary/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-secondary/10 border border-dashed border-border/40">
              <p className="text-2xl mb-2">🌸</p>
              <p className="text-sm font-medium text-foreground">לא נמצאו תאריכים מתאימים</p>
              <p className="text-xs text-muted-foreground mt-1">נסו לשנות את החיפוש או פילטר הסינון</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <AnimatePresence>
                {filteredEvents.map((b) => {
                  const hasBurial = !b.isBirthday && b.burialPlace;
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={`${b.id}-${b.eventType}`}
                      className="group flex flex-col justify-between p-4 rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/30 hover:border-border/60 shadow-sm hover:shadow-md transition-all text-right"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Avatar / Initials */}
                        <div 
                          onClick={() => {
                            onSelectMember && onSelectMember(b);
                            onClose();
                          }}
                          className="cursor-pointer shrink-0"
                        >
                          {b.avatar ? (
                            <img
                              src={b.avatar}
                              alt={b.name}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-primary/10 group-hover:scale-105 transition-transform">
                              {b.name?.[0] || "?"}
                            </div>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <h4 
                            onClick={() => {
                              onSelectMember && onSelectMember(b);
                              onClose();
                            }}
                            className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            {b.name}
                            {b.relation === "You" && (
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-normal">אני</span>
                            )}
                          </h4>
                          
                          {/* Relationship Badge */}
                          {b.relation && b.relation !== "You" && (
                            <span className="inline-block text-[10px] text-muted-foreground font-medium bg-secondary px-1.5 py-0.5 rounded-md mt-0.5">
                              {b.relation}
                            </span>
                          )}

                          <p className="text-xs font-semibold text-foreground/80 mt-2 flex items-center gap-1">
                            <span>{b.isBirthday ? "🎂" : "🕯️"}</span>
                            <span>
                              {b.isBirthday 
                                ? (b.ageTurning ? `חוגג/ת ${b.ageTurning}` : "יום הולדת") 
                                : `אזכרה (${b.yearsSince || 0} שנים)`
                              }
                              {" ב-"}{b.formattedDate}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Bottom row: Countdown pill & navigation */}
                      <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getDaysBadgeStyle(b.daysUntil)}`}>
                          {getDaysText(b.daysUntil, b.isBirthday)}
                        </span>

                        {hasBurial && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNavMember(b);
                            }}
                            className="p-1 px-2.5 text-[10px] font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 transition-colors flex items-center gap-1 shrink-0 shadow-sm active:scale-95"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>נווט לקבר</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-secondary/10 border-t border-border/40 text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-xs font-bold text-foreground transition-all active:scale-95"
          >
            סגור
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
