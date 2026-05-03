/**
 * SafeApiClient Tests — Ensuring robust network handling.
 *
 * Tests timeout logic, retry mechanism, error boundaries,
 * and typed response parsing for the core HTTP client.
 *
 * @module tests/unit/api-client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafeApiClient } from '../../src/services/api-client';

declare var global: any;

describe('SafeApiClient — Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('performs a successful GET request', async () => {
    const mockData = { result: 'ok' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const client = new SafeApiClient({ baseUrl: 'https://api.test' });
    const response = await client.get('/test');

    expect(response.ok).toBe(true);
    expect(response.data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/test',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('performs a successful GET request with custom headers', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const client = new SafeApiClient({ baseUrl: 'https://api.test' });
    const response = await client.get('/test', { 'X-Custom-Header': 'CustomValue' });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'X-Custom-Header': 'CustomValue' })
      })
    );
  });

  it('performs a successful POST request with JSON body', async () => {
    const mockData = { id: 123 };
    const requestBody = { name: 'test' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockData,
    });

    const client = new SafeApiClient({ baseUrl: 'https://api.test' });
    const response = await client.post('/create', requestBody);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    );
  });

  it('handles HTTP error statuses gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const client = new SafeApiClient({ baseUrl: 'https://api.test' });
    const response = await client.get('/not-found');

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
    expect(response.error).toContain('404');
  });

  it('implements retry logic on network failures', async () => {
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

    const client = new SafeApiClient({ 
      baseUrl: 'https://api.test',
      retries: 1 
    });
    
    const response = await client.get('/retry-test');

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles request timeouts', async () => {
    // Mock a fetch that rejects when the abort signal is triggered
    (global.fetch as any).mockImplementation((_url: string, options?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => reject(new Error('abort')));
        }
      });
    });
    
    const client = new SafeApiClient({ 
      baseUrl: 'https://api.test',
      timeoutMs: 10,
      retries: 0
    });
    
    const response = await client.get('/timeout');

    expect(response.ok).toBe(false);
    expect(response.error).toContain('timed out');
  });

  it('uses default retries when not specified', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network failure'));

    // No retries specified, should default to 1 retry (2 attempts total)
    const client = new SafeApiClient({ baseUrl: 'https://api.test', timeoutMs: 50 });
    
    vi.useFakeTimers();
    const responsePromise = client.get('/test');
    await vi.advanceTimersByTimeAsync(1000);
    const response = await responsePromise;
    vi.useRealTimers();

    expect(response.ok).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles non-Error objects being thrown gracefully', async () => {
    // Throw a string instead of an Error object
    (global.fetch as any).mockRejectedValue('String error');

    const client = new SafeApiClient({ baseUrl: 'https://api.test', retries: 0 });
    const response = await client.get('/test');

    expect(response.ok).toBe(false);
    expect(response.error).toBe('Network error. Please try again later.');
  });
});
