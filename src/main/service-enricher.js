import { exec } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'

// PID -> enrichment cache
const pidCache = new Map()
// cwd -> package.json data cache
const pkgCache = new Map()

// Concurrency limiter
let activeOps = 0
const MAX_CONCURRENT = 5
const EXEC_TIMEOUT = 3000

function execAsync(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: EXEC_TIMEOUT }, (err, stdout) => {
      resolve(err ? '' : (stdout || '').trim())
    })
  })
}

// Framework detection from package.json dependencies
const FRAMEWORK_MAP = [
  ['next', 'Next.js', 'nextdotjs'],
  ['nuxt', 'Nuxt', 'nuxtdotjs'],
  ['@angular/core', 'Angular', 'angular'],
  ['@nestjs/core', 'NestJS', 'nestjs'],
  ['vue', 'Vue.js', 'vuedotjs'],
  ['vite', 'Vite', 'vite'],
  ['fastify', 'Fastify', 'fastify'],
  ['express', 'Express', 'express'],
  ['koa', 'Koa', 'nodedotjs'],
  ['hapi', 'Hapi', 'nodedotjs'],
  ['remix', 'Remix', 'nodedotjs'],
  ['gatsby', 'Gatsby', 'nodedotjs'],
  ['svelte', 'Svelte', 'nodedotjs'],
  ['astro', 'Astro', 'nodedotjs']
]

function findPackageJson(dir) {
  if (!dir || dir === '/' || dir === '.') return null
  try {
    const pkgPath = path.join(dir, 'package.json')
    const data = readFileSync(pkgPath, 'utf-8')
    return { path: dir, data: JSON.parse(data) }
  } catch {
    return findPackageJson(path.dirname(dir))
  }
}

function detectFramework(pkgData) {
  if (!pkgData) return null
  const allDeps = {
    ...pkgData.dependencies,
    ...pkgData.devDependencies
  }
  for (const [dep, framework, iconKey] of FRAMEWORK_MAP) {
    if (allDeps[dep]) return { framework, iconKey }
  }
  return null
}

function extractRuntimeVersion(fullCommand) {
  if (!fullCommand) return null
  // Match patterns like /node/22.11.0/ or /python/3.12.0/
  const match = fullCommand.match(/\/(?:node|python|ruby|go)\/([0-9]+\.[0-9]+\.[0-9]+)\//)
  if (match) return `v${match[1]}`
  return null
}

async function enrichPid(pid) {
  // Get full command line
  const fullCommand = await execAsync(`ps -p ${pid} -o command=`)
  if (!fullCommand) return null

  // Get working directory
  const cwdOutput = await execAsync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null`)
  let cwd = null
  if (cwdOutput) {
    const lines = cwdOutput.split('\n')
    for (const line of lines) {
      if (line.startsWith('n') && line.length > 1) {
        cwd = line.slice(1)
        break
      }
    }
  }

  // Find package.json (with cwd cache)
  let pkgData = null
  let projectName = null
  let framework = null
  let iconKey = null

  if (cwd) {
    if (pkgCache.has(cwd)) {
      const cached = pkgCache.get(cwd)
      pkgData = cached?.data
      if (cached) {
        projectName = pkgData?.name || null
        const fw = detectFramework(pkgData)
        if (fw) {
          framework = fw.framework
          iconKey = fw.iconKey
        }
      }
    } else {
      const pkg = findPackageJson(cwd)
      pkgCache.set(cwd, pkg)
      if (pkg) {
        pkgData = pkg.data
        projectName = pkgData.name || null
        const fw = detectFramework(pkgData)
        if (fw) {
          framework = fw.framework
          iconKey = fw.iconKey
        }
      }
    }
  }

  // If no projectName from package.json, use cwd directory name
  if (!projectName && cwd) {
    projectName = path.basename(cwd)
  }

  const runtimeVersion = extractRuntimeVersion(fullCommand)

  return {
    projectName,
    framework,
    fullCommand,
    cwd,
    runtimeVersion,
    ...(iconKey ? { iconKey } : {})
  }
}

export async function enrichPorts(ports) {
  const currentPids = new Set(ports.map((p) => p.pid))

  // Purge stale entries
  for (const pid of pidCache.keys()) {
    if (!currentPids.has(pid)) pidCache.delete(pid)
  }

  // Enrich new PIDs (with concurrency limit)
  const toEnrich = ports.filter((p) => !pidCache.has(p.pid))
  const queue = [...toEnrich]

  async function processQueue() {
    while (queue.length > 0) {
      if (activeOps >= MAX_CONCURRENT) {
        await new Promise((r) => setTimeout(r, 50))
        continue
      }
      const port = queue.shift()
      if (!port) break
      activeOps++
      try {
        const result = await enrichPid(port.pid)
        if (result) pidCache.set(port.pid, result)
      } catch {
        // Skip failed enrichment
      } finally {
        activeOps--
      }
    }
  }

  // Run up to MAX_CONCURRENT workers
  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT, toEnrich.length) },
    () => processQueue()
  )
  await Promise.all(workers)

  // Merge enrichment into port data
  return ports.map((p) => {
    const enrichment = pidCache.get(p.pid)
    if (!enrichment) return p
    return {
      ...p,
      projectName: enrichment.projectName,
      framework: enrichment.framework,
      fullCommand: enrichment.fullCommand,
      cwd: enrichment.cwd,
      runtimeVersion: enrichment.runtimeVersion,
      // Upgrade iconKey if framework detected
      iconKey: enrichment.iconKey || p.iconKey
    }
  })
}
