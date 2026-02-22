#!/usr/bin/env node

/**
 * PortParty MCP Server (stdio)
 * - Provides port tools to Claude Code via stdio transport
 * - Notifies the Electron app of connection status via HTTP
 * - Relays chat requests from the Electron app to Claude Code via MCP sampling
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { exec } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'
import { z } from 'zod'

// ── Port scanning ──

const COMMAND_ICON_MAP = {
  node: 'nodedotjs', redis: 'redis', postgres: 'postgresql', mysql: 'mysql',
  nginx: 'nginx', docker: 'docker', python: 'python', uvicorn: 'python',
  gunicorn: 'python', java: 'openjdk', httpd: 'apache', mongod: 'mongodb',
  code: 'visualstudiocode', ruby: 'ruby', php: 'php', go: 'go',
  rust: 'rust', cargo: 'rust', beam: 'elixir'
}

const PORT_ICON_MAP = {
  3000: 'nodedotjs', 5173: 'vite', 5174: 'vite', 8080: 'nginx',
  5432: 'postgresql', 6379: 'redis', 3306: 'mysql', 27017: 'mongodb',
  8000: 'python', 4200: 'nodedotjs', 8888: 'python'
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
        ports.push({ id: key, name: command, port, pid, iconKey: detectService(command, port) })
      }
      resolve(ports.sort((a, b) => a.port - b.port))
    })
  })
}

// ── Service enrichment ──

function execAsync(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 3000 }, (err, stdout) => resolve(err ? '' : (stdout || '').trim()))
  })
}

const FRAMEWORK_MAP = [
  ['next', 'Next.js', 'nextdotjs'], ['nuxt', 'Nuxt', 'nuxtdotjs'],
  ['@angular/core', 'Angular', 'angular'], ['@nestjs/core', 'NestJS', 'nestjs'],
  ['vue', 'Vue.js', 'vuedotjs'], ['vite', 'Vite', 'vite'],
  ['fastify', 'Fastify', 'fastify'], ['express', 'Express', 'express'],
  ['koa', 'Koa', 'nodedotjs'], ['hapi', 'Hapi', 'nodedotjs'],
  ['remix', 'Remix', 'nodedotjs'], ['gatsby', 'Gatsby', 'nodedotjs'],
  ['svelte', 'Svelte', 'nodedotjs'], ['astro', 'Astro', 'nodedotjs']
]

function findPackageJson(dir) {
  if (!dir || dir === '/' || dir === '.') return null
  try {
    const pkgPath = path.join(dir, 'package.json')
    const data = readFileSync(pkgPath, 'utf-8')
    return { path: dir, data: JSON.parse(data) }
  } catch { return findPackageJson(path.dirname(dir)) }
}

function detectFramework(pkgData) {
  if (!pkgData) return null
  const allDeps = { ...pkgData.dependencies, ...pkgData.devDependencies }
  for (const [dep, framework, iconKey] of FRAMEWORK_MAP) {
    if (allDeps[dep]) return { framework, iconKey }
  }
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
      if (line.startsWith('n') && line.length > 1) { cwd = line.slice(1); break }
    }
  }
  let projectName = null, framework = null, iconKey = null
  if (cwd) {
    const pkg = findPackageJson(cwd)
    if (pkg) {
      projectName = pkg.data.name || null
      const fw = detectFramework(pkg.data)
      if (fw) { framework = fw.framework; iconKey = fw.iconKey }
    }
    if (!projectName) projectName = path.basename(cwd)
  }
  const vMatch = fullCommand.match(/\/(?:node|python|ruby|go)\/([0-9]+\.[0-9]+\.[0-9]+)\//)
  return {
    ...portEntry, projectName, framework, fullCommand, cwd,
    runtimeVersion: vMatch ? `v${vMatch[1]}` : null,
    iconKey: iconKey || portEntry.iconKey
  }
}

async function scanAndEnrich() {
  const ports = await scanPorts()
  return Promise.all(ports.map(enrichPort))
}

// ── MCP Server ──

const server = new McpServer(
  { name: 'portparty', version: '1.0.0' },
  { capabilities: { sampling: {} } }
)

server.tool(
  'list_ports',
  'List all TCP listening ports with optional service enrichment (project name, framework, cwd)',
  {
    includeEnrichment: z.boolean().default(true)
      .describe('Include enriched service info (project name, framework, cwd). Slower but more detailed.')
  },
  async ({ includeEnrichment = true }) => {
    try {
      const ports = includeEnrichment ? await scanAndEnrich() : await scanPorts()
      return { content: [{ type: 'text', text: JSON.stringify(ports, null, 2) }] }
    } catch (err) {
      return { content: [{ type: 'text', text: `Error scanning ports: ${err.message}` }], isError: true }
    }
  }
)

server.tool(
  'get_port_details', 'Get detailed info about a specific port or PID',
  { port: z.number().optional().describe('Port number to look up'), pid: z.number().optional().describe('PID to look up') },
  async ({ port, pid }) => {
    if (port === undefined && pid === undefined) return { content: [{ type: 'text', text: 'Provide either port or pid parameter' }], isError: true }
    try {
      const ports = await scanAndEnrich()
      const matches = ports.filter((p) => (port !== undefined && p.port === port) || (pid !== undefined && p.pid === pid))
      if (matches.length === 0) return { content: [{ type: 'text', text: port !== undefined ? `No process listening on port ${port}` : `PID ${pid} is not listening on any port` }] }
      return { content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }] }
    } catch (err) { return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true } }
  }
)

server.tool(
  'kill_process',
  'Kill a process by PID or port number. Sends SIGTERM first, then SIGKILL after 2 seconds if still alive.',
  {
    pid: z.number().optional().describe('PID of the process to kill'),
    port: z.number().optional().describe('Port number — will find and kill the process listening on this port'),
    signal: z.string().default('SIGTERM').describe('Signal to send (default: SIGTERM). Use SIGKILL for force kill.')
  },
  async ({ pid, port, signal = 'SIGTERM' }) => {
    try {
      let targetPid = pid, targetPort = port
      if (targetPid === undefined && targetPort === undefined) return { content: [{ type: 'text', text: 'Provide either pid or port parameter' }], isError: true }
      if (targetPid === undefined) {
        const ports = await scanPorts()
        const match = ports.find((p) => p.port === targetPort)
        if (!match) return { content: [{ type: 'text', text: `No process found listening on port ${targetPort}` }], isError: true }
        targetPid = match.pid; targetPort = match.port
      }
      const sig = signal === 'SIGKILL' ? 'SIGKILL' : 'SIGTERM'
      try { process.kill(targetPid, sig) } catch (e) {
        if (e.code === 'ESRCH') return { content: [{ type: 'text', text: `Process ${targetPid} not found (already dead?)` }] }
        throw e
      }
      if (sig === 'SIGTERM') {
        await new Promise((r) => setTimeout(r, 2000))
        try { process.kill(targetPid, 0); process.kill(targetPid, 'SIGKILL')
          return { content: [{ type: 'text', text: `Process ${targetPid}${targetPort ? ` (port ${targetPort})` : ''} did not respond to SIGTERM, sent SIGKILL` }] }
        } catch { /* already dead */ }
      }
      return { content: [{ type: 'text', text: `Successfully killed process ${targetPid}${targetPort ? ` (port ${targetPort})` : ''} with ${sig}` }] }
    } catch (err) { return { content: [{ type: 'text', text: `Error killing process: ${err.message}` }], isError: true } }
  }
)

server.tool(
  'find_service', 'Search for services by name, project name, framework, or port number',
  { query: z.string().describe('Search query — matches against service name, project name, framework, port number, and cwd') },
  async ({ query }) => {
    try {
      const ports = await scanAndEnrich()
      const q = query.toLowerCase()
      const matches = ports.filter((p) =>
        String(p.port).includes(q) || p.name?.toLowerCase().includes(q) ||
        p.projectName?.toLowerCase().includes(q) || p.framework?.toLowerCase().includes(q) ||
        p.cwd?.toLowerCase().includes(q) || p.fullCommand?.toLowerCase().includes(q)
      )
      if (matches.length === 0) return { content: [{ type: 'text', text: `No services matching "${query}"` }] }
      return { content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }] }
    } catch (err) { return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true } }
  }
)

// ── Start ──

const transport = new StdioServerTransport()
await server.connect(transport)

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))
