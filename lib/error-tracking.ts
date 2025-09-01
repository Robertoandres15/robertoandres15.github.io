import { Capacitor } from "@capacitor/core"

export interface ErrorReport {
  message: string
  stack?: string
  timestamp: number
  platform: string
  userAgent?: string
  url?: string
  userId?: string
}

export class ErrorTracker {
  private static instance: ErrorTracker
  private errors: ErrorReport[] = []
  private maxErrors = 50

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
      ErrorTracker.instance.initialize()
    }
    return ErrorTracker.instance
  }

  private initialize(): void {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        platform: Capacitor.getPlatform(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        platform: Capacitor.getPlatform(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    })
  }

  captureError(error: Partial<ErrorReport>): void {
    const errorReport: ErrorReport = {
      message: error.message || "Unknown error",
      stack: error.stack,
      timestamp: error.timestamp || Date.now(),
      platform: error.platform || Capacitor.getPlatform(),
      userAgent: error.userAgent || navigator.userAgent,
      url: error.url || window.location.href,
      userId: error.userId,
    }

    this.errors.push(errorReport)

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    console.error("[v0] Error captured:", errorReport)

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === "production") {
      this.sendToErrorService(errorReport)
    }
  }

  private async sendToErrorService(error: ErrorReport): Promise<void> {
    try {
      // Replace with your actual error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // })
      console.log("[v0] Error would be sent to tracking service:", error)
    } catch (e) {
      console.error("[v0] Failed to send error to tracking service:", e)
    }
  }

  getErrors(): ErrorReport[] {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }
}

export const errorTracker = ErrorTracker.getInstance()
