import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from '../../src/utils/logger';

describe('Logger Coverage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log warn without context', () => {
    Logger.warn('TestModule', 'test warning message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log warn with context', () => {
    Logger.warn('TestModule', 'test warning message', { key: 'value' });
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log error without context', () => {
    Logger.error('TestModule', 'test error message');
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should not log if level is higher', () => {
    Logger.setLevel(LogLevel.ERROR);
    Logger.warn('TestModule', 'this should not log');
    expect(console.warn).not.toHaveBeenCalled();
  });
});
