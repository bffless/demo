import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

interface ComparisonResult {
  name: string
  status: 'pass' | 'fail' | 'new' | 'missing'
  diffPixels?: number
  totalPixels?: number
  diffPercentage?: number
  diffPath?: string
}

interface ComparisonReport {
  timestamp: string
  baselineDir: string
  currentDir: string
  diffDir: string
  threshold: number
  results: ComparisonResult[]
  summary: {
    total: number
    passed: number
    failed: number
    new: number
    missing: number
  }
}

function parseArgs(): { baseline: string; current: string; diff: string; threshold: number; output: string } {
  const args = process.argv.slice(2)
  const config = {
    baseline: './screenshots-production',
    current: './screenshots',
    diff: './screenshot-diffs',
    threshold: 0.001, // 0.1% default tolerance
    output: './vrt-report.json',
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--baseline' && args[i + 1]) {
      config.baseline = args[++i]
    } else if (arg === '--current' && args[i + 1]) {
      config.current = args[++i]
    } else if (arg === '--diff' && args[i + 1]) {
      config.diff = args[++i]
    } else if (arg === '--threshold' && args[i + 1]) {
      config.threshold = parseFloat(args[++i])
    } else if (arg === '--output' && args[i + 1]) {
      config.output = args[++i]
    }
  }

  return config
}

function getScreenshots(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs.readdirSync(dir).filter((file) => file.endsWith('.png'))
}

function loadPNG(filePath: string): PNG {
  const buffer = fs.readFileSync(filePath)
  return PNG.sync.read(buffer)
}

function compareImages(
  baselinePath: string,
  currentPath: string,
  diffPath: string,
  threshold: number
): { diffPixels: number; totalPixels: number; diffPercentage: number } {
  const baseline = loadPNG(baselinePath)
  const current = loadPNG(currentPath)

  // Handle size mismatch
  if (baseline.width !== current.width || baseline.height !== current.height) {
    console.warn(
      `Size mismatch for ${path.basename(baselinePath)}: ` +
        `baseline ${baseline.width}x${baseline.height} vs current ${current.width}x${current.height}`
    )
    // Return 100% diff for size mismatch
    const totalPixels = Math.max(baseline.width * baseline.height, current.width * current.height)
    return { diffPixels: totalPixels, totalPixels, diffPercentage: 100 }
  }

  const { width, height } = baseline
  const diff = new PNG({ width, height })
  const totalPixels = width * height

  const diffPixels = pixelmatch(baseline.data, current.data, diff.data, width, height, {
    threshold: 0.1, // Per-pixel threshold for color difference
    includeAA: false, // Ignore anti-aliasing differences
  })

  const diffPercentage = (diffPixels / totalPixels) * 100

  // Save diff image if there are differences
  if (diffPixels > 0) {
    fs.mkdirSync(path.dirname(diffPath), { recursive: true })
    fs.writeFileSync(diffPath, PNG.sync.write(diff))
  }

  return { diffPixels, totalPixels, diffPercentage }
}

async function main(): Promise<void> {
  const config = parseArgs()

  console.log('Visual Regression Comparison')
  console.log('============================')
  console.log(`Baseline directory: ${config.baseline}`)
  console.log(`Current directory: ${config.current}`)
  console.log(`Diff directory: ${config.diff}`)
  console.log(`Threshold: ${config.threshold * 100}%`)
  console.log('')

  const baselineScreenshots = new Set(getScreenshots(config.baseline))
  const currentScreenshots = new Set(getScreenshots(config.current))

  const allScreenshots = new Set([...baselineScreenshots, ...currentScreenshots])

  const results: ComparisonResult[] = []

  // Ensure diff directory exists
  fs.mkdirSync(config.diff, { recursive: true })

  for (const screenshot of allScreenshots) {
    const baselinePath = path.join(config.baseline, screenshot)
    const currentPath = path.join(config.current, screenshot)
    const diffPath = path.join(config.diff, `diff-${screenshot}`)

    const inBaseline = baselineScreenshots.has(screenshot)
    const inCurrent = currentScreenshots.has(screenshot)

    if (!inBaseline && inCurrent) {
      // New screenshot
      results.push({
        name: screenshot,
        status: 'new',
      })
      console.log(`[NEW] ${screenshot}`)
    } else if (inBaseline && !inCurrent) {
      // Missing screenshot
      results.push({
        name: screenshot,
        status: 'missing',
      })
      console.log(`[MISSING] ${screenshot}`)
    } else {
      // Compare screenshots
      const { diffPixels, totalPixels, diffPercentage } = compareImages(
        baselinePath,
        currentPath,
        diffPath,
        config.threshold
      )

      const passed = diffPercentage <= config.threshold * 100

      results.push({
        name: screenshot,
        status: passed ? 'pass' : 'fail',
        diffPixels,
        totalPixels,
        diffPercentage,
        diffPath: passed ? undefined : diffPath,
      })

      const statusIcon = passed ? '✓' : '✗'
      console.log(`[${statusIcon}] ${screenshot}: ${diffPercentage.toFixed(3)}% diff`)
    }
  }

  // Generate summary
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    new: results.filter((r) => r.status === 'new').length,
    missing: results.filter((r) => r.status === 'missing').length,
  }

  const report: ComparisonReport = {
    timestamp: new Date().toISOString(),
    baselineDir: config.baseline,
    currentDir: config.current,
    diffDir: config.diff,
    threshold: config.threshold,
    results,
    summary,
  }

  // Write report
  fs.writeFileSync(config.output, JSON.stringify(report, null, 2))

  console.log('')
  console.log('Summary')
  console.log('-------')
  console.log(`Total: ${summary.total}`)
  console.log(`Passed: ${summary.passed}`)
  console.log(`Failed: ${summary.failed}`)
  console.log(`New: ${summary.new}`)
  console.log(`Missing: ${summary.missing}`)
  console.log('')
  console.log(`Report written to: ${config.output}`)

  // Exit with error code if there are failures
  if (summary.failed > 0 || summary.missing > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
