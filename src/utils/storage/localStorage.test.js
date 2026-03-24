/**
 * Tests for backup/restore and selected base utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  exportBackup, importBackup,
  getSelectedBase, saveSelectedBase,
  saveDCode, getDCode, addSCode, getSCodes, clearAllData,
} from './localStorage.js'

// ── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
})

// ── exportBackup ────────────────────────────────────────────────────────────

describe('exportBackup', () => {
  it('exports valid JSON with format marker', () => {
    saveDCode('D1-abc123')
    const json = exportBackup()
    const parsed = JSON.parse(json)
    expect(parsed._format).toBe('trajectory_backup')
    expect(parsed._version).toBe(1)
    expect(parsed._exported).toBeTruthy()
    expect(parsed.data.pfa_dcode).toBe('D1-abc123')
  })

  it('includes S-codes array', () => {
    addSCode('S3-test1')
    addSCode('S3-test2')
    const parsed = JSON.parse(exportBackup())
    const scodes = JSON.parse(parsed.data.pfa_scodes)
    expect(scodes).toEqual(['S3-test1', 'S3-test2'])
  })

  it('omits keys with no value', () => {
    const parsed = JSON.parse(exportBackup())
    expect(Object.keys(parsed.data).length).toBe(0)
  })

  it('includes selected base when set', () => {
    saveSelectedBase(3)
    const parsed = JSON.parse(exportBackup())
    expect(parsed.data.pfa_selected_base).toBe('3')
  })
})

// ── importBackup ────────────────────────────────────────────────────────────

describe('importBackup', () => {
  it('restores exported data', () => {
    saveDCode('D1-abc123')
    addSCode('S3-xyz')
    saveSelectedBase(5)
    const backup = exportBackup()
    localStorage.clear()

    const result = importBackup(backup)
    expect(result.ok).toBe(true)
    expect(result.keysRestored).toBeGreaterThanOrEqual(3)
    expect(getDCode()).toBe('D1-abc123')
    expect(getSCodes()).toEqual(['S3-xyz'])
    expect(getSelectedBase()).toBe(5)
  })

  it('rejects invalid JSON', () => {
    const result = importBackup('not json')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Invalid JSON')
  })

  it('rejects non-Trajectory JSON', () => {
    const result = importBackup(JSON.stringify({ foo: 'bar' }))
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Not a Trajectory backup file')
  })

  it('ignores unknown keys (no prototype pollution)', () => {
    const payload = JSON.stringify({
      _format: 'trajectory_backup',
      _version: 1,
      data: {
        pfa_dcode: 'D1-safe',
        __proto__: 'evil',
        constructor: 'evil',
        unknown_key: 'ignored',
      },
    })
    const result = importBackup(payload)
    expect(result.ok).toBe(true)
    expect(result.keysRestored).toBe(1) // only pfa_dcode
    expect(getDCode()).toBe('D1-safe')
  })
})

// ── getSelectedBase / saveSelectedBase ──────────────────────────────────────

describe('selectedBase', () => {
  it('defaults to 0', () => {
    expect(getSelectedBase()).toBe(0)
  })

  it('round-trips valid base IDs', () => {
    for (const id of [0, 1, 3, 7]) {
      saveSelectedBase(id)
      expect(getSelectedBase()).toBe(id)
    }
  })

  it('rejects out-of-range values', () => {
    localStorage.setItem('pfa_selected_base', '99')
    expect(getSelectedBase()).toBe(0)
  })
})

// ── clearAllData ────────────────────────────────────────────────────────────

describe('clearAllData', () => {
  it('clears selected base along with other data', () => {
    saveDCode('D1-test')
    saveSelectedBase(4)
    clearAllData()
    expect(getDCode()).toBeNull()
    expect(getSelectedBase()).toBe(0)
  })
})
