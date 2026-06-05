import React, { useState, useMemo, useRef } from "react";
import { Search, Plus, BookOpen, Camera, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimelineEvent from "./TimelineEvent";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BRANCHES } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TimelineSkeleton } from "./SkeletonLoaders";
import { compressImageToBlob } from "@/lib/imageCompressor";
import { supabaseClient } from "@/lib/AuthContext";

export default function HeritageVault() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All Branches");

  // Dialog & Form states for new heritage event
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Photo Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // File input references
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Query heritage events
  const { data: heritageEvents = [], isLoading } = useQuery({
    queryKey: ["heritageEvents"],
    queryFn: api.getHeritageEvents,
  });

  // Mutation to add new heritage event
  const addStoryMutation = useMutation({
    mutationFn: (eventData) => api.createHeritageEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heritageEvents"] });
      toast({
        title: "Story added! 📖",
        description: "Your family story has been saved to the Heritage Vault.",
      });
      // Reset form fields
      setNewTitle("");
      setNewYear("");
      setNewDescription("");
      setNewImageUrl(""); // Clear this so onOpenChange cleanup is bypassed
      setOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Failed to add story",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e, isCamera = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security & Type Validations
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, WEBP, GIF).",
        variant: "destructive",
      });
      return;
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a photo smaller than 10MB.",
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
      const fileName = `vault_${Date.now()}_${randomSuffix}.${fileExt}`;
      const filePath = `vault/${fileName}`;

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

      setNewImageUrl(publicUrl);
      toast({
        title: "Photo uploaded successfully! 📸",
        description: "Your photo is ready to be saved with the story.",
      });
    } catch (err) {
      console.error("Failed to upload image:", err);
      setUploadError("Failed to upload image. Please try again.");
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload photo. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear file inputs so same file can be selected again
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    if (!newImageUrl) return;

    try {
      const parts = newImageUrl.split('/heritage-media/');
      if (parts.length > 1) {
        const filePath = parts[1];
        await supabaseClient.storage.from('heritage-media').remove([filePath]);
      }
    } catch (err) {
      console.warn("Failed to delete file from storage:", err);
    }
    
    setNewImageUrl("");
    setUploadError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle || !newYear || !newDescription) return;

    // Use January 2nd as default date in that year
    const dateStr = `${newYear}-01-02`;
    addStoryMutation.mutate({
      title: newTitle,
      description: newDescription,
      eventDate: dateStr,
      mediaUrls: newImageUrl ? [newImageUrl] : [],
    });
  };

  const allYears = useMemo(() => {
    const years = [...new Set(heritageEvents.map((e) => e.year).filter(Boolean))].sort((a, b) => b - a);
    return ["All Years", ...years.map(String)];
  }, [heritageEvents]);

  const [yearFilter, setYearFilter] = useState("All Years");

  const filtered = useMemo(() => {
    return heritageEvents
      .filter((e) => {
        const matchSearch = !search || 
          e.title.toLowerCase().includes(search.toLowerCase()) || 
          e.content.toLowerCase().includes(search.toLowerCase());
        const matchBranch = branchFilter === "All Branches" || e.branch === branchFilter;
        const matchYear = yearFilter === "All Years" || String(e.year) === yearFilter;
        return matchSearch && matchBranch && matchYear;
      })
      .sort((a, b) => b.year - a.year);
  }, [heritageEvents, search, branchFilter, yearFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
        </div>
        <h2 className="font-heading text-3xl font-semibold text-foreground">Heritage Vault</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          The definitive story of our family, told by those who lived it.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stories, events, and people..."
              className="pl-9 rounded-xl border-none bg-secondary/50 h-10 text-sm"
            />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full sm:w-40 rounded-xl bg-secondary/50 border-none h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allYears.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl bg-secondary/50 border-none h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(val) => {
            if (!val) {
              // If user closes dialog manually, clean up any uploaded but unsaved image
              if (newImageUrl && !addStoryMutation.isSuccess) {
                const parts = newImageUrl.split('/heritage-media/');
                if (parts.length > 1) {
                  const filePath = parts[1];
                  supabaseClient.storage.from('heritage-media').remove([filePath]).catch(err => {
                    console.warn("Cleanup failed:", err);
                  });
                }
              }
              // Reset all form inputs
              setNewTitle("");
              setNewYear("");
              setNewDescription("");
              setNewImageUrl("");
              setUploadError(null);
            }
            setOpen(val);
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-10 px-4 shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Story
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Family Story</DialogTitle>
                <DialogDescription>
                  Preserve a family event, memory, or milestone in the Heritage Vault.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Building the Blue Ridge Cabin"
                    className="rounded-xl border-border bg-secondary/20 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1800"
                    max="2100"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="e.g. 1978"
                    className="rounded-xl border-border bg-secondary/20 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Story / Description</Label>
                  <Textarea
                    id="description"
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Tell the story in detail..."
                    className="rounded-xl border-border bg-secondary/20 min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Add Photo (Optional)</Label>
                  
                  {/* Hidden standard file inputs */}
                  <input
                    type="file"
                    id="camera-upload"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={(e) => handleFileChange(e, true)}
                    className="hidden"
                  />
                  <input
                    type="file"
                    id="gallery-upload"
                    accept="image/*"
                    ref={galleryInputRef}
                    onChange={(e) => handleFileChange(e, false)}
                    className="hidden"
                  />

                  {/* Upload Zone / Preview Area */}
                  {newImageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary/10 group aspect-video flex items-center justify-center shadow-inner">
                      <img
                        src={newImageUrl}
                        alt="Uploaded preview"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removePhoto}
                          className="rounded-xl flex items-center gap-1.5 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                          Remove Photo
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors md:hidden shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : isUploading ? (
                    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center p-8 h-40 animate-pulse">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p className="text-sm font-medium text-primary">Compressing & uploading photo...</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Stripping location and camera data for privacy</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Desktop layout: standard file select click zone */}
                      <div 
                        onClick={() => galleryInputRef.current?.click()}
                        className="hidden md:flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/15 hover:bg-secondary/30 transition-all duration-200 p-6 text-center cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-2.5 transition-colors">
                          <ImageIcon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-foreground">Click to upload a photo</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Supports PNG, JPG, WEBP, GIF up to 10MB</p>
                      </div>

                      {/* Mobile layout: Camera vs Gallery Buttons */}
                      <div className="grid grid-cols-2 gap-3 md:hidden">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => cameraInputRef.current?.click()}
                          className="rounded-xl h-20 flex flex-col gap-1.5 items-center justify-center bg-secondary/10 border-border hover:bg-secondary/20"
                        >
                          <Camera className="w-5 h-5 text-primary" />
                          <span className="text-xs font-medium">Take Photo</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => galleryInputRef.current?.click()}
                          className="rounded-xl h-20 flex flex-col gap-1.5 items-center justify-center bg-secondary/10 border-border hover:bg-secondary/20"
                        >
                          <ImageIcon className="w-5 h-5 text-primary" />
                          <span className="text-xs font-medium">Photo Library</span>
                        </Button>
                      </div>

                      {uploadError && (
                        <p className="text-xs text-destructive font-medium mt-1">{uploadError}</p>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addStoryMutation.isPending || isUploading} className="rounded-xl">
                    {addStoryMutation.isPending ? "Saving..." : "Save Story"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <TimelineSkeleton count={4} />
      ) : filtered.length > 0 ? (
        <div>
          {filtered.map((event, i) => (
            <TimelineEvent key={event.id} event={event} isLast={i === filtered.length - 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No heritage stories match your filters.</p>
        </div>
      )}
    </div>
  );
}