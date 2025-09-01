import { Capacitor } from "@capacitor/core"
import { performanceMonitor } from "./performance"
import { errorTracker } from "./error-tracking"

export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

export class AppTester {
  private results: TestResult[] = []

  async runBasicTests(): Promise<TestResult[]> {
    console.log("[v0] Running basic app tests...")

    const tests = [
      { name: "Platform Detection", test: this.testPlatformDetection },
      { name: "Local Storage", test: this.testLocalStorage },
      { name: "Network Connectivity", test: this.testNetworkConnectivity },
      { name: "Performance Monitoring", test: this.testPerformanceMonitoring },
      { name: "Error Tracking", test: this.testErrorTracking },
    ]

    this.results = []

    for (const { name, test } of tests) {
      try {
        const startTime = performance.now()
        await test.call(this)
        const duration = performance.now() - startTime

        this.results.push({
          name,
          passed: true,
          duration,
        })
        console.log(`[v0] ✅ ${name} test passed (${duration.toFixed(2)}ms)`)
      } catch (error) {
        const duration = performance.now()
        this.results.push({
          name,
          passed: false,
          duration,
          error: error instanceof Error ? error.message : String(error),
        })
        console.error(`[v0] ❌ ${name} test failed:`, error)
      }
    }

    return this.results
  }

  private async testPlatformDetection(): Promise<void> {
    const platform = Capacitor.getPlatform()
    const isNative = Capacitor.isNativePlatform()

    if (!platform) {
      throw new Error("Platform detection failed")
    }

    console.log(`[v0] Platform: ${platform}, Native: ${isNative}`)
  }

  private async testLocalStorage(): Promise<void> {
    const testKey = "test-key"
    const testValue = "test-value"

    localStorage.setItem(testKey, testValue)
    const retrieved = localStorage.getItem(testKey)

    if (retrieved !== testValue) {
      throw new Error("Local storage test failed")
    }

    localStorage.removeItem(testKey)
  }

  private async testNetworkConnectivity(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error("No network connectivity")
    }

    // Test a simple fetch to verify network
    try {
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      })
      if (!response.ok && response.status !== 404) {
        throw new Error(`Network test failed with status: ${response.status}`)
      }
    } catch (error) {
      // If health endpoint doesn't exist, that's okay for this test
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw error
      }
    }
  }

  private async testPerformanceMonitoring(): Promise<void> {
    performanceMonitor.startMeasurement("test-measurement")
    await new Promise((resolve) => setTimeout(resolve, 10))
    const duration = performanceMonitor.endMeasurement("test-measurement")

    if (duration < 0) {
      throw new Error("Performance monitoring test failed")
    }
  }

  private async testErrorTracking(): Promise<void> {
    const initialErrorCount = errorTracker.getErrors().length

    errorTracker.captureError({
      message: "Test error",
      timestamp: Date.now(),
      platform: Capacitor.getPlatform(),
    })

    const newErrorCount = errorTracker.getErrors().length

    if (newErrorCount !== initialErrorCount + 1) {
      throw new Error("Error tracking test failed")
    }
  }

  getResults(): TestResult[] {
    return [...this.results]
  }

  generateReport(): string {
    const passed = this.results.filter((r) => r.passed).length
    const total = this.results.length
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0"

    let report = `\n=== App Test Report ===\n`
    report += `Pass Rate: ${passed}/${total} (${passRate}%)\n\n`

    this.results.forEach((result) => {
      const status = result.passed ? "✅" : "❌"
      report += `${status} ${result.name} (${result.duration.toFixed(2)}ms)\n`
      if (result.error) {
        report += `   Error: ${result.error}\n`
      }
    })

    return report
  }
}

export const appTester = new AppTester()
