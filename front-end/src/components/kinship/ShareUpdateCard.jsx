import React, { useState, useRef } from "react";
import { Sun, Trophy, BookHeart, ImagePlus, Send, X, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { POST_TYPE_CONFIG } from "@/lib/mockData";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { compressImage } from "@/lib/imageCompressor";

const typeIcons = { daily: Sun, milestone: Trophy, memory: BookHeart, event: Calendar };

export default function ShareUpdateCard({ onShare }) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("daily");
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB.",
          variant: "destructive",
        });
        return;
      }
      try {
        const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.7 });
        setSelectedImage(compressed);
      } catch (err) {
        toast({
          title: "Compression error",
          description: "Failed to process image.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {/* Image Preview with Framer Motion */}
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="relative overflow-hidden rounded-xl border border-border bg-secondary/20 shadow-inner group"
              >
                <img
                  src={selectedImage}
                  alt="Post upload preview"
                  className="w-full object-cover max-h-64 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground backdrop-blur-md transition-all duration-200 border border-border shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-200 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-1.5" />
                Photo
              </Button>
              <Button
                size="sm"
                className="rounded-xl px-4"
                disabled={!text.trim() && !selectedImage}
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