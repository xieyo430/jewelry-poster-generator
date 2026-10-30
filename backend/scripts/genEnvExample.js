#!/usr/bin/env node
/**
 * 由 src/configFields.js 生成 .env.example（单一事实源，勿手改目标文件）
 * 用法：npm run gen:env
 */
const fs = require('fs')
const path = require('path')
const { SETTINGS_FIELDS, ENV_ONLY_FIELDS } = require('../src/configFields')

const OUT = path.join(__dirname, '../.env.example')

function renderSection(title, fields) {
  const lines = [`# ===== ${title} =====`]
  for (const f of fields) {
    if (f.note) lines.push(`# ${f.note}`)
    const val = f.default ?? ''
    if (f.example && !val) lines.push(`# 示例: ${f.example}`)
    lines.push(`${f.key}=${val}`)
  }
  return lines.join('\n')
}

const blocks = [
  `# 本文件由 npm run gen:env 自动生成，请勿手改\n# 字段来源: backend/src/configFields.js（修改后重新生成）`,
]

const sections = {}
for (const f of ENV_ONLY_FIELDS) {
  ;(sections[f.section] ||= []).push(f)
}
for (const [title, fields] of Object.entries(sections)) {
  blocks.push(renderSection(title, fields))
}

const groups = {}
for (const f of SETTINGS_FIELDS) {
  ;(groups[f.group] ||= []).push(f)
}
for (const [title, fields] of Object.entries(groups)) {
  blocks.push(renderSection(title, fields))
}

fs.writeFileSync(OUT, blocks.join('\n\n') + '\n', 'utf8')
console.log('[gen:env] 已生成 .env.example，共', ENV_ONLY_FIELDS.length + SETTINGS_FIELDS.length, '个字段')
