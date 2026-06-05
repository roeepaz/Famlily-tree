import React, { useState, useRef } from "react";
import { Sun, Trophy, BookHeart, ImagePlus, Send, X, Calendar, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { POST_TYPE_CONFIG } from "@/lib/mockData";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { compressImageToBlob } from "@/lib/imageCompressor";
import { supabaseClient } from "@/lib/AuthContext";

const typeIcons = { daily: Sun, milestone: Trophy, memory: BookHeart, event: Calendar };

export default function ShareUpdateCard({ onShare }) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("daily");
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // Photo Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // File input references
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleImageChange = async (e, isCamera = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validations
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a photo under 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Compress Image (resizing to max 1200px and 0.8 quality to preserve space and strip metadata)
      const compressedFile = await compressImageToBlob(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
      
      // 2. Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const fileName = `post_${Date.now()}_${randomSuffix}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from('heritage-media')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // 3. Get Public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('heritage-media')
        .getPublicUrl(filePath);

      setSelectedImage(publicUrl);
    } catch (err) {
      console.error("Failed to upload post image:", err);
      setUploadError("Failed to upload image.");
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload photo. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset inputs so same file can be chosen again
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!selectedImage) return;

    try {
      const parts = selectedImage.split('/heritage-media/');
      if (parts.length > 1) {
        const filePath = parts[1];
        await supabaseClient.storage.from('heritage-media').remove([filePath]);
      }
    } catch (err) {
      console.warn("Failed to delete file from storage:", err);
    }

    setSelectedImage(null);
    setUploadError(null);
  };

  const handleShare = () => {
    if (!text.trim() && !selectedImage) return;
    if (onShare) {
      onShare({
        content: text,
        type: selectedType,
        image: selectedImage,
      });
    }
    setText("");
    setSelectedImage(null);
    setUploadError(null);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 mt-1">
          <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
          <AvatarFallback>{user?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share a life update with the family..."
            className="min-h-[80px] border-none bg-secondary/40 resize-none rounded-xl text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
          />

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={(e) => handleImageChange(e, true)}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <input
            type="file"
            ref={galleryInputRef}
            onChange={(e) => handleImageChange(e, false)}
            accept="image/*"
            className="hidden"
          />

          {/* Compact Image Preview or Uploading Loader */}
          <AnimatePresence>
            {(selectedImage || isUploading) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 py-1"
              >
                {isUploading ? (
                  <div className="w-16 h-16 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex items-center justify-center animate-pulse shrink-0">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-secondary/20 shadow-inner group shrink-0">
                    <img
                      src={selectedImage}
                      alt="Post upload preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {isUploading ? (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Processing image...</p>
                    <p className="text-[10px]">Stripping metadata for privacy</p>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Image attached successfully</p>
                    <button 
                      type="button" 
                      onClick={handleRemoveImage}
                      className="text-[10px] text-destructive hover:underline mt-0.5 block"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {uploadError && (
            <p className="text-xs text-destructive font-medium mt-1">{uploadError}</p>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Type Badges */}
            <div className="flex items-center gap-2">
              {Object.entries(POST_TYPE_CONFIG)
                .filter(([key]) => key !== "event")
                .map(([key, cfg]) => {
                  const Icon = typeIcons[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedType === key
                        ? cfg.color + " ring-1 ring-current/20"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {/* Modern Dropdown Chooser for Photo */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-200 rounded-xl"
                  onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                >
                  <ImagePlus className="w-4 h-4 mr-1.5" />
                  Photo
                </Button>
                
                {showPhotoMenu && (
                  <>
                    <div className="fixed inset-0 z-15" onClick={() => setShowPhotoMenu(false)} />
                    <div className="absolute right-0 bottom-full mb-2 z-20 min-w-[140px] bg-card border border-border rounded-xl shadow-lg p-1.5 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoMenu(false);
                          cameraInputRef.current?.click();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors text-left font-medium"
                      >
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoMenu(false);
                          galleryInputRef.current?.click();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors text-left font-medium"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        Photo Library
                      </button>
                    </div>
                  </>
                )}
              </div>

              <Button
                size="sm"
                className="rounded-xl px-4"
                disabled={(!text.trim() && !selectedImage) || isUploading}
                onClick={handleShare}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}