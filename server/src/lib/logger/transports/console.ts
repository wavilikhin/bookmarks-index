import type { Transport, LogEntry, LogLevel } from '../types'

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m' // Red
}

const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: '✨',
  warn: '⚠️',
  error: '❌'
}

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'

function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '')
}

function formatData(data: Record<string, unknown>, indent = 2): string {
  const entries = Object.entries(data)
  if (entries.length === 0) return ''

  const lines = entries.map(([key, value]) => {
    const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    return `${' '.repeat(indent)}${DIM}${key}:${RESET} ${formattedValue}`
  })

  return '\n' + lines.join('\n')
}

function formatError(error: Error): string {
  const lines = [`\n  ${DIM}name:${RESET} ${error.name}`, `  ${DIM}message:${RESET} ${error.message}`]

  if (error.stack) {
    const stackLines = error.stack
      .split('\n')
      .slice(1, 11) // First 10 stack frames
      .map((line) => `    ${DIM}${line.trim()}${RESET}`)
      .join('\n')
    lines.push(`  ${DIM}stack:${RESET}\n${stackLines}`)
  }

  return lines.join('\n')
}

export interface ConsoleTransportOptions {
  colorize?: boolean
  showIcons?: boolean
}

export class ConsoleTransport implements Transport {
  name = 'console'
  private colorize: boolean
  private showIcons: boolean

  constructor(options: ConsoleTransportOptions = {}) {
    this.colorize = options.colorize ?? true
    this.showIcons = options.showIcons ?? true
  }

  log(entry: LogEntry): void {
    const { level, message, timestamp, context, data, error } = entry

    const color = this.colorize ? LEVEL_COLORS[level] : ''
    const reset = this.colorize ? RESET : ''
    const dim = this.colorize ? DIM : ''
    const bold = this.colorize ? BOLD : ''
    const icon = this.showIcons ? LEVEL_ICONS[level] + ' ' : ''

    const levelStr = `${color}${bold}${level.toUpperCase().padEnd(5)}${reset}`
    const timeStr = `${dim}${formatTimestamp(timestamp)}${reset}`
    const contextStr = context ? `${dim}[${context}]${reset} ` : ''

    let output = `${icon}${levelStr} ${timeStr} ${contextStr}${message}`

    if (data && Object.keys(data).length > 0) {
      output += formatData(data)
    }

    if (error) {
      output += formatError(error)
    }

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(output)
        break
      case 'info':
        console.info(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
        console.error(output)
        break
    }
  }
}
