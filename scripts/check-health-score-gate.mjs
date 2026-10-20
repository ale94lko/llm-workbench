#!/usr/bin/env node
/**
 * Copyright (c) 2026 llm-workbench contributors
 * SPDX-License-Identifier: MIT
 *
 * Compare docs/health-score-latest.json to docs/health-score-baseline.json.
 * Fails when overall drops by more than OVERALL_EPSILON or any shared category
 * drops by CATEGORY_DROP_THRESHOLD or more (unless allowScoreDrop is set).
 *
 * Usage:
 *   node scripts/check-health-score-gate.mjs [--baseline path] [--latest path] [--allow-score-drop]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const OVERALL_EPSILON = 0.5
export const CATEGORY_DROP_THRESHOLD = 3

/**
 * @param {unknown} value
 * @returns {asserts value is { overall: number, categories?: Record<string, number> }}
 */
export function assertScoreShape(value, label) {
  if (!value || typeof value !== 'object') {
    throw new Error(`${label} must be a JSON object`)
  }
  const overall = /** @type {{ overall?: unknown }} */ (value).overall
  if (typeof overall !== 'number' || Number.isNaN(overall)) {
    throw new Error(`${label}.overall must be a number`)
  }
  const categories = /** @type {{ categories?: unknown }} */ (value).categories
  if (categories !== undefined) {
    if (!categories || typeof categories !== 'object' || Array.isArray(categories)) {
      throw new Error(`${label}.categories must be an object when present`)
    }
    for (const [name, score] of Object.entries(categories)) {
      if (typeof score !== 'number' || Number.isNaN(score)) {
        throw new Error(`${label}.categories[${name}] must be a number`)
      }
    }
  }
}

/**
 * @param {{ overall: number, categories?: Record<string, number> }} baseline
 * @param {{ overall: number, categories?: Record<string, number> }} latest
 * @param {{ overallEpsilon?: number, categoryDropThreshold?: number }} [opts]
 */
export function evaluateHealthScoreGate(baseline, latest, opts = {}) {
  const overallEpsilon = opts.overallEpsilon ?? OVERALL_EPSILON
  const categoryDropThreshold = opts.categoryDropThreshold ?? CATEGORY_DROP_THRESHOLD
  /** @type {{ kind: 'overall' | 'category', name?: string, baseline: number, latest: number, drop: number }[]} */
  const regressions = []

  const overallDrop = baseline.overall - latest.overall
  if (overallDrop > overallEpsilon) {
    regressions.push({
      kind: 'overall',
      baseline: baseline.overall,
      latest: latest.overall,
      drop: overallDrop,
    })
  }

  const baselineCats = baseline.categories ?? {}
  const latestCats = latest.categories ?? {}
  for (const [name, baseScore] of Object.entries(baselineCats)) {
    if (!(name in latestCats)) continue
    const latestScore = latestCats[name]
    const drop = baseScore - latestScore
    if (drop >= categoryDropThreshold) {
      regressions.push({
        kind: 'category',
        name,
        baseline: baseScore,
        latest: latestScore,
        drop,
      })
    }
  }

  return {
    ok: regressions.length === 0,
    regressions,
    overallDelta: latest.overall - baseline.overall,
  }
}

/**
 * @param {ReturnType<typeof evaluateHealthScoreGate>} result
 * @param {{ allowScoreDrop?: boolean }} [opts]
 */
export function formatHealthScoreReport(result, opts = {}) {
  const lines = [
    'Repo health score gate (see docs/health-score-baseline.json).',
    `Overall delta (latest − baseline): ${result.overallDelta.toFixed(1)}`,
    `Allow score drop: ${opts.allowScoreDrop ? 'yes' : 'no'}`,
  ]

  if (result.regressions.length === 0) {
    lines.push('Health score gate: PASS')
    return lines.join('\n')
  }

  lines.push('Regressions:')
  for (const item of result.regressions) {
    if (item.kind === 'overall') {
      lines.push(
        `- overall: ${item.baseline} → ${item.latest} (drop ${item.drop.toFixed(1)}; epsilon ${OVERALL_EPSILON})`,
      )
    } else {
      lines.push(
        `- category "${item.name}": ${item.baseline} → ${item.latest} (drop ${item.drop}; threshold ${CATEGORY_DROP_THRESHOLD})`,
      )
    }
  }

  if (opts.allowScoreDrop) {
    lines.push('Health score gate: PASS (allow-score-drop)')
  } else {
    lines.push('Health score gate: FAIL')
  }
  return lines.join('\n')
}

/**
 * Raise baseline to latest when latest is not worse (overall + every shared category).
 * @param {object} baseline
 * @param {object} latest
 */
export function raiseBaseline(baseline, latest) {
  assertScoreShape(baseline, 'baseline')
  assertScoreShape(latest, 'latest')
  if (latest.overall < baseline.overall) {
    throw new Error('Refusing to lower baseline overall; latest is worse than baseline')
  }
  const nextCategories = { ...(baseline.categories ?? {}) }
  for (const [name, score] of Object.entries(latest.categories ?? {})) {
    const prev = nextCategories[name]
    if (prev === undefined || score >= prev) nextCategories[name] = score
  }
  return {
    ...baseline,
    overall: latest.overall,
    categories: nextCategories,
    recordedAt: latest.recordedAt ?? new Date().toISOString().slice(0, 10),
    source: latest.source ?? baseline.source,
  }
}

function parseArgs(argv) {
  /** @type {{ baseline: string, latest: string, allowScoreDrop: boolean, updateBaseline: boolean, writeBaseline?: string }} */
  const out = {
    baseline: 'docs/health-score-baseline.json',
    latest: 'docs/health-score-latest.json',
    allowScoreDrop: false,
    updateBaseline: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--baseline') out.baseline = argv[++i]
    else if (arg === '--latest') out.latest = argv[++i]
    else if (arg === '--allow-score-drop') out.allowScoreDrop = true
    else if (arg === '--update-baseline') out.updateBaseline = true
    else if (arg === '--write-baseline') out.writeBaseline = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return out
}

function main() {
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
    return
  }

  let baseline
  let latest
  try {
    baseline = JSON.parse(readFileSync(args.baseline, 'utf8'))
    latest = JSON.parse(readFileSync(args.latest, 'utf8'))
    assertScoreShape(baseline, 'baseline')
    assertScoreShape(latest, 'latest')
  } catch (error) {
    console.error(`Could not load score JSON: ${error.message}`)
    process.exitCode = 2
    return
  }

  if (args.updateBaseline) {
    try {
      const raised = raiseBaseline(baseline, latest)
      const target = args.writeBaseline ?? args.baseline
      writeFileSync(target, `${JSON.stringify(raised, null, 2)}\n`)
      console.log(`Updated baseline at ${target} (overall ${baseline.overall} → ${raised.overall})`)
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
    }
    return
  }

  const result = evaluateHealthScoreGate(baseline, latest)
  console.log(formatHealthScoreReport(result, { allowScoreDrop: args.allowScoreDrop }))
  if (!result.ok && !args.allowScoreDrop) process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
