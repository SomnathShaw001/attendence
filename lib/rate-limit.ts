/**
 * In-Memory Sliding-Window Rate Limiter
 * 
 * Provides rate limiting protection for sensitive server actions and endpoints.
 * Automatically cleans up expired windows to prevent memory bloat.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private lastCleanup: number = Date.now();

  constructor(options: { maxRequests: number; windowMs: number }) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  /**
   * Check if an identifier (e.g. userId, IP, or composite key) is allowed to proceed.
   */
  public check(identifier: string): { success: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    this.periodicCleanup(now);

    let record = this.store.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(identifier, record);
    }

    // Filter out timestamps older than the sliding window
    const windowStart = now - this.windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return {
        success: false,
        remaining: 0,
        resetMs,
      };
    }

    // Record this attempt
    record.timestamps.push(now);
    return {
      success: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetMs: this.windowMs,
    };
  }

  /**
   * Clean up stale keys every 5 minutes to keep memory bounded.
   */
  private periodicCleanup(now: number) {
    if (now - this.lastCleanup > 300_000) {
      this.lastCleanup = now;
      const windowStart = now - this.windowMs;
      for (const [key, record] of this.store.entries()) {
        record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
        if (record.timestamps.length === 0) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Reset the limiter for testing purposes.
   */
  public reset() {
    this.store.clear();
  }
}

// Pre-configured rate limiters for sensitive actions
export const qrAttendanceLimiter = new RateLimiter({
  maxRequests: 5, // max 5 scan submissions
  windowMs: 10_000, // per 10-second rolling window per student
});
