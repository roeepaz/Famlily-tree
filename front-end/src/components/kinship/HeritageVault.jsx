import React, { useState, useMemo } from "react";
import { Search, Filter, Plus, BookOpen } from "lucide-react";
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
      setNewImageUrl("");
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
          <Dialog open={open} onOpenChange={setOpen}>
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
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="rounded-xl border-border bg-secondary/20 h-10"
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addStoryMutation.isPending} className="rounded-xl">
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
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
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