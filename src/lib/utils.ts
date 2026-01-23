import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes user input to prevent XSS attacks.
 * Strips all HTML tags and returns plain text.
 * Use this for all user-generated content before saving to database.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Strip all HTML tags - only allow plain text
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
  
  // Trim whitespace and normalize
  return sanitized.trim();
}

/**
 * Sanitizes user input while preserving some basic formatting.
 * Allows only safe inline elements for display purposes.
 * Use sparingly - prefer sanitizeInput for most cases.
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Configuration options for retry logic
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay between retries in ms (default: 10000) */
  maxDelayMs?: number;
  /** Function to determine if error is retryable (default: all errors) */
  isRetryable?: (error: unknown) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Default function to check if an error is retryable.
 * Network errors, timeouts, and 5xx errors are retryable.
 * Auth errors (401, 403) and validation errors (400) are not.
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors are always retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Check for Supabase/PostgrestError structure
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; status?: number; message?: string };
    
    // Network-related errors
    if (err.message?.includes('network') || 
        err.message?.includes('timeout') ||
        err.message?.includes('ETIMEDOUT') ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('fetch failed')) {
      return true;
    }
    
    // HTTP status codes
    if (err.status !== undefined) {
      // 5xx server errors are retryable
      if (err.status >= 500 && err.status < 600) return true;
      // 429 rate limiting is retryable
      if (err.status === 429) return true;
      // 408 timeout is retryable
      if (err.status === 408) return true;
      // Client errors (4xx except above) are NOT retryable
      if (err.status >= 400 && err.status < 500) return false;
    }
    
    // PostgreSQL-specific codes that indicate temporary issues
    if (err.code === '40001' || // serialization failure
        err.code === '40P01' || // deadlock
        err.code === '57P03' || // cannot connect now
        err.code === '08006' || // connection failure
        err.code === '08001' || // unable to establish connection
        err.code === '08004') { // rejected connection
      return true;
    }
  }
  
  // Default: retry for unknown errors (network issues often have no structure)
  return true;
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff.
 * Use for critical Supabase operations that may fail due to network issues.
 * 
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => supabase.from('tasks').insert({ name: 'Test' }),
 *   { maxRetries: 3, onRetry: (attempt, err) => console.log(`Retry ${attempt}`) }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 10000,
    isRetryable = isRetryableError,
    onRetry,
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we've exhausted retries or error isn't retryable
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );
      
      // Notify about retry if callback provided
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }
      
      // Wait before next attempt
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Wraps a Supabase operation result and throws on error.
 * Useful for combining with retryWithBackoff.
 * 
 * @example
 * ```ts
 * const data = await retryWithBackoff(() => 
 *   supabase.from('tasks').select('*').then(unwrapSupabaseResult)
 * );
 * ```
 */
export function unwrapSupabaseResult<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) {
    throw result.error;
  }
  if (result.data === null) {
    throw new Error('No data returned from Supabase');
  }
  return result.data;
}
