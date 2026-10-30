// 校验所有 EdIcon 用法引用的图标名都在 EdIcon.vue 的 PATHS 里存在。
// 用法: node scripts/check-icons.mjs   （退出码非 0 表示有未定义图标）
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.vue') ? [p] : []
  })
}

const iconFile = readFileSync(join(SRC, 'components/common/EdIcon.vue'), 'utf8')
const defined = new Set([...iconFile.matchAll(/^\s*'([a-z-]+)':\s*\[/gm)].map((m) => m[1]))

const used = new Map()
for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/<EdIcon[^>]*\bname="([^"]+)"/g)) used.set(m[1], file)
}

const missing = [...used].filter(([name]) => !defined.has(name))
console.log(`EdIcon: 定义 ${defined.size} 个，使用 ${used.size} 个`)
if (missing.length) {
  for (const [name, file] of missing) console.error(`  ✗ 未定义图标 "${name}" —— ${file}`)
  process.exit(1)
}
console.log('  ✓ 全部图标名有效')
