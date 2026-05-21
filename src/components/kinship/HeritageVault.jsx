import React, { useState, useMemo } from "react";
import { Search, Filter, Plus, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimelineEvent from "./TimelineEvent";
import { HERITAGE_EVENTS, BRANCHES } from "@/lib/mockData";

export default function HeritageVault() {
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All Branches");

  const allYears = useMemo(() => {
    const years = [...new Set(HERITAGE_EVENTS.map((e) => e.year))].sort((a, b) => b - a);
    return ["All Years", ...years.map(String)];
  }, []);

  const [yearFilter, setYearFilter] = useState("All Years");

  const filtered = useMemo(() => {
    return HERITAGE_EVENTS
      .filter((e) => {
        const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase());
        const matchBranch = branchFilter === "All Branches" || e.branch === branchFilter;
        const matchYear = yearFilter === "All Years" || String(e.year) === yearFilter;
        return matchSearch && matchBranch && matchYear;
      })
      .sort((a, b) => b.year - a.year);
  }, [search, branchFilter, yearFilter]);

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
          <Button className="rounded-xl h-10 px-4 shrink-0">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Story
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {filtered.length > 0 ? (
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