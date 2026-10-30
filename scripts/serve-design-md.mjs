import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = await fs.realpath(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'third-party', 'awesome-design-md', 'design-md')
)
const port = Number(process.env.DESIGN_MD_PORT || 5175)

const MIME = {
  '.md': 'text/markdown; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}
const contentType = (filePath) => MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const renderIndex = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const links = entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const href = encodeURIComponent(entry.name) + (entry.isDirectory() ? '/' : '')
      return `<li><a href="${href}">${escapeHtml(entry.name)}${entry.isDirectory() ? '/' : ''}</a></li>`
    }).join('')
  return `<!doctype html><meta charset="utf-8"><title>Awesome DESIGN.md</title><style>body{max-width:960px;margin:40px auto;padding:0 20px;font:15px system-ui;color:#17191c}a{color:#4354c5}li{margin:8px 0}</style><h1>Awesome DESIGN.md</h1><p>本地设计语言参考库</p><ul>${links}</ul>`
}

// 路径必须解析在 root 之内：挡 ../ 穿越与指向目录外的符号链接
const resolveInsideRoot = (requestPath) => {
  const target = path.resolve(root, `.${requestPath}`)
  const rel = path.relative(root, target)
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null
  return target
}

const server = http.createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname)
    const resolved = resolveInsideRoot(requestPath)
    if (!resolved) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Forbidden')
      return
    }
    // realpath 会把目录内的符号链接展开，再校验一次，防止链接指向 root 外
    const target = await fs.realpath(resolved)
    const rel = path.relative(root, target)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Forbidden')
      return
    }
    const stats = await fs.stat(target)
    if (stats.isDirectory()) {
      const indexPath = path.join(target, 'README.md')
      try {
        const markdown = await fs.readFile(indexPath, 'utf8')
        response.writeHead(200, { 'Content-Type': contentType(indexPath) })
        response.end(markdown)
      } catch {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        response.end(await renderIndex(target))
      }
      return
    }
    response.writeHead(200, { 'Content-Type': contentType(target) })
    response.end(await fs.readFile(target))
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not found')
  }
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用，可设置 DESIGN_MD_PORT 环境变量换端口`)
  } else {
    console.error('设计资源服务器错误:', err.message)
  }
  process.exit(1)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Awesome DESIGN.md served at http://127.0.0.1:${port}/`)
})
