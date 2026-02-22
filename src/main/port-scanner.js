import { exec } from 'child_process'
import { enrichPorts } from './service-enricher'

// Command name -> icon key mapping (exported for MCP server reuse)
export const COMMAND_ICON_MAP = {
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

// Well-known port -> icon key mapping (exported for MCP server reuse)
export const PORT_ICON_MAP = {
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

function parseLsof() {
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

export async function scanPorts() {
  const ports = await parseLsof()
  try {
    return await enrichPorts(ports)
  } catch {
    return ports
  }
}

export function killProcess(pid) {
  return new Promise((resolve) => {
    try {
      process.kill(pid, 'SIGTERM')
      setTimeout(() => {
        try {
          process.kill(pid, 0)
          process.kill(pid, 'SIGKILL')
        } catch (e) {
          // Already dead
        }
        resolve()
      }, 2000)
    } catch (e) {
      resolve()
    }
  })
}
