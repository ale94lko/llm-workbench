/**
 * Copyright (c) 2026 llm-workbench contributors
 * SPDX-License-Identifier: MIT
 *
 * Ensure source files carry a copyright year and SPDX license identifier
 * (OpenSSF Gold: copyright_per_file, license_per_file).
 *
 * Usage:
 *   node scripts/check-license-headers.mjs
 *   node scripts/check-license-headers.mjs --write
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const COPYRIGHT_RE = /Copyright \(c\) \d{4}(?:-\d{4})?/
export const SPDX_ID = 'SPDX-License-Identifier: MIT'

const SOURCE_EXTS = new Set(['.ts', '.js', '.mjs', '.cjs', '.vue', '.css'])
const SKIP_DIRS = new Set([
  '.git',
  '.nuxt',
  '.output',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'vendor',
])

/**
 * @param {string} content
 * @returns {boolean}
 */
export function hasRequiredHeaders(content) {
  return COPYRIGHT_RE.test(content) && content.includes(SPDX_ID)
}

/**
 * @param {string} ext
 * @returns {string}
 */
export function headerFor(ext) {
  if (ext === '.vue') {
    return '<!-- Copyright (c) 2026 llm-workbench contributors. SPDX-License-Identifier: MIT -->'
  }
  if (ext === '.css') {
    return '/* Copyright (c) 2026 llm-workbench contributors\n * SPDX-License-Identifier: MIT\n */'
  }
  return '// Copyright (c) 2026 llm-workbench contributors\n// SPDX-License-Identifier: MIT'
}

/**
 * @param {string} content
 * @param {string} ext
 * @returns {string}
 */
export function applyHeader(content, ext) {
  if (hasRequiredHeaders(content)) return content
  const header = headerFor(ext)
  const body = content.replace(/^\uFEFF/, '').replace(/^\n+/, '')
  if (body.startsWith('#!')) {
    const nl = body.indexOf('\n')
    const shebang = nl === -1 ? body : body.slice(0, nl)
    const rest = nl === -1 ? '' : body.slice(nl + 1).replace(/^\n+/, '')
    return `${shebang}\n${header}\n\n${rest}`
  }
  return `${header}\n\n${body}`
}

/**
 * @param {string} dir
 * @param {string[]} acc
 * @returns {string[]}
 */
export function listSourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      listSourceFiles(full, acc)
      continue
    }
    if (SOURCE_EXTS.has(extname(entry.name))) acc.push(full)
  }
  return acc
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function findMissingHeaderFiles(root) {
  return listSourceFiles(root).filter((file) => {
    const content = readFileSync(file, 'utf8')
    return !hasRequiredHeaders(content)
  })
}

function repoRoot() {
  return fileURLToPath(new URL('..', import.meta.url))
}

function main() {
  const root = repoRoot()
  const write = process.argv.includes('--write')
  const missing = findMissingHeaderFiles(root)
  if (write) {
    for (const file of missing) {
      const ext = extname(file)
      const next = applyHeader(readFileSync(file, 'utf8'), ext)
      writeFileSync(file, next)
    }
    console.log(`Wrote SPDX/copyright headers to ${missing.length} file(s)`)
    return
  }
  if (missing.length) {
    console.error('Missing copyright and/or SPDX-License-Identifier: MIT in:')
    for (const file of missing) console.error(` - ${relative(root, file).replaceAll('\\', '/')}`)
    console.error('\nFix with: node scripts/check-license-headers.mjs --write')
    process.exit(1)
  }
  console.log('License headers OK')
}

const invokedDirectly = process.argv[1]
  && process.argv[1].replaceAll('\\', '/').endsWith('scripts/check-license-headers.mjs')
if (invokedDirectly) main()
