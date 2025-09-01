import { Capacitor } from "@capacitor/core"

export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  networkLatency?: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private startTime = 0

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startMeasurement(label: string): void {
    this.startTime = performance.now()
    console.log(`[v0] Performance: Starting measurement for ${label}`)
  }

  endMeasurement(label: string): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime

    console.log(`[v0] Performance: ${label} took ${duration.toFixed(2)}ms`)

    if (Capacitor.isNativePlatform()) {
      this.logToNativeConsole(`Performance: ${label} - ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startMeasurement(label)
      try {
        const result = await fn()
        this.endMeasurement(label)
        resolve(result)
      } catch (error) {
        this.endMeasurement(`${label} (failed)`)
        reject(error)
      }
    })
  }

  private logToNativeConsole(message: string): void {
    if (Capacitor.isNativePlatform()) {
      // Native console logging for debugging
      console.log(`[Native] ${message}`)
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  clearMetrics(): void {
    this.metrics = []
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
