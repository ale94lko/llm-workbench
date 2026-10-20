// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import {
  CATEGORY_DROP_THRESHOLD,
  OVERALL_EPSILON,
  evaluateHealthScoreGate,
  formatHealthScoreReport,
  raiseBaseline,
} from '../scripts/check-health-score-gate.mjs'

const baseline = {
  overall: 80,
  categories: {
    'Dependency Health': 78,
    'History & Maintenance': 55,
  },
}

describe('health score gate', () => {
  it('passes when scores hold or improve', () => {
    const result = evaluateHealthScoreGate(baseline, {
      overall: 80.4,
      categories: { 'Dependency Health': 80, 'History & Maintenance': 55 },
    })
    expect(result.ok).toBe(true)
    expect(formatHealthScoreReport(result)).toContain('PASS')
  })

  it('fails when overall drops beyond epsilon', () => {
    const result = evaluateHealthScoreGate(baseline, {
      overall: baseline.overall - OVERALL_EPSILON - 0.1,
      categories: baseline.categories,
    })
    expect(result.ok).toBe(false)
    expect(result.regressions.some((r) => r.kind === 'overall')).toBe(true)
  })

  it('fails when a category drops by the threshold', () => {
    const result = evaluateHealthScoreGate(baseline, {
      overall: 80,
      categories: {
        'Dependency Health': 78 - CATEGORY_DROP_THRESHOLD,
        'History & Maintenance': 55,
      },
    })
    expect(result.ok).toBe(false)
    expect(result.regressions.some((r) => r.name === 'Dependency Health')).toBe(true)
  })

  it('ignores categories missing from latest', () => {
    const result = evaluateHealthScoreGate(baseline, { overall: 80, categories: {} })
    expect(result.ok).toBe(true)
  })

  it('formats allow-score-drop as pass when regressions exist', () => {
    const result = evaluateHealthScoreGate(baseline, { overall: 70, categories: baseline.categories })
    expect(formatHealthScoreReport(result, { allowScoreDrop: true })).toContain('allow-score-drop')
  })

  it('raises baseline only when latest is not worse', () => {
    const raised = raiseBaseline(baseline, {
      overall: 81,
      recordedAt: '2026-10-20',
      categories: { 'Dependency Health': 80, 'History & Maintenance': 55 },
    })
    expect(raised.overall).toBe(81)
    expect(raised.categories?.['Dependency Health']).toBe(80)
    expect(() => raiseBaseline(baseline, { overall: 70, categories: baseline.categories })).toThrow(
      /lower baseline/i,
    )
  })
})
