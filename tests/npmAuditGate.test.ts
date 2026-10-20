// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import {
  advisoryIdsFromVia,
  evaluateAudit,
  formatAuditReport,
  isExpired,
} from '../scripts/check-npm-audit.mjs'

describe('npm audit gate', () => {
  it('parses GHSA ids from advisory via entries', () => {
    expect(
      advisoryIdsFromVia([
        {
          source: 1,
          name: 'node-forge',
          url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
        },
        'listhen',
      ]),
    ).toEqual(['GHSA-86w9-cpqp-85rv'])
  })

  it('treats allowlisted advisories as pass before expiry', () => {
    const report = {
      vulnerabilities: {
        'node-forge': {
          via: [
            {
              name: 'node-forge',
              url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
            },
          ],
        },
      },
    }
    const accepted = [
      {
        id: 'GHSA-86w9-cpqp-85rv',
        expires: '2099-01-01',
        reason: 'test',
      },
    ]
    const result = evaluateAudit(report, accepted, new Date('2026-10-20T12:00:00Z'))
    expect(result.blocking).toEqual([])
    expect(result.allowed).toHaveLength(1)
    expect(formatAuditReport(result)).toContain('Audit gate: PASS')
  })

  it('fails expired allowlist entries and unknown advisories', () => {
    expect(isExpired('2026-10-20', new Date('2026-10-20T00:00:00Z'))).toBe(true)
    expect(isExpired('2026-10-20', new Date('2026-10-19T23:59:59Z'))).toBe(false)

    const report = {
      vulnerabilities: {
        braces: {
          via: [{ name: 'braces', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm' }],
        },
        other: {
          via: [{ name: 'other', url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc' }],
        },
      },
    }
    const accepted = [
      {
        id: 'GHSA-vfj7-8cjw-p6xm',
        expires: '2026-10-01',
        reason: 'stale',
      },
    ]
    const result = evaluateAudit(report, accepted, new Date('2026-10-20T12:00:00Z'))
    expect(result.expiredAllow).toHaveLength(1)
    expect(result.blocking).toHaveLength(1)
    expect(formatAuditReport(result)).toContain('Audit gate: FAIL')
  })
})
