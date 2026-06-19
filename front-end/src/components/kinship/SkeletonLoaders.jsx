import React from "react";
import { TreePine } from "lucide-react";

/**
 * Base shimmer pulse element — just a block with animated background.
 */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-secondary/70 ${className}`}
    />
  );
}

/**
 * Skeleton for a single FamilyPostCard in the main feed.
 */
export function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      {/* Optional image block */}
      <Skeleton className="h-48 w-full rounded-xl" />
      {/* Reaction row */}
      <div className="flex items-center gap-4 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a single compact member row in the sidebar.
 */
export function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 p-1">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the "Family At a Glance" stats block.
 */
export function StatsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for a birthday / event compact row in the right sidebar.
 */
export function CompactRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-2 w-20" />
      </div>
      <Skeleton className="h-5 w-12 rounded-full shrink-0" />
    </div>
  );
}

/**
 * Full FamilyHub feed skeleton — 3 post cards.
 */
export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for an EventCard in FamilyEvents grid.
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      {/* RSVP row */}
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the FamilyEvents page grid.
 */
export function EventsGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a single HeritageVault timeline entry.
 */
export function TimelineEntrySkeleton() {
  return (
    <div className="relative flex gap-6 pb-10">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <Skeleton className="w-4 h-4 rounded-full mt-1 shrink-0" />
        <div className="w-0.5 flex-1 bg-secondary/60 mt-2" />
      </div>
      {/* Content */}
      <div className="flex-1 space-y-3 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        {/* Optional image */}
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Full Heritage Vault timeline skeleton.
 */
export function TimelineSkeleton({ count = 4 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <TimelineEntrySkeleton key={i} />
      ))}
    </div>
  );
}

export function TreeSkeleton() {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4 animate-pulse">
      <div className="inline-flex flex-col items-center min-w-full justify-center">
        <div className="flex flex-col items-center space-y-8 sm:space-y-10 min-w-max px-8 py-2 w-full">
          {[1, 2, 3].map((rowIdx) => (
            <div key={rowIdx} className="w-full flex flex-col items-center">
              <div className="flex items-center gap-3 mb-5 w-full">
                <div className="h-3 w-32 bg-slate-800 rounded-full shrink-0" />
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <div className="flex justify-center items-center gap-4 sm:gap-6 w-full">
                {rowIdx === 2 ? (
                  <>
                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3.5 border border-dashed border-slate-800/50 rounded-2xl sm:rounded-3xl bg-slate-950/40 shadow-inner relative shrink-0">
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-900/40 w-[115px] sm:w-[155px] shrink-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-800 shrink-0" />
                        <div className="h-2.5 w-14 bg-slate-800 rounded-full mt-1.5" />
                        <div className="h-2 w-10 bg-slate-800/80 rounded-full" />
                      </div>
                      <div className="w-4 sm:w-6 h-px bg-slate-800/50 relative flex items-center justify-center shrink-0">
                        <span className="text-[9px] sm:text-[10px] leading-none bg-slate-950 px-1 rounded-full border border-slate-800/50">❤️</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-900/40 w-[115px] sm:w-[155px] shrink-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-800 shrink-0" />
                        <div className="h-2.5 w-14 bg-slate-800 rounded-full mt-1.5" />
                        <div className="h-2 w-10 bg-slate-800/80 rounded-full" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-900/40 w-[115px] sm:w-[155px] shrink-0">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-800 shrink-0" />
                      <div className="h-2.5 w-14 bg-slate-800 rounded-full mt-1.5" />
                      <div className="h-2 w-10 bg-slate-800/80 rounded-full" />
                    </div>
                  </>
                ) : (
                  Array.from({ length: 2 }).map((_, nodeIdx) => (
                    <div
                      key={nodeIdx}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-900/40 w-[115px] sm:w-[155px] shrink-0"
                    >
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-800 shrink-0" />
                      <div className="h-2.5 w-14 bg-slate-800 rounded-full mt-1.5" />
                      <div className="h-2 w-10 bg-slate-800/80 rounded-full" />
                    </div>
                  ))
                )}
              </div>
              {rowIdx !== 3 && (
                <div className="flex justify-center mt-5">
                  <div className="w-px h-8 bg-slate-800" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the complete authenticated App shell layout.
 * Used during authentication verification on page refresh/reload.
 */
export function AppSkeletonShell({ activeTab = "tree" }) {
  const renderContent = () => {
    switch (activeTab) {
      case "hub":
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <main className="lg:col-span-9 space-y-5">
                <div className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm h-32 flex flex-col justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary" />
                    <div className="flex-1 h-10 bg-secondary/50 rounded-xl" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-24 h-8 bg-secondary rounded-lg" />
                    <div className="w-24 h-8 bg-secondary rounded-lg" />
                  </div>
                </div>
                <FeedSkeleton count={2} />
              </main>
              <aside className="hidden lg:block lg:col-span-3 space-y-5">
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
                  <div className="h-4 w-32 bg-secondary rounded" />
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-full bg-secondary" />
                        <div className="flex-1 h-3 bg-secondary/50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
                  <div className="h-4 w-32 bg-secondary rounded" />
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-full bg-secondary" />
                        <div className="flex-1 h-3 bg-secondary/50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        );
      case "vault":
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="text-center mb-8 space-y-3 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />
              <div className="h-8 w-48 bg-secondary rounded-lg animate-pulse" />
              <div className="h-4 w-72 bg-secondary/70 rounded animate-pulse" />
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-8 h-16 flex gap-3">
              <div className="flex-1 bg-secondary/50 rounded-xl animate-pulse" />
              <div className="w-32 bg-secondary/50 rounded-xl animate-pulse" />
              <div className="w-32 bg-secondary/50 rounded-xl animate-pulse" />
            </div>
            <TimelineSkeleton count={3} />
          </div>
        );
      case "events":
        return (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-secondary rounded-lg" />
                <div className="h-4 w-72 bg-secondary/70 rounded" />
              </div>
              <div className="w-32 h-10 bg-secondary rounded-xl animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
              <div className="w-64 h-10 bg-secondary/50 rounded-xl animate-pulse" />
              <div className="w-48 h-10 bg-secondary/50 rounded-xl animate-pulse" />
            </div>
            <EventsGridSkeleton count={4} />
          </div>
        );
      case "tree":
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative min-h-[80vh] w-full overflow-hidden flex flex-col items-center py-8 px-4 sm:px-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
              <div className="w-full max-w-5xl z-10 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-800 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-800 rounded-lg" />
                    <div className="h-4 w-72 bg-slate-800 rounded-lg" />
                  </div>
                  <div className="h-10 w-36 bg-slate-800 rounded-xl" />
                </div>
                <TreeSkeleton />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skeleton Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TreePine className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Kinship
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-8 rounded-lg bg-secondary/60 animate-pulse hidden md:block" />
            <div className="w-9 h-9 rounded-full bg-secondary/60 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Skeleton Content */}
      {renderContent()}
    </div>
  );
}
