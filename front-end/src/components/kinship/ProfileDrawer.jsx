import React, { useState, useRef } from "react";
import { X, MapPin, Mail, Phone, Calendar, Clock, ArrowRight, Plus, Camera, History, UserPlus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { compressImage } from "@/lib/imageCompressor";

const getActivityIcon = (type) => {
  switch (type) {
    case "post":
      return <Camera className="w-3.5 h-3.5 text-primary flex-shrink-0" />;
    case "heritage":
      return <History className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />;
    case "relationship":
      return <UserPlus className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />;
    case "joined":
    default:
      return <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
  }
};

const GEMATRIA_DAYS = {
  1: "א'", 2: "ב'", 3: "ג'", 4: "ד'", 5: "ה'", 6: "ו'", 7: "ז'", 8: "ח'", 9: "ט'", 10: "י'",
  11: "י\"א", 12: "י\"ב", 13: "י\"ג", 14: "י\"ד", 15: "ט\"ו", 16: "ט\"ז", 17: "י\"ז", 18: "י\"ח", 19: "י\"ט", 20: "כ'",
  21: "כ\"א", 22: "כ\"ב", 23: "כ\"ג", 24: "כ\"ד", 25: "כ\"ה", 26: "כ\"ו", 27: "כ\"ז", 28: "כ\"ח", 29: "כ\"ט", 30: "ל'"
};

const HEBREW_MONTHS = {
  1: "ניסן", 2: "אייר", 3: "סיוון", 4: "תמוז", 5: "אב", 6: "אלול",
  7: "תשרי", 8: "חשוון", 9: "כסלו", 10: "טבת", 11: "שבט", 12: "אדר", 13: "אדר ב'"
};

function formatHebrewDate(day, month, year) {
  if (!day || !month) return "";
  const dayStr = GEMATRIA_DAYS[day] || day.toString();
  const monthStr = HEBREW_MONTHS[month] || "";
  let yearStr = "";
  if (year) {
    if (year === 5786) yearStr = "ה'תשפ\"ו";
    else if (year === 5785) yearStr = "ה'תשפ\"ה";
    else if (year === 5784) yearStr = "ה'תשפ\"ד";
    else yearStr = `ה'${year}`;
  }
  return `${dayStr} ב${monthStr}${yearStr ? ' ' + yearStr : ''}`;
}

export default function ProfileDrawer({ member, isOpen, onClose, onAddRelative, isEditMode }) {
  const { user, checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [navPlace, setNavPlace] = useState(null);
  const fileInputRef = useRef(null);

  const { data: activities = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ["profileActivity", member?.id],
    queryFn: () => api.getProfileActivity(member.id),
    enabled: !!member?.id && isOpen,
  });

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const isCurrentUser = user && member && user.id === member.id;
  const displayName = isCurrentUser ? user.name : (member ? member.name : "");
  const displayAvatar = isCurrentUser ? user.avatar : (member ? member.avatar : "");
  const hBirth = member ? (member.hebrewBirthDate || formatHebrewDate(member.hebrewBirthDay, member.hebrewBirthMonth, member.hebrewBirthYear)) : "";
  const hDeath = member ? (member.hebrewDeathDate || formatHebrewDate(member.hebrewDeathDay, member.hebrewDeathMonth, member.hebrewDeathYear)) : "";

  const handleDeleteProfile = async () => {
    if (!member) return;
    
    const confirmMessage = `האם אתה בטוח שברצונך למחוק את ${displayName} מעץ המשפחה?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteProfile(member.id);
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      toast({
        title: "הוסר בהצלחה! 🗑️",
        description: `הסרת את ${displayName} מעץ המשפחה.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "שגיאה בהסרת אדם",
        description: err.message || "משהו השתבש.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a photo under 10MB.",
          variant: "destructive"
        });
        return;
      }
      setIsSaving(true);
      try {
        const compressedBase64 = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.6 });
        await api.updateProfile(user.id, { avatar_url: compressedBase64 });
        await checkUserAuth();
        queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        toast({
          title: "Success",
          description: "Profile photo updated successfully."
        });
        setIsEditingPhoto(false);
      } catch (err) {
        toast({
          title: "Error",
          description: err.message || "Failed to update profile photo.",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveUrl = async () => {
    if (!photoUrlInput.trim()) return;
    setIsSaving(true);
    try {
      await api.updateProfile(user.id, { avatar_url: photoUrlInput.trim() });
      await checkUserAuth();
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Success",
        description: "Profile photo updated successfully."
      });
      setIsEditingPhoto(false);
      setPhotoUrlInput("");
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update profile photo.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile(user.id, { avatar_url: "" });
      await checkUserAuth();
      queryClient.invalidateQueries({ queryKey: ["familyCircle"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Success",
        description: "Profile photo removed successfully."
      });
      setIsEditingPhoto(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove profile photo.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && member && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="px-6 -mt-12">
                {isCurrentUser ? (
                  <div className="relative group cursor-pointer w-24 h-24" onClick={() => setIsEditingPhoto(!isEditingPhoto)}>
                    <Avatar className="w-24 h-24 ring-4 ring-card shadow-lg transition-transform duration-200 group-hover:scale-[1.02]">
                      <AvatarImage src={displayAvatar} alt={displayName} />
                      <AvatarFallback className="text-2xl font-heading">{displayName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <Avatar className="w-24 h-24 ring-4 ring-card shadow-lg">
                    <AvatarImage src={displayAvatar} alt={displayName} />
                    <AvatarFallback className="text-2xl font-heading">{displayName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="px-6 pt-4 pb-8 space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  {displayName}
                  {member.isDeceased && <span className="ml-2 text-base">🕊️</span>}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-xs">{member.relation}</Badge>
                  <Badge variant="outline" className="text-xs">{member.branch}</Badge>
                </div>
              </div>

              {isEditingPhoto && isCurrentUser && (
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Update Profile Photo</h4>
                    <button 
                      onClick={() => setIsEditingPhoto(false)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Upload File
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1.5"
                      onClick={handleRemovePhoto}
                      disabled={isSaving || !displayAvatar}
                    >
                      Remove Photo
                    </Button>
                  </div>

                  <div className="relative flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="Or paste image URL..."
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                      disabled={isSaving}
                    />
                    <Button
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={handleSaveUrl}
                      disabled={isSaving || !photoUrlInput.trim()}
                    >
                      {isSaving ? "Saving..." : "Apply"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Contact Details */}
              <div className="space-y-3">
                {member.location && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {member.location}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {member.email}
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {member.phone}
                  </div>
                )}
                {member.birthYear && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span>
                      Born {member.birthYear}
                      {member.isDeceased && member.deathYear && ` · Passed ${member.deathYear}`}
                    </span>
                  </div>
                )}
                {(hBirth || hDeath) && (
                  <div className="flex items-start gap-3 text-sm text-foreground/80 animate-in fade-in duration-200">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-xs">✡️</span>
                    </div>
                    <div className="space-y-0.5 text-right flex-1" dir="rtl">
                      {hBirth && <p className="text-xs"><span className="text-muted-foreground">תאריך לידה עברי:</span> {hBirth}</p>}
                      {hDeath && <p className="text-xs"><span className="text-muted-foreground">תאריך פטירה עברי:</span> {hDeath}</p>}
                    </div>
                  </div>
                )}
                {member.isDeceased && member.burialPlace && (
                  <div className="flex items-start gap-3 text-sm text-foreground/80 animate-in fade-in duration-200">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-xs">🪦</span>
                    </div>
                    <div className="space-y-1 text-right flex-1" dir="rtl">
                      <p className="text-xs leading-normal"><span className="text-muted-foreground">מקום קבורה:</span> {member.burialPlace}</p>
                      <button
                        onClick={() => setNavPlace(member.burialPlace)}
                        className="text-[10px] text-primary hover:underline flex items-center justify-start gap-1 mt-0.5"
                      >
                        <span>🧭 נווט לבית העלמין</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {isLoadingActivity ? (
                    <div className="text-xs text-muted-foreground animate-pulse py-4 text-center bg-secondary/20 rounded-xl">
                      Loading activities...
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-4 text-center bg-secondary/20 rounded-xl">
                      No recent activity.
                    </div>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/40">
                        <div className="mt-0.5">
                          {getActivityIcon(act.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-foreground/80 block break-words leading-relaxed">
                            {act.description}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {formatActivityTime(act.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full rounded-xl" variant="outline">
                  View Full Memory Timeline
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {isEditMode && !isCurrentUser && !member.isActive && (
                  <Button
                    onClick={handleDeleteProfile}
                    disabled={isDeleting}
                    className="w-full rounded-xl bg-rose-950/20 hover:bg-rose-900 border border-rose-800/50 text-rose-400 hover:text-rose-200 mt-2 transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? "מוחק..." : (
                      <>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        הסר מעץ המשפחה
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Navigation Engine Chooser Modal */}
          {navPlace && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-xl max-w-xs w-full space-y-4 animate-in fade-in zoom-in duration-200 text-right" dir="rtl">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-heading text-sm font-bold text-foreground">בחר אפליקציית ניווט</h4>
                  <button onClick={() => setNavPlace(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                </div>
                <p className="text-xs text-muted-foreground">ניווט אל: <span className="font-medium text-foreground block mt-1">{navPlace}</span></p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      window.open(`https://waze.com/ul?q=${encodeURIComponent(navPlace)}&navigate=yes`, '_blank');
                      setNavPlace(null);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-all gap-1.5"
                  >
                    <span className="text-2xl">🚙</span>
                    <span className="text-xs font-semibold">Waze</span>
                  </button>
                  <button
                    onClick={() => {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navPlace)}`, '_blank');
                      setNavPlace(null);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-all gap-1.5"
                  >
                    <span className="text-2xl">🗺️</span>
                    <span className="text-xs font-semibold">Google Maps</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}