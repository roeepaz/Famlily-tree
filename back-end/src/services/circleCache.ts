/**
 * circleCache.ts
 *
 * A simple in-process TTL cache for family circle memberships.
 *
 * The family graph barely changes (relationships are added rarely). Recomputing
 * the entire graph for every API call on a single page load wastes DB round-trips.
 *
 * Strategy:
 *  - Cache the result of getFamilyCircle(userId) for CACHE_TTL_MS milliseconds.
 *  - Any write that changes the graph (createRelationship, respondToRequest) calls
 *    invalidateCircleCache(userId) so stale data is never served after an update.
 *  - The cache lives only in this Node.js process — no Redis needed.
 */

import { Profile } from '@prisma/client';

const CACHE_TTL_MS = 30_000; // 30 seconds — enough to cover a full page-load burst

interface CacheEntry {
  profiles: Profile[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Retrieve cached circle for userId, if still fresh.
 */
export function getCachedCircle(userId: string): Profile[] | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId);
    return null;
  }
  return entry.profiles;
}

/**
 * Store the circle result for userId.
 */
export function setCachedCircle(userId: string, profiles: Profile[]): void {
  cache.set(userId, {
    profiles,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Invalidate the cache for one or more user IDs.
 * Call this whenever a relationship is created, accepted, or deleted.
 */
export function invalidateCircleCache(...userIds: string[]): void {
  for (const id of userIds) {
    cache.delete(id);
  }
}

/**
 * Purge all expired entries (housekeeping — call periodically if needed).
 */
export function purgeExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) cache.delete(key);
  }
}

// Auto-purge stale entries every 5 minutes to prevent memory growth
setInterval(purgeExpiredEntries, 5 * 60 * 1000).unref();
