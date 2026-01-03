import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Transport, LogEntry, LogLevel } from '../types'
import { LOG_LEVELS } from '../types'

export interface FileTransportOptions {
  filePath: string
  minLevel?: LogLevel // Only log entries at or above this level
}

interface JsonLogEntry {
  level: string
  message: string
  timestamp: string
  context?: string
  data?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

export class FileTransport implements Transport {
  name: string
  private filePath: string
  private minLevel?: LogLevel
  private writer: ReturnType<typeof Bun.file.prototype.writer> | null = null
  private initPromise?: Promise<void>

  constructor(options: FileTransportOptions) {
    this.filePath = options.filePath
    this.minLevel = options.minLevel
    this.name = `file:${options.filePath}`
  }

  private async ensureWriter(): Promise<ReturnType<typeof Bun.file.prototype.writer>> {
    if (this.writer) return this.writer

    if (this.initPromise) {
      await this.initPromise
      return this.writer!
    }

    this.initPromise = (async () => {
      // Ensure directory exists
      const dir = dirname(this.filePath)
      await mkdir(dir, { recursive: true })

      // Create persistent writer with append mode
      this.writer = Bun.file(this.filePath).writer()
    })()

    await this.initPromise
    return this.writer!
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.minLevel) return true
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private formatEntry(entry: LogEntry): JsonLogEntry {
    const json: JsonLogEntry = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp.toISOString()
    }

    if (entry.context) {
      json.context = entry.context
    }

    if (entry.data && Object.keys(entry.data).length > 0) {
      json.data = entry.data
    }

    if (entry.error) {
      json.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      }
    }

    return json
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return

    const writer = await this.ensureWriter()
    const json = this.formatEntry(entry)
    const line = JSON.stringify(json) + '\n'

    writer.write(line)
    // Flush immediately for error logs to ensure they're persisted
    if (entry.level === 'error') {
      await writer.flush()
    }
  }

  /**
   * Flush any buffered data and close the writer.
   * Call this during graceful shutdown.
   */
  async close(): Promise<void> {
    if (this.writer) {
      await this.writer.flush()
      await this.writer.end()
      this.writer = null
    }
  }
}
