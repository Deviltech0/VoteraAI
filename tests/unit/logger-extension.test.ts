/**
 * Logger Extension Tests — Coverage for Warn and Error paths.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, LogLevel } from '../../src/utils/logger';

describe('Logger — Extension Coverage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs warnings to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Logger.setLevel(LogLevel.DEBUG);
    Logger.warn('test-module', 'warning message');
    expect(spy).toHaveBeenCalled();
  });

  it('logs errors to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.setLevel(LogLevel.DEBUG);
    Logger.error('test-module', 'error message', new Error('fail'));
    expect(spy).toHaveBeenCalled();
  });

  it('respects log level for warnings', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Logger.setLevel(LogLevel.ERROR);
    Logger.warn('test-module', 'this should be ignored');
    expect(spy).not.toHaveBeenCalled();
  });

  it('handles undefined context in logs', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    Logger.setLevel(LogLevel.DEBUG);
    Logger.info('test-module', 'no context');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'), 'no context');
  });
});
