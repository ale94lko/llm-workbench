#!/usr/bin/env node
/**
 * Copyright (c) 2026 llm-workbench contributors
 * SPDX-License-Identifier: MIT
 *
 * CI audit gate: `npm audit --audit-level=moderate` plus a narrow, dated
 * allowlist for advisories that still have no installable upstream fix.
 * Do not raise the audit level; remove entries once a patched release ships.
 *
 * Usage:
 *   node scripts/check-npm-audit.mjs
 *   node scripts/check-npm-audit.mjs --json <path>   # reuse an existing report
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Temporary exceptions only. Keep in sync with docs/dev-notes.md.
 * `expires` is exclusive (UTC midnight): on/after that date the exception fails CI.
 *
 * @type {ReadonlyArray<{ id: string, expires: string, reason: string }>}
 */
export const ACCEPTED_ADVISORIES = Object.freeze([
  {
    id: 'GHSA-86w9-cpqp-85rv',
    expires: '2026-11-20',
    reason:
      'node-forge <=1.4.0 (via listhen/nitropack) has no patched npm release yet; forge PR #1152 still open',
  },
  {
    id: 'GHSA-vfj7-8cjw-p6xm',
    expires: '2026-11-20',
    reason:
      'braces <=3.0.3 (via micromatch/globby/nitropack) has no patched npm release; upstream has not tagged a fix',
  },
])

/**
 * @param {string} isoDate YYYY-MM-DD
 * @param {Date} [now]
 */
export function isExpired(isoDate, now = new Date()) {
  const expiresAt = Date.parse(`${isoDate}T00:00:00.000Z`)
  if (Number.isNaN(expiresAt)) {
    throw new Error(`Invalid expires date: ${isoDate}`)
  }
  return now.getTime() >= expiresAt
}

/**
 * @param {unknown} via
 * @returns {string[]}
 */
export function advisoryIdsFromVia(via) {
  if (!Array.isArray(via)) return []
  const ids = []
  for (const entry of via) {
    if (typeof entry === 'string') continue
    if (!entry || typeof entry !== 'object') continue
    const url = typeof entry.url === 'string' ? entry.url : ''
    const match = /GHSA-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+/i.exec(url)
    if (match) {
      const m = /^GHSA-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)$/i.exec(match[0])
      if (m) ids.push(`GHSA-${m[1].toLowerCase()}-${m[2].toLowerCase()}-${m[3].toLowerCase()}`)
    }
  }
  return ids
}

/**
 * @param {object} report npm audit --json
 * @param {ReadonlyArray<{ id: string, expires: string, reason: string }>} accepted
 * @param {Date} [now]
 */
export function evaluateAudit(report, accepted = ACCEPTED_ADVISORIES, now = new Date()) {
  const acceptedById = new Map(accepted.map((item) => [item.id, item]))
  const blocking = []
  const allowed = []
  const expiredAllow = []

  const vulnerabilities = report?.vulnerabilities ?? {}
  for (const [name, info] of Object.entries(vulnerabilities)) {
    const ids = advisoryIdsFromVia(info?.via)
    if (ids.length === 0) {
      // Meta nodes that only reference other packages — skip if no direct advisory URL.
      if (Array.isArray(info?.via) && info.via.every((v) => typeof v === 'string')) continue
      blocking.push({ name, ids: [], detail: 'vulnerability without GHSA id in via[]' })
      continue
    }

    for (const id of ids) {
      const exception = acceptedById.get(id)
      if (!exception) {
        blocking.push({ name, ids: [id], detail: 'not in accepted advisory allowlist' })
        continue
      }
      if (isExpired(exception.expires, now)) {
        expiredAllow.push({ name, id, expires: exception.expires, reason: exception.reason })
        continue
      }
      allowed.push({ name, id, expires: exception.expires, reason: exception.reason })
    }
  }

  return { blocking, allowed, expiredAllow }
}

/**
 * @param {{ blocking: object[], allowed: object[], expiredAllow: object[] }} result
 */
export function formatAuditReport(result) {
  const lines = [
    'npm audit gate: fail on moderate+ unless documented in ACCEPTED_ADVISORIES (see docs/dev-notes.md).',
    `Allowed (dated): ${result.allowed.length}`,
    `Expired allowlist hits: ${result.expiredAllow.length}`,
    `Blocking: ${result.blocking.length}`,
  ]

  for (const item of result.allowed) {
    lines.push(`- allow ${item.id} via ${item.name} (expires ${item.expires})`)
  }
  for (const item of result.expiredAllow) {
    lines.push(`- EXPIRED ${item.id} via ${item.name} (was ${item.expires}): ${item.reason}`)
  }
  for (const item of result.blocking) {
    const idPart = item.ids.length ? item.ids.join(', ') : '(no id)'
    lines.push(`- BLOCK ${idPart} via ${item.name}: ${item.detail}`)
  }

  if (result.blocking.length === 0 && result.expiredAllow.length === 0) {
    lines.push('Audit gate: PASS')
  } else {
    lines.push('Audit gate: FAIL')
  }
  return lines.join('\n')
}

function loadAuditJson(argv) {
  const jsonFlag = argv.indexOf('--json')
  if (jsonFlag !== -1) {
    const path = argv[jsonFlag + 1]
    if (!path) throw new Error('--json requires a file path')
    return JSON.parse(readFileSync(path, 'utf8'))
  }

  // On Windows, spawning `npm` requires `shell: true` (Node EINVAL on npm.cmd).
  // Args are fixed literals — not user-controlled.
  const proc = spawnSync('npm', ['audit', '--json', '--audit-level=moderate'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    shell: process.platform === 'win32',
  })

  // npm audit exits non-zero when findings exist; still emits JSON on stdout.
  const raw = proc.stdout || ''
  if (!raw.trim()) {
    const err = (proc.stderr || '').trim() || `npm audit failed with status ${proc.status}`
    throw new Error(err)
  }
  return JSON.parse(raw)
}

function main() {
  let report
  try {
    report = loadAuditJson(process.argv.slice(2))
  } catch (error) {
    console.error(`Could not load npm audit report: ${error.message}`)
    process.exitCode = 2
    return
  }

  const result = evaluateAudit(report)
  console.log(formatAuditReport(result))
  if (result.blocking.length > 0 || result.expiredAllow.length > 0) {
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
