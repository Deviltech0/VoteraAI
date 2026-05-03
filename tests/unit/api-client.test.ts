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
    // Mock a fetch that never resolves
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    
    const client = new SafeApiClient({ 
      baseUrl: 'https://api.test',
      timeoutMs: 10,
      retries: 0
    });
    
    const response = await client.get('/timeout');

    expect(response.ok).toBe(false);
    expect(response.error).toContain('timed out');
  });
});
