import { Logger } from './logger'
import { ConsoleTransport } from './transports/console'
import { FileTransport } from './transports/file'
import type { LogLevel, Transport } from './types'

// Re-export types for consumers
export type { LogLevel, LogEntry, Transport, LoggerConfig } from './types'
export { Logger } from './logger'
export { ConsoleTransport } from './transports/console'
export { FileTransport } from './transports/file'

/**
 * Get log level from environment variable
 * Defaults to 'info' in production, 'debug' in development
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase()

  if (envLevel && ['debug', 'info', 'warn', 'error'].includes(envLevel)) {
    return envLevel as LogLevel
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

/**
 * Get log directory from environment variable
 * Defaults to './logs' in development, '/app/logs' in production
 */
function getLogDir(): string {
  return process.env.LOG_DIR || (process.env.NODE_ENV === 'production' ? '/app/logs' : './logs')
}

/**
 * Check if file logging is enabled
 * Defaults to true in production, false in development
 */
function isFileLoggingEnabled(): boolean {
  const envValue = process.env.LOG_TO_FILE?.toLowerCase()

  if (envValue === 'true' || envValue === '1') return true
  if (envValue === 'false' || envValue === '0') return false

  return process.env.NODE_ENV === 'production'
}

/**
 * Create the default logger instance with environment-based configuration
 */
function createLogger(): Logger {
  const level = getLogLevel()
  const transports: Transport[] = []

  // Always add console transport
  transports.push(
    new ConsoleTransport({
      colorize: process.env.NODE_ENV !== 'production',
      showIcons: process.env.NODE_ENV !== 'production'
    })
  )

  // Add file transports if enabled
  if (isFileLoggingEnabled()) {
    const logDir = getLogDir()

    // All logs file
    transports.push(
      new FileTransport({
        filePath: `${logDir}/app.log`
      })
    )

    // Errors only file
    transports.push(
      new FileTransport({
        filePath: `${logDir}/error.log`,
        minLevel: 'error'
      })
    )
  }

  return new Logger({ level, transports })
}

/**
 * The singleton logger instance
 * Use this for general logging throughout the application
 *
 * @example
 * ```ts
 * import { logger } from './lib/logger'
 *
 * logger.info('Server started', { port: 3000 })
 * logger.error('Failed to connect', error, { host: 'localhost' })
 *
 * // Create a child logger with context
 * const dbLogger = logger.child('database')
 * dbLogger.info('Connected to database')
 * ```
 */
export const logger = createLogger()

/**
 * Example of how to add Sentry transport later:
 *
 * ```ts
 * import * as Sentry from '@sentry/node'
 * import { logger, Transport, LogEntry } from './lib/logger'
 *
 * class SentryTransport implements Transport {
 *   name = 'sentry'
 *
 *   log(entry: LogEntry): void {
 *     if (entry.level === 'error') {
 *       if (entry.error) {
 *         Sentry.captureException(entry.error, {
 *           extra: { ...entry.data, context: entry.context }
 *         })
 *       } else {
 *         Sentry.captureMessage(entry.message, {
 *           level: 'error',
 *           extra: { ...entry.data, context: entry.context }
 *         })
 *       }
 *     }
 *   }
 * }
 *
 * // Add Sentry transport at runtime
 * logger.addTransport(new SentryTransport())
 * ```
 */
