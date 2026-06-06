import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, X, Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { compressImage } from "@/lib/imageCompressor";

// Helper to format date strings for input type="datetime-local"
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function EventModal({ isOpen, onClose, onSubmit, event }) {
  const isEditMode = !!event;
  const fileInputRef = useRef(null);

  // Core event fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // Poll fields
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Errors state
  const [errors, setErrors] = useState({});

  // Reset/populate form when modal opens or event changes
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode population
        setTitle(event.title || "");
        setSubtitle(event.subtitle || "");
        setDescription(event.description || "");
        setLocation(event.location || "");
        setEventDate(formatDateTimeLocal(event.eventDate));
        setSelectedImage(event.imageUrl || null);

        if (event.poll) {
          setHasPoll(true);
          setPollQuestion(event.poll.question || "");
          setPollOptions(event.poll.options.map(o => o.text) || ["", ""]);
        } else {
          setHasPoll(false);
          setPollQuestion("");
          setPollOptions(["", ""]);
        }
      } else {
        // Create mode defaults
        setTitle("");
        setSubtitle("");
        setDescription("");
        setLocation("");
        setEventDate("");
        setSelectedImage(null);
        setHasPoll(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
      }
      setErrors({});
    }
  }, [isOpen, event]);

  // Image upload handler
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
        const compressed = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
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

  // Poll options handlers
  const handleOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleAddOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handleRemoveOption = (index) => {
    if (pollOptions.length <= 2) {
      toast({
        title: "Cannot remove option",
        description: "A poll must have at least two choices.",
        variant: "destructive",
      });
      return;
    }
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Event title is required";
    if (!description.trim()) newErrors.description = "Event description is required";
    if (!eventDate) newErrors.eventDate = "Date and time are required";

    if (hasPoll) {
      if (!pollQuestion.trim()) {
        newErrors.pollQuestion = "Poll question is required";
      }
      
      const filledOptions = pollOptions.map(o => o.trim()).filter(o => o !== "");
      if (filledOptions.length < 2) {
        newErrors.pollOptions = "At least two non-empty poll options are required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const eventPayload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim(),
      location: location.trim() || null,
      eventDate,
      imageUrl: selectedImage, // will be ignored by backend during edits, only saved on creation
    };

    if (hasPoll) {
      eventPayload.pollQuestion = pollQuestion.trim();
      eventPayload.pollOptions = pollOptions.map(o => o.trim()).filter(o => o !== "");
    } else {
      eventPayload.pollQuestion = null;
      eventPayload.pollOptions = null;
    }

    onSubmit(eventPayload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] bg-card border border-border shadow-2xl rounded-2xl overflow-y-auto max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold font-heading text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {isEditMode ? "Edit Family Event" : "Create Family Event"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditMode
              ? "Make updates to this event's title, subtitle, location, description, or custom poll."
              : "Set up a new family gathering. Upload a cover photo, specify the details, and optionally start a poll."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Cover Image Selector (Only on Creation mode) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Cover Photo</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              
              {selectedImage ? (
                <div className="relative rounded-xl overflow-hidden border border-border h-40 group">
                  <img
                    src={selectedImage}
                    alt="Cover upload preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground backdrop-blur-md transition-all border border-border"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-xl border border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 flex flex-col items-center justify-center gap-1.5 transition-all text-muted-foreground hover:text-foreground"
                >
                  <ImagePlus className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium">Add Cover Photo (Optional)</span>
                </button>
              )}
            </div>
          )}

          {isEditMode && event.imageUrl && (
            <div className="space-y-2 opacity-80">
              <Label className="text-xs font-semibold text-muted-foreground">Cover Photo (Edit Disabled)</Label>
              <div className="rounded-xl overflow-hidden border border-border h-24">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Form details */}
          <div className="space-y-3">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-medium">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grandma's 80th Birthday Dinner"
                className={errors.title ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
              />
              {errors.title && <p className="text-[10px] text-destructive">{errors.title}</p>}
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <Label htmlFor="subtitle" className="text-xs font-medium">Subtitle / Theme <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A casual backyard get-together"
                className="text-sm"
              />
            </div>

            {/* Date/Time and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="eventDate" className="text-xs font-medium">Date & Time *</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={errors.eventDate ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
                />
                {errors.eventDate && <p className="text-[10px] text-destructive">{errors.eventDate}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="text-xs font-medium">Location <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Uncle John's house / Restaurant name"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-medium">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details like parking, dress code, gift ideas, or basic instructions..."
                className={errors.description ? "border-destructive focus-visible:ring-destructive text-sm min-h-[80px]" : "text-sm min-h-[80px]"}
              />
              {errors.description && <p className="text-[10px] text-destructive">{errors.description}</p>}
            </div>
          </div>

          <div className="border-t border-border/60 my-4" />

          {/* Poll configuration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPoll"
                checked={hasPoll}
                onCheckedChange={(checked) => setHasPoll(!!checked)}
              />
              <Label htmlFor="hasPoll" className="text-xs font-semibold cursor-pointer">
                Add an optional poll for details (e.g. food options, preferred dates)
              </Label>
            </div>

            {hasPoll && (
              <div className="space-y-3 p-4 bg-secondary/20 rounded-2xl border border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1">
                  <Label htmlFor="pollQuestion" className="text-xs font-medium">Poll Question *</Label>
                  <Input
                    id="pollQuestion"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="e.g. What should we order for dinner?"
                    className={errors.pollQuestion ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
                  />
                  {errors.pollQuestion && <p className="text-[10px] text-destructive">{errors.pollQuestion}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium block">Choices *</Label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}

                  {errors.pollOptions && <p className="text-[10px] text-destructive">{errors.pollOptions}</p>}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="mt-1 rounded-xl text-xs flex items-center gap-1 w-fit bg-card"
                  >
                    <Plus className="w-3 h-3" /> Add Choice
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 flex flex-row gap-2 justify-end sm:space-x-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="px-5 bg-primary hover:bg-primary/95 text-primary-foreground">
              {isEditMode ? "Save Changes" : "Create Gathering"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
