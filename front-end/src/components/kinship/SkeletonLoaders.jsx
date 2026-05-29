import React from "react";

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
