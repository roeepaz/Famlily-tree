import React, { useState, useRef } from "react";
import { X, MapPin, Mail, Phone, Calendar, Clock, ArrowRight, Plus, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

export default function ProfileDrawer({ member, isOpen, onClose, onAddRelative }) {
  const { user, checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const isCurrentUser = user && member && user.id === member.id;
  const displayName = isCurrentUser ? user.name : (member ? member.name : "");
  const displayAvatar = isCurrentUser ? user.avatar : (member ? member.avatar : "");

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a photo under 2MB.",
          variant: "destructive"
        });
        return;
      }
      setIsSaving(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Url = reader.result;
          await api.updateProfile(user.id, { avatar_url: base64Url });
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
      };
      reader.readAsDataURL(file);
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
                    Born {member.birthYear}
                    {member.isDeceased && ` · Passed ${member.deathYear}`}
                  </div>
                )}
              </div>

              {/* Recent Activity (placeholder) */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {["Shared a family photo", "Commented on a memory", "Updated their profile"].map((activity, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/40">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground/80">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  className="w-full rounded-xl gap-2 font-medium" 
                  onClick={() => onAddRelative(member.id)}
                >
                  <Plus className="w-4 h-4" />
                  Add Relative to {member.name.split(" ")[0]}
                </Button>
                
                <Button className="w-full rounded-xl" variant="outline">
                  View Full Memory Timeline
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}