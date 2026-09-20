import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Search, CalendarDays, MapPin, Compass, X, Calendar, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FamilyGatheringsModal({
  isOpen,
  onClose,
  events = [],
  isLoading,
  onTabChange
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("upcoming"); // 'upcoming', 'past'
  const [navLocation, setNavLocation] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter events based on search query and tab (upcoming/past)
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const eventDate = new Date(e.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    
    const isUpcoming = eventDate >= today;
    const matchesTab = filterTab === "upcoming" ? isUpcoming : !isUpcoming;

    return matchesSearch && matchesTab;
  });

  // Sort: upcoming -> earliest first, past -> latest first
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = new Date(a.eventDate).getTime();
    const timeB = new Date(b.eventDate).getTime();
    return filterTab === "upcoming" ? timeA - timeB : timeB - timeA;
  });

  const getDaysCountdown = (eventDateStr) => {
    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);
    const timeDiff = eventDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff === 0) return "היום! 🎈";
    if (daysDiff === 1) return "מחר!";
    if (daysDiff === 2) return "בעוד יומיים";
    if (daysDiff < 0) return "עבר";
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

  const formatFullDateHebrew = (dateStr) => {
    const date = new Date(dateStr);
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = date.toLocaleDateString("he-IL", { month: "long" });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `יום ${dayName}, ${day} ב${month} ${year} • בשעה ${hours}:${minutes}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[92vw] sm:w-full max-h-[85vh] p-0 overflow-hidden bg-card border border-border/60 rounded-3xl shadow-2xl flex flex-col" dir="rtl">
        {/* Navigation Chooser — rendered INSIDE DialogContent portal so it stacks above */}
        {navLocation && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl max-w-xs w-full space-y-4 animate-in fade-in zoom-in duration-200 text-right" dir="rtl">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h4 className="font-heading text-sm font-bold text-foreground">בחר אפליקציית ניווט</h4>
                <button onClick={() => setNavLocation(null)} className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-secondary">✕</button>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ניווט אל מיקום המפגש של "{navLocation.title}":</p>
                <p className="text-xs font-bold text-foreground bg-secondary/40 p-2 rounded-xl border border-border/40">{navLocation.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
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
          </div>
        )}
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/4 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-border/40 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-right">
              <DialogTitle className="font-heading text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <span>🎈</span>
                <span>מפגשים ואירועים משפחתיים</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground font-medium">
                האירועים והמפגשים המשותפים של כל המשפחה
              </DialogDescription>
            </div>
            
            {/* Upcoming vs Past Toggle */}
            <div className="flex bg-secondary/80 border border-border p-1 rounded-xl text-xs self-start sm:self-auto">
              <button
                onClick={() => setFilterTab("upcoming")}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                  filterTab === "upcoming"
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                בקרוב
              </button>
              <button
                onClick={() => setFilterTab("past")}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                  filterTab === "past"
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                אירועי עבר
              </button>
            </div>
          </div>

          {/* Search & Category Filter Section */}
          <div className="mt-5 flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="חפש מפגש לפי שם, מיקום או פירוט..."
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
          </div>
        </div>

        {/* Scrollable Gatherings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {isLoading ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-full bg-secondary/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-secondary/10 border border-dashed border-border/40">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-medium text-foreground">لا נמצאו מפגשים</p>
              <p className="text-xs text-muted-foreground mt-1">אין מפגשים התואמים את החיפוש שלכם.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sortedEvents.map((evt) => {
                  const hasLocation = evt.location && evt.location !== "TBD";
                  const countdown = getDaysCountdown(evt.eventDate);
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={evt.id}
                      className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/30 hover:border-border/60 shadow-sm hover:shadow-md transition-all text-right"
                    >
                      {/* Left/Right layouts depending on viewport, but we maintain RTL */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Date Block */}
                        <div className="w-12 h-14 bg-card rounded-xl border border-border overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-colors">
                          <div className="w-full bg-primary text-[10px] font-bold text-primary-foreground py-0.5 text-center leading-none uppercase">
                            {getMonthStrHebrew(evt.eventDate)}
                          </div>
                          <div className="text-lg font-extrabold text-foreground leading-none py-1.5">
                            {getDayStr(evt.eventDate)}
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {evt.title}
                          </h4>
                          
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
                              <span>{formatFullDateHebrew(evt.eventDate)}</span>
                            </p>
                            
                            {evt.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium truncate">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
                                <span className="truncate">{evt.location}</span>
                              </p>
                            )}
                          </div>

                          {evt.description && (
                            <p className="text-xs text-foreground/70 mt-2.5 bg-card/60 p-2.5 rounded-xl border border-border/20 leading-relaxed font-medium">
                              {evt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Event actions / countdown */}
                      <div className="flex sm:flex-col justify-between items-center sm:items-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/30">
                        {filterTab === "upcoming" && (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            countdown.includes("היום") || countdown.includes("מחר")
                              ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white animate-pulse"
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}>
                            {countdown}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {hasLocation && filterTab === "upcoming" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNavLocation(evt);
                              }}
                              className="p-1.5 px-3 text-[10px] font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>נווט למפגש</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onTabChange && onTabChange("events");
                              onClose();
                            }}
                            className="p-1.5 px-3 text-[10px] font-bold rounded-xl bg-secondary hover:bg-secondary-foreground/10 text-foreground transition-colors active:scale-95 border border-border/60"
                          >
                            לפרטים המלאים
                          </button>
                        </div>
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
