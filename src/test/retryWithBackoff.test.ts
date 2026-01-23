import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  retryWithBackoff, 
  isRetryableError, 
  unwrapSupabaseResult,
  type RetryOptions 
} from '@/lib/utils';

describe('isRetryableError', () => {
  it('returns true for network fetch errors', () => {
    const error = new TypeError('fetch failed');
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for timeout errors', () => {
    const error = { message: 'ETIMEDOUT' };
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for connection reset errors', () => {
    const error = { message: 'ECONNRESET' };
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for 5xx server errors', () => {
    expect(isRetryableError({ status: 500 })).toBe(true);
    expect(isRetryableError({ status: 502 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 599 })).toBe(true);
  });

  it('returns true for 429 rate limiting', () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
  });

  it('returns true for 408 timeout', () => {
    expect(isRetryableError({ status: 408 })).toBe(true);
  });

  it('returns false for 4xx client errors (except 408, 429)', () => {
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 401 })).toBe(false);
    expect(isRetryableError({ status: 403 })).toBe(false);
    expect(isRetryableError({ status: 404 })).toBe(false);
    expect(isRetryableError({ status: 422 })).toBe(false);
  });

  it('returns true for PostgreSQL temporary failure codes', () => {
    expect(isRetryableError({ code: '40001' })).toBe(true); // serialization failure
    expect(isRetryableError({ code: '40P01' })).toBe(true); // deadlock
    expect(isRetryableError({ code: '57P03' })).toBe(true); // cannot connect now
    expect(isRetryableError({ code: '08006' })).toBe(true); // connection failure
    expect(isRetryableError({ code: '08001' })).toBe(true); // unable to establish connection
    expect(isRetryableError({ code: '08004' })).toBe(true); // rejected connection
  });

  it('returns true for unknown errors (network issues often unstructured)', () => {
    expect(isRetryableError(new Error('Something went wrong'))).toBe(true);
    expect(isRetryableError({})).toBe(true);
    expect(isRetryableError(null)).toBe(true);
  });
});

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns result immediately on success', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const resultPromise = retryWithBackoff(operation);
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries up to maxRetries times on failure', async () => {
    const error = { status: 500, message: 'Server error' };
    const operation = vi.fn().mockRejectedValue(error);
    
    const resultPromise = retryWithBackoff(operation, { maxRetries: 3 });
    
    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0);
    
    // After 1s delay, second attempt
    await vi.advanceTimersByTimeAsync(1000);
    
    // After 2s delay, third attempt
    await vi.advanceTimersByTimeAsync(2000);
    
    // After 4s delay, fourth (final) attempt
    await vi.advanceTimersByTimeAsync(4000);
    
    await expect(resultPromise).rejects.toEqual(error);
    expect(operation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it('succeeds on retry after initial failures', async () => {
    const error = { status: 500 };
    const operation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');
    
    const resultPromise = retryWithBackoff(operation);
    
    // First attempt fails
    await vi.advanceTimersByTimeAsync(0);
    
    // Wait for first retry delay (1s)
    await vi.advanceTimersByTimeAsync(1000);
    
    // Wait for second retry delay (2s)
    await vi.advanceTimersByTimeAsync(2000);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('uses exponential backoff delays', async () => {
    const error = { status: 500 };
    const onRetry = vi.fn();
    const operation = vi.fn().mockRejectedValue(error);
    
    const resultPromise = retryWithBackoff(operation, {
      maxRetries: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      onRetry,
    });
    
    // Let the operation run and fail
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000); // First retry after 1s
    await vi.advanceTimersByTimeAsync(2000); // Second retry after 2s
    await vi.advanceTimersByTimeAsync(4000); // Third retry after 4s
    
    await expect(resultPromise).rejects.toEqual(error);
    
    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, error, 1000);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, error, 2000);
    expect(onRetry).toHaveBeenNthCalledWith(3, 3, error, 4000);
  });

  it('respects maxDelayMs cap', async () => {
    const error = { status: 500 };
    const onRetry = vi.fn();
    const operation = vi.fn().mockRejectedValue(error);
    
    const resultPromise = retryWithBackoff(operation, {
      maxRetries: 5,
      initialDelayMs: 5000,
      backoffMultiplier: 3,
      maxDelayMs: 10000,
      onRetry,
    });
    
    // Run through all retries
    for (let i = 0; i < 6; i++) {
      await vi.advanceTimersByTimeAsync(10000);
    }
    
    await expect(resultPromise).rejects.toEqual(error);
    
    // All delays should be capped at 10000ms
    onRetry.mock.calls.forEach((call) => {
      expect(call[2]).toBeLessThanOrEqual(10000);
    });
  });

  it('does not retry non-retryable errors', async () => {
    const error = { status: 401, message: 'Unauthorized' };
    const operation = vi.fn().mockRejectedValue(error);
    
    const resultPromise = retryWithBackoff(operation);
    
    await expect(resultPromise).rejects.toEqual(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('uses custom isRetryable function', async () => {
    const error = new Error('Custom error');
    const operation = vi.fn().mockRejectedValue(error);
    const customIsRetryable = vi.fn().mockReturnValue(false);
    
    const resultPromise = retryWithBackoff(operation, {
      isRetryable: customIsRetryable,
    });
    
    await expect(resultPromise).rejects.toEqual(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(customIsRetryable).toHaveBeenCalledWith(error);
  });

  it('calls onRetry callback for each retry attempt', async () => {
    const error = { status: 500 };
    const onRetry = vi.fn();
    const operation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');
    
    const resultPromise = retryWithBackoff(operation, { onRetry });
    
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    
    await resultPromise;
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, error, 1000);
  });
});

describe('unwrapSupabaseResult', () => {
  it('returns data when no error', () => {
    const result = { data: { id: '123', name: 'Test' }, error: null };
    expect(unwrapSupabaseResult(result)).toEqual({ id: '123', name: 'Test' });
  });

  it('throws when error is present', () => {
    const error = { message: 'Database error' };
    const result = { data: null, error };
    expect(() => unwrapSupabaseResult(result)).toThrowError();
  });

  it('throws when data is null without error', () => {
    const result = { data: null, error: null };
    expect(() => unwrapSupabaseResult(result)).toThrow('No data returned from Supabase');
  });

  it('handles array data correctly', () => {
    const result = { data: [{ id: '1' }, { id: '2' }], error: null };
    expect(unwrapSupabaseResult(result)).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('handles empty array as valid data', () => {
    const result = { data: [], error: null };
    expect(unwrapSupabaseResult(result)).toEqual([]);
  });
});
