/**
 * Structured Logger — Centralised logging for Votera AI.
 *
 * Replaces ad-hoc `console.log/warn/error` calls with a structured,
 * module-aware logging utility. Enables consistent log formatting,
 * level filtering, and future integration with cloud logging services.
 *
 * @module utils/logger
 */

/** Log severity levels. */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Structured logger for Votera AI.
 *
 * All log output goes through this class, ensuring consistent formatting
 * and easy replacement with a cloud logging backend (e.g., Cloud Logging).
 */
export class Logger {
  /** Current minimum log level. */
  private static minLevel: LogLevel = LogLevel.DEBUG;

  /** Numeric priority of each log level. */
  private static readonly LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  /**
   * Set the minimum log level.
   *
   * @param level - Minimum severity to output.
   */
  static setLevel(level: LogLevel): void {
    Logger.minLevel = level;
  }

  /**
   * Log a debug message.
   *
   * @param module - Source module name.
   * @param message - Log message.
   * @param context - Optional structured context data.
   */
  static debug(module: string, message: string, context?: unknown): void {
    Logger.log(LogLevel.DEBUG, module, message, context);
  }

  /**
   * Log an informational message.
   *
   * @param module - Source module name.
   * @param message - Log message.
   * @param context - Optional structured context data.
   */
  static info(module: string, message: string, context?: unknown): void {
    Logger.log(LogLevel.INFO, module, message, context);
  }

  /**
   * Log a warning message.
   *
   * @param module - Source module name.
   * @param message - Log message.
   * @param context - Optional structured context data.
   */
  static warn(module: string, message: string, context?: unknown): void {
    Logger.log(LogLevel.WARN, module, message, context);
  }

  /**
   * Log an error message.
   *
   * @param module - Source module name.
   * @param message - Log message.
   * @param error - Optional error object or context data.
   */
  static error(module: string, message: string, error?: unknown): void {
    Logger.log(LogLevel.ERROR, module, message, error);
  }

  /**
   * Internal log dispatcher.
   *
   * @param level - Severity level.
   * @param module - Source module.
   * @param message - Log message.
   * @param context - Optional context data.
   */
  private static log(level: LogLevel, module: string, message: string, context?: unknown): void {
    if (Logger.LEVEL_PRIORITY[level] < Logger.LEVEL_PRIORITY[Logger.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${module}]`;

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(prefix, message, ...(context !== undefined ? [context] : []));
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(prefix, message, ...(context !== undefined ? [context] : []));
        break;
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(prefix, message, ...(context !== undefined ? [context] : []));
        break;
    }
  }
}
