import type { LogLevel, LogEntry, Transport, LoggerConfig } from './types'
import { LOG_LEVELS } from './types'

export class Logger {
  private level: LogLevel
  private transports: Transport[]
  private context?: string

  constructor(config: LoggerConfig, context?: string) {
    this.level = config.level
    this.transports = config.transports
    this.context = context
  }

  /**
   * Create a child logger with a specific context.
   * Child loggers have their own copy of transports array, so adding/removing
   * transports on a child does not affect the parent or siblings.
   */
  child(context: string): Logger {
    // Clone transports array to isolate child from parent
    const child = new Logger({ level: this.level, transports: [...this.transports] }, context)
    return child
  }

  /**
   * Add a transport at runtime (useful for adding Sentry, etc.)
   * Note: Only affects this logger instance, not parent or child loggers.
   */
  addTransport(transport: Transport): void {
    this.transports.push(transport)
  }

  /**
   * Remove a transport by name
   */
  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name)
  }

  /**
   * Update log level at runtime
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level]
  }

  private async dispatch(entry: LogEntry): Promise<void> {
    const promises = this.transports.map(async (transport) => {
      try {
        await transport.log(entry)
      } catch (err) {
        // Fallback to console if transport fails
        console.error(`[logger] Transport "${transport.name}" failed:`, err)
      }
    })
    await Promise.all(promises)
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      data,
      error
    }

    // Fire and forget - don't block on logging
    this.dispatch(entry).catch(() => {
      // Silently ignore dispatch errors
    })
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data)
  }

  /**
   * Log an error message with optional Error object and data
   *
   * @example
   * // With Error object
   * logger.error('Failed to connect', error)
   * logger.error('Failed to connect', error, { host: 'localhost' })
   *
   * // With just data (no Error)
   * logger.error('Invalid state', { state: 'corrupted' })
   */
  error(message: string, errorOrData?: Error | Record<string, unknown>, data?: Record<string, unknown>): void {
    if (errorOrData instanceof Error) {
      this.log('error', message, data, errorOrData)
    } else {
      // errorOrData is treated as data when not an Error
      this.log('error', message, errorOrData)
    }
  }
}
