#!/usr/bin/env node

/**
 * PortBand MCP Server
 * Standalone stdio MCP server for Claude Code integration.
 * Runs independently from the Electron app with its own lsof scanning + enrichment.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { exec } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'

// ── Port scanning (inlined from port-scanner.js) ──

const COMMAND_ICON_MAP = {
  node: 'nodedotjs',
  redis: 'redis',
  postgres: 'postgresql',
  mysql: 'mysql',
  nginx: 'nginx',
  docker: 'docker',
  python: 'python',
  uvicorn: 'python',
  gunicorn: 'python',
  java: 'openjdk',
  httpd: 'apache',
  mongod: 'mongodb',
  code: 'visualstudiocode',
  ruby: 'ruby',
  php: 'php',
  go: 'go',
  rust: 'rust',
  cargo: 'rust',
  beam: 'elixir'
}

const PORT_ICON_MAP = {
  3000: 'nodedotjs',
  5173: 'vite',
  5174: 'vite',
  8080: 'nginx',
  5432: 'postgresql',
  6379: 'redis',
  3306: 'mysql',
  27017: 'mongodb',
  8000: 'python',
  4200: 'nodedotjs',
  8888: 'python'
}

function detectService(command, port) {
  const cmd = command.toLowerCase()
  for (const [key, icon] of Object.entries(COMMAND_ICON_MAP)) {
    if (cmd.includes(key)) return icon
  }
  return PORT_ICON_MAP[port] || 'terminal'
}

function scanPorts() {
  return new Promise((resolve, reject) => {
    exec('lsof -iTCP -sTCP:LISTEN -nP', (err, stdout) => {
      if (err && err.code !== 1) {
        if (err.killed || err.signal) return reject(err)
        return resolve([])
      }

      const lines = (stdout || '').trim().split('\n').slice(1)
      const ports = []
      const seen = new Set()

      for (const line of lines) {
        const parts = line.split(/\s+/)
        if (parts.length < 9) continue

        const command = parts[0]
        const pid = parseInt(parts[1])
        const nameField = parts[8] || ''
        const portMatch = nameField.match(/:(\d+)$/)
        if (!portMatch) continue

        const port = parseInt(portMatch[1])
        const key = `${pid}:${port}`
        if (seen.has(key)) continue
        seen.add(key)

        ports.push({
          id: key,
          name: command,
          port,
          pid,
          iconKey: detectService(command, port)
        })
      }

      resolve(ports.sort((a, b) => a.port - b.port))
    })
  })
}

// ── Service enrichment (inlined from service-enricher.js) ──

const EXEC_TIMEOUT = 3000

function execAsync(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: EXEC_TIMEOUT }, (err, stdout) => {
      resolve(err ? '' : (stdout || '').trim())
    })
  })
}

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
  const allDeps = { ...pkgData.dependencies, ...pkgData.devDependencies }
  for (const [dep, framework, iconKey] of FRAMEWORK_MAP) {
    if (allDeps[dep]) return { framework, iconKey }
  }
  return null
}

function extractRuntimeVersion(fullCommand) {
  if (!fullCommand) return null
  const match = fullCommand.match(/\/(?:node|python|ruby|go)\/([0-9]+\.[0-9]+\.[0-9]+)\//)
  if (match) return `v${match[1]}`
  return null
}

async function enrichPort(portEntry) {
  const { pid } = portEntry
  const fullCommand = await execAsync(`ps -p ${pid} -o command=`)
  if (!fullCommand) return portEntry

  const cwdOutput = await execAsync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null`)
  let cwd = null
  if (cwdOutput) {
    for (const line of cwdOutput.split('\n')) {
      if (line.startsWith('n') && line.length > 1) {
        cwd = line.slice(1)
        break
      }
    }
  }

  let projectName = null
  let framework = null
  let iconKey = null

  if (cwd) {
    const pkg = findPackageJson(cwd)
    if (pkg) {
      projectName = pkg.data.name || null
      const fw = detectFramework(pkg.data)
      if (fw) {
        framework = fw.framework
        iconKey = fw.iconKey
      }
    }
    if (!projectName) projectName = path.basename(cwd)
  }

  return {
    ...portEntry,
    projectName,
    framework,
    fullCommand,
    cwd,
    runtimeVersion: extractRuntimeVersion(fullCommand),
    iconKey: iconKey || portEntry.iconKey
  }
}

async function scanAndEnrich() {
  const ports = await scanPorts()
  const enriched = await Promise.all(ports.map(enrichPort))
  return enriched
}

// ── MCP Server ──

const server = new McpServer({
  name: 'portband',
  version: '1.0.0'
})

// Tool: list_ports
server.tool(
  'list_ports',
  'List all TCP listening ports with optional service enrichment (project name, framework, cwd)',
  {
    includeEnrichment: {
      type: 'boolean',
      description: 'Include enriched service info (project name, framework, cwd). Slower but more detailed.',
      default: true
    }
  },
  async ({ includeEnrichment = true }) => {
    try {
      const ports = includeEnrichment ? await scanAndEnrich() : await scanPorts()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(ports, null, 2)
          }
        ]
      }
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error scanning ports: ${err.message}` }],
        isError: true
      }
    }
  }
)

// Tool: get_port_details
server.tool(
  'get_port_details',
  'Get detailed info about a specific port or PID',
  {
    port: {
      type: 'number',
      description: 'Port number to look up'
    },
    pid: {
      type: 'number',
      description: 'PID to look up'
    }
  },
  async ({ port, pid }) => {
    if (port === undefined && pid === undefined) {
      return {
        content: [{ type: 'text', text: 'Provide either port or pid parameter' }],
        isError: true
      }
    }
    try {
      const ports = await scanAndEnrich()
      const matches = ports.filter((p) => {
        if (port !== undefined && p.port === port) return true
        if (pid !== undefined && p.pid === pid) return true
        return false
      })

      if (matches.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: port !== undefined
                ? `No process listening on port ${port}`
                : `PID ${pid} is not listening on any port`
            }
          ]
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }]
      }
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true
      }
    }
  }
)

// Tool: kill_process
server.tool(
  'kill_process',
  'Kill a process by PID or port number. Sends SIGTERM first, then SIGKILL after 2 seconds if still alive.',
  {
    pid: {
      type: 'number',
      description: 'PID of the process to kill'
    },
    port: {
      type: 'number',
      description: 'Port number — will find and kill the process listening on this port'
    },
    signal: {
      type: 'string',
      description: 'Signal to send (default: SIGTERM). Use SIGKILL for force kill.',
      default: 'SIGTERM'
    }
  },
  async ({ pid, port, signal = 'SIGTERM' }) => {
    try {
      let targetPid = pid
      let targetPort = port

      if (targetPid === undefined && targetPort === undefined) {
        return {
          content: [{ type: 'text', text: 'Provide either pid or port parameter' }],
          isError: true
        }
      }

      // Resolve port to PID if needed
      if (targetPid === undefined) {
        const ports = await scanPorts()
        const match = ports.find((p) => p.port === targetPort)
        if (!match) {
          return {
            content: [{ type: 'text', text: `No process found listening on port ${targetPort}` }],
            isError: true
          }
        }
        targetPid = match.pid
        targetPort = match.port
      }

      // Send signal
      const sig = signal === 'SIGKILL' ? 'SIGKILL' : 'SIGTERM'
      try {
        process.kill(targetPid, sig)
      } catch (e) {
        if (e.code === 'ESRCH') {
          return {
            content: [{ type: 'text', text: `Process ${targetPid} not found (already dead?)` }]
          }
        }
        throw e
      }

      // If SIGTERM, wait and escalate to SIGKILL if still alive
      if (sig === 'SIGTERM') {
        await new Promise((r) => setTimeout(r, 2000))
        try {
          process.kill(targetPid, 0) // Check if alive
          process.kill(targetPid, 'SIGKILL')
          return {
            content: [
              {
                type: 'text',
                text: `Process ${targetPid}${targetPort ? ` (port ${targetPort})` : ''} did not respond to SIGTERM, sent SIGKILL`
              }
            ]
          }
        } catch {
          // Already dead — success
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Successfully killed process ${targetPid}${targetPort ? ` (port ${targetPort})` : ''} with ${sig}`
          }
        ]
      }
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error killing process: ${err.message}` }],
        isError: true
      }
    }
  }
)

// Tool: find_service
server.tool(
  'find_service',
  'Search for services by name, project name, framework, or port number',
  {
    query: {
      type: 'string',
      description:
        'Search query — matches against service name, project name, framework, port number, and cwd'
    }
  },
  async ({ query }) => {
    try {
      const ports = await scanAndEnrich()
      const q = query.toLowerCase()

      const matches = ports.filter((p) => {
        if (String(p.port).includes(q)) return true
        if (p.name?.toLowerCase().includes(q)) return true
        if (p.projectName?.toLowerCase().includes(q)) return true
        if (p.framework?.toLowerCase().includes(q)) return true
        if (p.cwd?.toLowerCase().includes(q)) return true
        if (p.fullCommand?.toLowerCase().includes(q)) return true
        return false
      })

      if (matches.length === 0) {
        return {
          content: [{ type: 'text', text: `No services matching "${query}"` }]
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }]
      }
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true
      }
    }
  }
)

// Start server
const transport = new StdioServerTransport()
await server.connect(transport)
