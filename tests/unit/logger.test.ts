/**
 * Logger Utility Tests
 *
 * Covers all log levels, level filtering, structured formatting,
 * and context data handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from '../../src/utils/logger';

describe('Logger', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('Logger.info calls console.info', () => {
      Logger.info('test-module', 'test message');
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('Logger.warn calls console.warn', () => {
      Logger.warn('test-module', 'warning message');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('Logger.error calls console.error', () => {
      Logger.error('test-module', 'error message');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('Logger.debug calls console.info', () => {
      Logger.debug('test-module', 'debug message');
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('level filtering', () => {
    it('suppresses debug when min level is INFO', () => {
      Logger.setLevel(LogLevel.INFO);
      Logger.debug('mod', 'should not appear');
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('suppresses info when min level is WARN', () => {
      Logger.setLevel(LogLevel.WARN);
      Logger.info('mod', 'should not appear');
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('suppresses warn when min level is ERROR', () => {
      Logger.setLevel(LogLevel.ERROR);
      Logger.warn('mod', 'should not appear');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('allows error at ERROR level', () => {
      Logger.setLevel(LogLevel.ERROR);
      Logger.error('mod', 'should appear');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('structured output', () => {
    it('includes module name in prefix', () => {
      Logger.info('my-module', 'hello');
      const prefix = infoSpy.mock.calls[0]![0] as string;
      expect(prefix).toContain('[my-module]');
    });

    it('includes level in prefix', () => {
      Logger.warn('mod', 'test');
      const prefix = warnSpy.mock.calls[0]![0] as string;
      expect(prefix).toContain('[WARN]');
    });

    it('includes ISO timestamp in prefix', () => {
      Logger.info('mod', 'test');
      const prefix = infoSpy.mock.calls[0]![0] as string;
      // Should contain ISO-like date pattern
      expect(prefix).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });

    it('passes context as additional argument', () => {
      const ctx = { key: 'value' };
      Logger.info('mod', 'test', ctx);
      expect(infoSpy).toHaveBeenCalledWith(
        expect.any(String),
        'test',
        ctx,
      );
    });

    it('omits context argument when not provided', () => {
      Logger.info('mod', 'test');
      expect(infoSpy).toHaveBeenCalledWith(
        expect.any(String),
        'test',
      );
    });
  });

  describe('LogLevel enum', () => {
    it('has all four levels', () => {
      expect(LogLevel.DEBUG).toBe('DEBUG');
      expect(LogLevel.INFO).toBe('INFO');
      expect(LogLevel.WARN).toBe('WARN');
      expect(LogLevel.ERROR).toBe('ERROR');
    });
  });
});
