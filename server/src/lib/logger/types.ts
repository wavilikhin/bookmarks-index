export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: string
  data?: Record<string, unknown>
  error?: Error
}

export interface Transport {
  name: string
  log(entry: LogEntry): void | Promise<void>
}

export interface LoggerConfig {
  level: LogLevel
  transports: Transport[]
}
